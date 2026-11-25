import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function madridWeekdayInfo(now = new Date()): {
  labelEs: string;
  exactDayRegex: RegExp;
  broadRegex: RegExp;
} {
  const wd = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "long" }).format(now).toLowerCase();
  if (wd.startsWith("lunes")) return { labelEs: "lunes", exactDayRegex: /\blunes\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("martes")) return { labelEs: "martes", exactDayRegex: /\bmartes\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("miércoles") || wd.startsWith("miercoles")) return { labelEs: "miércoles", exactDayRegex: /mi[eé]rcoles/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("jueves")) return { labelEs: "jueves", exactDayRegex: /\bjueves\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("viernes")) return { labelEs: "viernes", exactDayRegex: /\bviernes\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("sábado") || wd.startsWith("sabado")) return { labelEs: "sábado", exactDayRegex: /s[aá]bado/i, broadRegex: /(l-s|todos los d[ií]as)/i };
  return { labelEs: "domingo", exactDayRegex: /\bdomingo\b/i, broadRegex: /todos los d[ií]as/i };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawCaller = String(
      body.caller_id ?? body.from ?? body.from_number ?? body.phone_number ?? body.phone ?? ""
    ).trim();
    const explicitPersonId = typeof body.person_id === "string" ? body.person_id.trim() : "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const sb = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    let senior: {
      id: string;
      name: string;
      age: number | null;
      phone: string;
      neighborhood: string;
      is_demo: boolean;
    } | null = null;

    if (sb) {
      if (explicitPersonId) {
        const { data } = await sb
          .from("seniors")
          .select("id, name, age, phone, neighborhood, is_demo")
          .eq("id", explicitPersonId)
          .eq("active", true)
          .maybeSingle();
        if (data) senior = data;
      } else if (rawCaller) {
        const digits = rawCaller.replace(/\D/g, "");
        const suffix9 = digits.slice(-9);
        if (suffix9.length >= 7) {
          const { data: candidates } = await sb
            .from("seniors")
            .select("id, name, age, phone, neighborhood, is_demo, updated_at")
            .eq("active", true)
            .ilike("phone", `%${suffix9}%`)
            .order("is_demo", { ascending: true })
            .order("updated_at", { ascending: false })
            .limit(1);
          if (candidates && candidates[0]) {
            senior = candidates[0];
          }
        }
      }
    }

    if (!senior || !sb) {
      return new Response(
        JSON.stringify({
          type: "conversation_initiation_client_data",
          matched_senior: false,
          latency_ms: Date.now() - t0,
          dynamic_variables: {
            person_id: "",
            name: "",
            relationship: "Familiar",
            last_call_memory: "Llamada entrante de número aún no vinculado en ficha. Saluda con calidez y pregunta su nombre.",
            last_alert_level: "VERDE",
            life_memories: "",
            pending_followups: "",
            neighborhood_plan: "",
            clinical_focus_mode: "celebrar_vinculo",
            medications: "No especificadas",
            appointments: "Sin citas registradas",
            key_contact: "",
            call_mode_hint: "seguimiento_cercano_3min",
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [{ data: careRow }, { data: linkRow }, { data: recentCalls }, { data: resources }] = await Promise.all([
      sb
        .from("senior_care")
        .select("key_contact_name, key_contact_phone, meds, appointments, birthday")
        .eq("senior_id", senior.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      sb
        .from("person_links")
        .select("relation")
        .eq("senior_id", senior.id)
        .maybeSingle(),
      sb
        .from("call_logs")
        .select("nivel_alerta, global_pct, motivo, created_at, report")
        .eq("person_id", senior.id)
        .eq("status", "completada")
        .order("created_at", { ascending: false })
        .limit(5),
      sb
        .from("community_resources")
        .select("name, category, neighborhood, schedule")
        .eq("active", true)
        .limit(20),
    ]);

    const calls = recentCalls ?? [];
    const latest = calls[0] ?? null;
    const latestRep = (latest?.report ?? null) as Record<string, any> | null;

    const lastCallMemory = String(
      latestRep?.oye_recuerda_insight ||
        latestRep?.nota_memoria ||
        latestRep?.summary ||
        latest?.motivo ||
        "Primera conversación registrada."
    ).slice(0, 420);

    const lastAlertLevel = String(latest?.nivel_alerta || latestRep?.nivel_alerta || "VERDE");

    // Extract up to 3 distinct autobiographical memories across recent calls
    const seenMem = new Set<string>();
    const lifeMemList: string[] = [];
    for (const c of calls) {
      const rep = (c.report ?? null) as Record<string, any> | null;
      const mem = typeof rep?.recuerdo_biografico_nuevo === "string" ? rep.recuerdo_biografico_nuevo.trim() : "";
      if (mem.length > 5 && !seenMem.has(mem.toLowerCase())) {
        seenMem.add(mem.toLowerCase());
        lifeMemList.push(mem);
      }
      if (lifeMemList.length >= 3) break;
    }

    // Build pending clinical follow-ups from latest call
    const followups: string[] = [];
    const auto = latestRep?.evaluacion_escalas?.autocuidado_y_salud;
    if (auto?.adherencia_medicacion === "NO_TOMADA" || auto?.adherencia_medicacion === "DUDOSA") {
      followups.push(`Confirmar hoy toma de medicación (${careRow?.meds || "pauta habitual"})`);
    }
    if (auto?.sueno_descanso === "ALERTA" || auto?.sueno_descanso === "INSOMNIO_FATIGA") {
      followups.push("Preguntar si descansó mejor anoche");
    }
    if (auto?.alimentacion_hidratacion === "ALERTA" || auto?.alimentacion_hidratacion === "DESCUIDO") {
      followups.push("Validar si pudo comer e hidratarse bien hoy");
    }

    // Match neighborhood community resource for today in Madrid timezone (prefer exact weekday match)
    const { labelEs, exactDayRegex, broadRegex } = madridWeekdayInfo();
    const normHood = (senior.neighborhood || "Chamberí").toLowerCase();
    const hoodResources = (resources ?? []).filter((r) => (r.neighborhood || "").toLowerCase() === normHood);
    const pool = hoodResources.length > 0 ? hoodResources : resources ?? [];
    const todayMatch =
      pool.find((r) => exactDayRegex.test(r.schedule || "") && r.category !== "servicios_sociales") ||
      pool.find((r) => broadRegex.test(r.schedule || "") && r.category !== "servicios_sociales") ||
      pool.find((r) => r.category === "centro_mayores" || r.category === "paseo_salud") ||
      pool[0] ||
      null;

    const neighborhoodPlan = todayMatch
      ? `Plan real para hoy ${labelEs} en ${todayMatch.neighborhood}: ${todayMatch.name} (${todayMatch.schedule}).`
      : "";

    let greenStreak = 0;
    for (const c of calls) {
      const rep = (c.report ?? null) as Record<string, any> | null;
      const lvl = String(c.nivel_alerta || rep?.nivel_alerta || "VERDE");
      if (lvl === "VERDE") greenStreak++;
      else break;
    }

    const ucla = Number(latestRep?.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada ?? 3);
    const clinicalFocusMode =
      followups.some((f) => f.includes("medicación"))
        ? "vigilancia_adherencia"
        : ucla >= 6
        ? "acompanamiento_soledad"
        : followups.length > 0
        ? "seguimiento_sintoma"
        : "celebrar_vinculo";

    const keyContact = [careRow?.key_contact_name?.trim(), careRow?.key_contact_phone?.trim()].filter(Boolean).join(" · ");

    return new Response(
      JSON.stringify({
        type: "conversation_initiation_client_data",
        matched_senior: true,
        latency_ms: Date.now() - t0,
        dynamic_variables: {
          person_id: senior.id,
          name: senior.name,
          age: senior.age ?? "",
          relationship: linkRow?.relation || "Familiar",
          last_call_memory: lastCallMemory,
          last_alert_level: lastAlertLevel,
          life_memories: lifeMemList.join(" | "),
          pending_followups: followups.join("; "),
          neighborhood_plan: neighborhoodPlan,
          clinical_focus_mode: clinicalFocusMode,
          medications: careRow?.meds || "Ninguna especificada",
          appointments: careRow?.appointments || "Sin citas próximas",
          birthday: careRow?.birthday || "",
          key_contact: keyContact,
          green_streak: greenStreak,
          call_mode_hint: "seguimiento_cercano_3min",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error resolving inbound senior context", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
