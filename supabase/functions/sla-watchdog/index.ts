import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getMadridHourAndDate(now = new Date()): { hour: number; dateKey: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    hour: Number(parts.hour ?? 12),
    dateKey: `${parts.year ?? "2026"}-${parts.month ?? "01"}-${parts.day ?? "01"}`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const givenCronSecret = req.headers.get("x-cron-secret") || "";
    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;

    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: "Supabase runtime config missing" }, { status: 500, headers: corsHeaders });
    }

    let authorized = Boolean(cronSecret && givenCronSecret && cronSecret === givenCronSecret);
    if (!authorized && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token.split(".").length === 3 && anonKey) {
        const userSb = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: uData } = await userSb.auth.getUser(token);
        if (uData?.user) {
          const { data: isOp } = await userSb.rpc("is_console_operator");
          if (isOp) authorized = true;
        }
      }
    }

    if (!authorized) {
      return Response.json(
        { error: "Requiere sesión de operador o x-cron-secret autorizado" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const dryRun = Boolean(body.dry_run);
    const healStuck = body.heal_stuck_calls !== false;
    const dispatchRetries = Boolean(body.dispatch_retries);

    const sb = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const { hour: madridHour, dateKey } = getMadridHourAndDate(now);
    const quietHours = madridHour >= 22 || madridHour < 8;

    // 1. Detect & recover calls stuck in 'llamando' / 'analizando' for > 15 minutes
    const stuckCutoffIso = new Date(now.getTime() - 15 * 60_000).toISOString();
    const { data: stuckRows } = await sb
      .from("call_logs")
      .select("id, conversation_id, person_id, nombre, status, created_at")
      .in("status", ["llamando", "analizando"])
      .lt("created_at", stuckCutoffIso)
      .limit(25);

    let healedCount = 0;
    if (!dryRun && healStuck && stuckRows && stuckRows.length > 0) {
      for (const row of stuckRows) {
        const { error: updErr } = await sb
          .from("call_logs")
          .update({
            status: "no_contesta",
            motivo: "Sin respuesta o cierre técnico tras 15 min (recuperación automática Watchdog SLA).",
          })
          .eq("id", row.id)
          .in("status", ["llamando", "analizando"]);
        if (!updErr) healedCount += 1;
      }
    }

    // 2. Inspect open alerts & SLA breaches (> 30 min / > 60 min)
    const { data: openAlerts } = await sb
      .from("alerts")
      .select("id, senior_id, senior_name, mood, created_at")
      .in("status", ["open", "accepted"])
      .limit(200);

    let slaWarning30 = 0;
    let slaCritical60 = 0;
    for (const a of openAlerts ?? []) {
      const ageMin = (now.getTime() - +new Date(a.created_at)) / 60_000;
      if (ageMin >= 60) slaCritical60 += 1;
      else if (ageMin >= 30) slaWarning30 += 1;
    }

    // 3. Evaluate eligible no_contesta calls from 15..90 min ago for Telecross retry (max 2/day, never during quiet hours)
    const retryFromIso = new Date(now.getTime() - 90 * 60_000).toISOString();
    const retryToIso = new Date(now.getTime() - 15 * 60_000).toISOString();
    const { data: noAnswerCandidates } = await sb
      .from("call_logs")
      .select("id, person_id, nombre, telefono_usuario, created_at")
      .eq("status", "no_contesta")
      .gte("created_at", retryFromIso)
      .lte("created_at", retryToIso)
      .limit(20);

    const uniqueRetrySeniors = new Map<string, { person_id: string; nombre: string; phone: string }>();
    for (const r of noAnswerCandidates ?? []) {
      if (r.person_id && !uniqueRetrySeniors.has(r.person_id)) {
        uniqueRetrySeniors.set(r.person_id, {
          person_id: r.person_id,
          nombre: r.nombre || "Persona",
          phone: r.telefono_usuario || "",
        });
      }
    }

    let retriesDispatched = 0;
    const makeUrl = Deno.env.get("MAKE_START_CALL_URL");
    if (!dryRun && dispatchRetries && !quietHours && makeUrl && uniqueRetrySeniors.size > 0) {
      for (const item of uniqueRetrySeniors.values()) {
        // Verify active schedule & cap to 2 auto-retries/day via call_logs count today
        const todayStart = `${dateKey}T00:00:00Z`;
        const { count: todayAttempts } = await sb
          .from("call_logs")
          .select("id", { count: "exact", head: true })
          .eq("person_id", item.person_id)
          .gte("created_at", todayStart);
        if ((todayAttempts ?? 0) >= 3) continue;

        const res = await fetch(makeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person_id: item.person_id,
            name: item.nombre,
            phone: item.phone,
            retry_reason: "telecross_auto_retry_15m",
          }),
        }).catch(() => null);
        if (res?.ok) retriesDispatched += 1;
      }
    }

    return Response.json(
      {
        ok: true,
        mode: dryRun ? "dry_run" : "executed",
        madrid_hour: madridHour,
        quiet_hours_blocked: quietHours,
        stuck_calls_found: stuckRows?.length ?? 0,
        stuck_calls_healed: healedCount,
        open_alerts_total: openAlerts?.length ?? 0,
        sla_warning_30m: slaWarning30,
        sla_critical_60m: slaCritical60,
        no_answer_retry_candidates: uniqueRetrySeniors.size,
        retries_dispatched: retriesDispatched,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return Response.json(
      { error: "Watchdog execution error", details: String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
});
