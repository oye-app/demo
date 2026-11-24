// Supabase Edge Function: start-call
// Follows Contract A from OYE TRD
// Secret required: MAKE_START_CALL_URL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { person_id } = await req.json();
    if (!person_id) {
      return new Response(JSON.stringify({ error: "person_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const makeUrl = Deno.env.get("MAKE_START_CALL_URL");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load person
    const { data: senior, error: seniorError } = await supabase
      .from("seniors")
      .select("id, name, phone, age")
      .eq("id", person_id)
      .single();

    if (seniorError || !senior) {
      return new Response(JSON.stringify({ error: "Persona no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load relation, recent completed calls, and care sheet in parallel
    const [{ data: link }, { data: recentCompleted }, { data: seniorCare }] = await Promise.all([
      supabase
        .from("person_links")
        .select("relation")
        .eq("senior_id", person_id)
        .maybeSingle(),
      supabase
        .from("call_logs")
        .select("nivel_alerta, global_pct, motivo, created_at, report")
        .eq("person_id", person_id)
        .eq("status", "completada")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("senior_care")
        .select("key_contact_name, key_contact_phone, meds, appointments, birthday")
        .eq("senior_id", person_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const relationship = link?.relation || "Familiar";
    const latest = recentCompleted?.[0] ?? null;
    const latestRep = latest?.report && typeof latest.report === "object" ? latest.report as Record<string, unknown> : null;
    const last_call_memory = String(
      latestRep?.oye_recuerda_insight || latestRep?.nota_memoria || latestRep?.summary || latest?.motivo || "Primera llamada registrada sin incidencias previas."
    ).slice(0, 420);
    const last_alert_level = String(latest?.nivel_alerta || latestRep?.nivel_alerta || "VERDE");
    const green_streak = (recentCompleted ?? []).findIndex((r) => (r.nivel_alerta || "VERDE") !== "VERDE");
    const resolvedStreak = green_streak === -1 ? (recentCompleted ?? []).length : green_streak;

    // Format phone to E.164 without spaces
    let rawPhone = (senior.phone || "").replace(/[^\d+]/g, "");
    if (rawPhone.startsWith("00")) {
      rawPhone = "+" + rawPhone.slice(2);
    } else if (!rawPhone.startsWith("+")) {
      if (rawPhone.length === 9) {
        rawPhone = "+34" + rawPhone;
      } else {
        rawPhone = "+" + rawPhone;
      }
    }

    const payload = {
      person_id: senior.id,
      name: senior.name,
      phone: rawPhone,
      age: senior.age ?? null,
      relationship,
      last_call_memory,
      last_alert_level,
      medications: seniorCare?.meds || "Ninguna especificada",
      appointments: seniorCare?.appointments || "Sin citas próximas registradas",
      birthday: seniorCare?.birthday || "",
      key_contact: [seniorCare?.key_contact_name, seniorCare?.key_contact_phone].filter(Boolean).join(" · "),
      green_streak: resolvedStreak,
      call_mode_hint: resolvedStreak >= 3 && last_alert_level === "VERDE" ? "charla_breve_90s" : "seguimiento_cercano_3min",
    };

    if (!makeUrl) {
      return new Response(
        JSON.stringify({
          error: "Falta configurar MAKE_START_CALL_URL en los secretos del proyecto",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeRes = await fetch(makeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!makeRes.ok) {
      const err = await makeRes.text();
      return new Response(
        JSON.stringify({ error: "Error al llamar al webhook de Make S1", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeData = await makeRes.json();
    return new Response(JSON.stringify({ ok: true, ...makeData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
