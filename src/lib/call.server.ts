import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Line } from "./scenarios";
import type { CallAnalysis } from "./call.functions";

export class AiError extends Error {
  constructor(msg: string, public status = 500) {
    super(msg);
  }
}

/** Analyze a call with memory of past calls and store both the alert and the call_log. */
export async function runCallAnalysis(
  sb: SupabaseClient<Database>,
  userId: string,
  data: { seniorId: string; seniorName: string; lines: Line[] }
): Promise<CallAnalysis> {
  const { data: person } = await sb
    .from("seniors")
    .select("id, name, phone, neighborhood")
    .eq("id", data.seniorId)
    .maybeSingle();

  if (!person) throw new Error("Persona no disponible.");
  const seniorName = person.name || data.seniorName || "Carmen";
  const firstName = seniorName.trim().split(/\s+/)[0] || "Carmen";

  const transcript = data.lines
    .map((l) => `${l.who === "oye" ? "OYE" : seniorName}: ${l.text}`)
    .join("\n");

  const durationSec = Math.max(45, Math.round(data.lines.length * 18));
  const durationMin = Math.max(1, Math.round(durationSec / 60));

  const supabaseUrl =
    process.env["VITE_SUPABASE_URL"] || "https://lkbplpptjkajtyvcdier.supabase.co";

  // Call our Supabase Edge Function 'analyze-call'
  let reportObj: any = null;
  try {
    const fnRes = await fetch(`${supabaseUrl}/functions/v1/analyze-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: seniorName,
        phone: person.phone || "+34678617031",
        duration_sec: durationSec,
        transcript,
      }),
    });
    if (fnRes.ok) {
      reportObj = await fnRes.json();
    }
  } catch (err) {
    console.warn("[runCallAnalysis] Edge Function fallback:", err);
  }

  const nivel = reportObj?.nivel_alerta || "VERDE";
  const mood: CallAnalysis["mood"] =
    nivel === "ROJO" || nivel === "AMARILLO" ? "bajo" : "bien";
  const need: CallAnalysis["need"] =
    nivel === "ROJO" ? "visita" : nivel === "AMARILLO" ? "compania" : "ninguna";
  const summary: string =
    reportObj?.summary ||
    `${firstName} conversó con OYE durante ${durationMin} min y se encuentra bien.`;
  const signals: string[] = Array.isArray(reportObj?.top_badges)
    ? reportObj.top_badges.slice(0, 4)
    : ["Medicación al día", "Buen descanso"];
  const memory: string =
    reportObj?.oye_recuerda_insight ||
    `${firstName} mantiene estabilidad en su rutina y conversación.`;
  const loneliness = Number(
    reportObj?.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada ?? 3
  );
  const trend: CallAnalysis["trend"] = "igual";
  const needsHuman = need !== "ninguna";

  // 1. Insert into call_logs so the main dashboard & history also reflect the simulation
  await sb.from("call_logs").insert({
    conversation_id: `sim-${crypto.randomUUID()}`,
    person_id: data.seniorId,
    nombre: firstName,
    telefono_usuario: person.phone || "+34678617031",
    status: "completada",
    duracion_seg: durationSec,
    llamada_inicio: new Date().toISOString(),
    nivel_alerta: nivel,
    global_pct: reportObj?.global_pct ?? 90,
    activar_protocolo_voy_yo: needsHuman,
    acepta_llamada: true,
    acepta_llamadas_diarias: true,
    motivo: summary,
    report: reportObj,
  });

  // 2. Insert into alerts for legacy compatibility
  const { data: row } = await sb
    .from("alerts")
    .insert({
      senior_id: data.seniorId,
      is_simulated: true,
      senior_name: seniorName,
      mood,
      need,
      summary,
      signals,
      transcript: data.lines,
      memory_note: memory,
      duration_min: durationMin,
      loneliness_score: loneliness,
      neighborhood: person.neighborhood || "Chamberí",
      trend,
      status: needsHuman ? "open" : "closed",
      family_notified: true,
      created_by: userId,
    })
    .select("id")
    .maybeSingle();

  return {
    mood,
    need,
    summary,
    signals,
    memory,
    trend,
    loneliness,
    durationMin,
    alertId: row?.id ?? null,
    familyNotified: true,
  };
}
