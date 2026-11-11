import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Line } from "./scenarios";
import type { CallAnalysis } from "./call.functions";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["mood", "need", "summary", "signals", "memory", "trend", "loneliness"],
  properties: {
    mood: { type: "string", enum: ["bien", "bajo", "no_contesta"] },
    need: { type: "string", enum: ["ninguna", "compania", "llamada", "visita"] },
    summary: { type: "string" },
    signals: { type: "array", items: { type: "string" } },
    memory: { type: "string" },
    trend: { type: "string", enum: ["mejor", "igual", "peor", "nuevo"] },
    loneliness: { type: "integer", minimum: 3, maximum: 9 },
  },
};

export class AiError extends Error { constructor(msg: string, public status = 500) { super(msg); } }

/** Analyze a call with memory of past calls and store the alert. Shared by manual and scheduled calls. */
export async function runCallAnalysis(sb: SupabaseClient<Database>, userId: string, data: { seniorId: string; seniorName: string; lines: Line[] }): Promise<CallAnalysis> {
    const { data: authorized, error: permissionError } = await sb.rpc("can_care", { _sid: data.seniorId, _uid: userId });
    if (permissionError || !authorized) throw new Error("No tiene acceso a esta persona.");
    const { data: person } = await sb.from("seniors").select("name, neighborhood").eq("id", data.seniorId).single();
    if (!person) throw new Error("Persona no disponible.");
    data = { ...data, seniorName: person.name };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Falta configuración de IA");
    const transcript = data.lines.map((l) => `${l.who === "oye" ? "OYE" : data.seniorName}: ${l.text}`).join("\n");

    // Memory: previous calls with this person feed the analysis.
    const { data: prev } = await sb
      .from("alerts").select("created_at, mood, summary, signals")
      .eq("senior_id", data.seniorId).order("created_at", { ascending: false }).limit(6);
    const history = (prev ?? []).map((p) =>
      `- ${new Date(p.created_at).toLocaleDateString("es-ES")}: ${p.mood}. ${p.summary} [${(p.signals ?? []).join(", ")}]`).join("\n");

    const { data: care } = await sb.from("senior_care").select("meds, appointments, birthday").eq("senior_id", data.seniorId).limit(1).maybeSingle();
    const agenda = care ? `Medicación: ${care.meds || "-"}. Citas: ${care.appointments || "-"}. Cumpleaños: ${care.birthday || "-"}.` : "(sin agenda)";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "Eres el analista de OYE, servicio que llama a diario a mayores que viven solos en España. Lee la transcripción y devuelve: mood (bien | bajo | no_contesta), need (ninguna si está bien; compania si pide o agradecería compañía; llamada si tiene ánimo bajo y necesita que una persona la llame; visita si no contesta o hay señales de riesgo físico), summary (una o dos frases en español, cálidas y claras para la familia, máximo 200 caracteres) y signals (hasta 4 etiquetas breves en español: p. ej. 'Dolor de rodilla', 'Soledad', 'Ha comido poco', 'Medicación tomada'). Si la agenda menciona medicación o citas y la llamada habla de ello, refléjalo en signals. Nunca diagnostiques. OYE nunca llama al 112. Además: memory = una frase breve (máx. 160 caracteres) que conecte esta llamada con las anteriores (p. ej. 'El martes le dolía la rodilla; hoy dice que mejor'); si no hay historial, cadena vacía. trend = mejor | igual | peor respecto a llamadas anteriores, o nuevo si no hay historial. loneliness = estimación 3-9 de soledad según lo dicho en la llamada (escala UCLA-3: 3-5 no se siente sola, 6-9 se siente sola; si no contesta, usa la última llamada con respuesta o 6 si no hay).",
        input: [{ role: "user", content: `Agenda de ${data.seniorName}: ${agenda}\n\nHistorial previo de ${data.seniorName}:\n${history || "(sin llamadas previas)"}\n\nLlamada de hoy:\n${transcript}` }],
        text: { format: { type: "json_schema", name: "call_analysis", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      console.error("AI gateway", res.status, await res.text().catch(() => ""));
      if (res.status === 429) throw new AiError("Hay muchas llamadas ahora. Inténtelo en un momento.", 429);
      if (res.status === 402 || res.status === 403) throw new AiError(res.status === 402 ? "Sin créditos de IA disponibles." : "La IA no está disponible ahora.", res.status);
      throw new Error("No se pudo analizar la llamada.");
    }

    let text = "";
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") text += ev.delta;
        } catch { /* ignore partial */ }
      }
    }

    let parsed: Omit<CallAnalysis, "alertId" | "familyNotified">;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("La IA no devolvió un resultado válido.");
    }
    const summary = String(parsed.summary ?? "").slice(0, 300);
    const signals = (Array.isArray(parsed.signals) ? parsed.signals : []).slice(0, 4).map((s) => String(s).slice(0, 40));
    const memory = String(parsed.memory ?? "").slice(0, 200);
    const trend = (["mejor", "igual", "peor", "nuevo"] as const).includes(parsed.trend) ? parsed.trend : "nuevo";
    const loneliness = Math.min(9, Math.max(3, Math.round(Number(parsed.loneliness) || 5)));
    const durationMin = Math.max(1, Math.round(data.lines.length * 0.6));
    const needsHuman = parsed.need !== "ninguna";

    const { data: prof } = await sb.from("profiles").select("neighborhood").eq("id", userId).maybeSingle();
    const { data: row, error } = await sb
      .from("alerts")
      .insert({
        senior_id: data.seniorId,
        is_simulated: true,
        senior_name: data.seniorName,
        mood: parsed.mood,
        need: parsed.need,
        summary,
        signals,
        transcript: data.lines,
        memory_note: memory,
        duration_min: durationMin,
        loneliness_score: loneliness,
        neighborhood: person.neighborhood,
        trend,
        status: needsHuman ? "open" : "closed",
        family_notified: false,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) {
      console.error(error);
      throw new Error("No se pudo guardar el aviso.");
    }
    return { mood: parsed.mood, need: parsed.need, summary, signals, memory, trend, loneliness, durationMin, alertId: row.id, familyNotified: false };
}
