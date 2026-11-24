export type LastCallRow = {
  nivel_alerta?: string | null;
  global_pct?: number | null;
  motivo?: string | null;
  created_at?: string | null;
  report?: unknown;
} | null;

export type LastCallMemoryPayload = {
  last_call_memory: string;
  last_alert_level: string;
};

type ReportMemoryShape = {
  oye_recuerda_insight?: unknown;
  nota_memoria?: unknown;
  summary?: unknown;
  senales_detectadas?: unknown;
  top_badges?: unknown;
  nivel_alerta?: unknown;
};

/**
 * Formats the previous completed call into concise longitudinal memory fields
 * compatible with Make S1 and ElevenLabs dynamic variables.
 */
export function buildLastCallMemory(lastCompleted: LastCallRow): LastCallMemoryPayload {
  if (!lastCompleted) {
    return {
      last_call_memory: "Primera llamada registrada sin incidencias previas.",
      last_alert_level: "VERDE",
    };
  }

  const report =
    lastCompleted.report && typeof lastCompleted.report === "object"
      ? (lastCompleted.report as ReportMemoryShape)
      : null;

  const rawInsight =
    (typeof report?.oye_recuerda_insight === "string" && report.oye_recuerda_insight) ||
    (typeof report?.nota_memoria === "string" && report.nota_memoria) ||
    (typeof report?.summary === "string" && report.summary) ||
    (typeof lastCompleted.motivo === "string" && lastCompleted.motivo) ||
    "";

  const rawSignals = Array.isArray(report?.senales_detectadas)
    ? report.senales_detectadas
    : Array.isArray(report?.top_badges)
    ? report.top_badges
    : [];

  const signals = rawSignals
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, 3);

  const alertLevel =
    (typeof lastCompleted.nivel_alerta === "string" && lastCompleted.nivel_alerta) ||
    (typeof report?.nivel_alerta === "string" && report.nivel_alerta) ||
    "VERDE";

  const cleanInsight = rawInsight.replace(/\s+/g, " ").trim();
  const parts = [cleanInsight, signals.length > 0 ? `Señales previas: ${signals.join(", ")}.` : ""].filter(Boolean);

  const combined = parts.join(" ").trim();
  return {
    last_call_memory: (combined || "Llamada previa completada con normalidad.").slice(0, 420),
    last_alert_level: alertLevel,
  };
}
