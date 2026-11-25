import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawPersonId = typeof body.person_id === "string" ? body.person_id.trim() : "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id.trim() : "";
    const category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : "emergencia_voz";
    const quoteVerbatim = typeof body.quote_verbatim === "string" ? body.quote_verbatim.trim().slice(0, 280) : "";
    const summary =
      typeof body.summary === "string" && body.summary.trim()
        ? body.summary.trim().slice(0, 420)
        : `Alerta crítica activada en vivo durante la llamada (${category}).`;
    const dryRun = Boolean(body.dry_run) || rawPersonId.startsWith("test-only");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const sb = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    let senior: {
      id: string;
      name: string;
      neighborhood: string;
      is_demo: boolean;
    } | null = null;

    let keyContactName = "";
    let keyContactPhone = "";

    if (sb && !rawPersonId.startsWith("test-only")) {
      if (rawPersonId) {
        const { data } = await sb
          .from("seniors")
          .select("id, name, neighborhood, is_demo")
          .eq("id", rawPersonId)
          .maybeSingle();
        if (data) senior = data;
      } else if (rawPhone) {
        const suffix9 = rawPhone.replace(/\D/g, "").slice(-9);
        if (suffix9.length >= 7) {
          const { data } = await sb
            .from("seniors")
            .select("id, name, neighborhood, is_demo")
            .eq("active", true)
            .ilike("phone", `%${suffix9}%`)
            .order("is_demo", { ascending: true })
            .limit(1);
          if (data?.[0]) senior = data[0];
        }
      }

      if (senior) {
        const { data: careRow } = await sb
          .from("senior_care")
          .select("key_contact_name, key_contact_phone")
          .eq("senior_id", senior.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        keyContactName = careRow?.key_contact_name?.trim() || "";
        keyContactPhone = careRow?.key_contact_phone?.trim() || "";
      }
    }

    const firstName = (senior?.name || "la persona").split(/\s+/)[0] || "la persona";
    let alertId: string | null = null;
    let interventionId: string | null = null;

    if (sb && senior && !dryRun) {
      const needMap =
        /caida|dolor_pecho|ahogo|hemorragia/i.test(category) ? "urgencia" : "visita";

      const { data: alertRow } = await sb
        .from("alerts")
        .insert({
          senior_id: senior.id,
          senior_name: senior.name,
          mood: "critico",
          need: needMap,
          summary,
          signals: [quoteVerbatim || `Urgencia intra-llamada: ${category}`],
          transcript: quoteVerbatim ? [{ who: "persona", text: quoteVerbatim }] : [],
          status: "open",
          family_notified: false,
          neighborhood: senior.neighborhood || "Chamberí",
          trend: "descenso",
          memory_note: `Alerta activada en vivo por agente durante llamada (${category}).`,
          is_simulated: false,
        })
        .select("id")
        .maybeSingle();

      alertId = alertRow?.id ?? null;

      const { data: intRow } = await sb
        .from("care_interventions")
        .insert({
          senior_id: senior.id,
          alert_id: alertId,
          author_name: "OYE IA Tiempo Real",
          category: "emergencia_intra_llamada",
          ring: 1,
          title: `Urgencia en llamada (${category})`,
          details: quoteVerbatim ? `${summary} · Cita: «${quoteVerbatim}»` : summary,
          outcome: "activada_en_llamada",
          is_demo: Boolean(senior.is_demo),
        })
        .select("id")
        .maybeSingle();

      interventionId = intRow?.id ?? null;

      if (conversationId) {
        await sb.from("call_logs").upsert(
          {
            conversation_id: conversationId,
            person_id: senior.id,
            nombre: firstName,
            status: "urgencia_en_curso",
            nivel_alerta: "ROJO",
            activar_protocolo_voy_yo: true,
            motivo: summary,
          },
          { onConflict: "conversation_id" }
        );
      }

      const emergencyHook = Deno.env.get("MAKE_EMERGENCY_WEBHOOK_URL");
      if (emergencyHook) {
        void fetch(emergencyHook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "oye.mid_call_emergency",
            alert_id: alertId,
            senior_id: senior.id,
            senior_name: senior.name,
            category,
            summary,
            quote_verbatim: quoteVerbatim,
            key_contact_name: keyContactName,
            key_contact_phone: keyContactPhone,
          }),
        }).catch(() => {});
      }
    }

    const contactInstruction = keyContactName
      ? `Ya hemos activado el aviso urgente para ${keyContactName}${keyContactPhone ? ` (${keyContactPhone})` : ""} y nuestro equipo.`
      : "Ya hemos activado el aviso urgente con tu red de apoyo y coordinación.";

    return new Response(
      JSON.stringify({
        ok: true,
        mode: dryRun ? "dry_run" : "dispatched_live",
        latency_ms: Date.now() - t0,
        alert_id: alertId,
        intervention_id: interventionId,
        category,
        key_contact_name: keyContactName || null,
        key_contact_phone: keyContactPhone || null,
        agent_containment_script: `Mantén la calma, ${firstName}, estoy aquí contigo en la línea. ${contactInstruction} Si notas dolor fuerte en el pecho, falta de aire o no puedes levantarte tras una caída, dime si necesitas que llamemos ahora al 112.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error in mid-call-alert", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
