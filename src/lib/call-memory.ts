export type LastCallRow = {
  nivel_alerta?: string | null;
  global_pct?: number | null;
  motivo?: string | null;
  created_at?: string | null;
  report?: unknown;
} | null;

export type SeniorCareRow = {
  key_contact_name?: string | null;
  key_contact_phone?: string | null;
  meds?: string | null;
  appointments?: string | null;
  birthday?: string | null;
} | null;

export type LastCallMemoryPayload = {
  last_call_memory: string;
  last_alert_level: string;
};

export type OutboundCallContext = LastCallMemoryPayload & {
  medications: string;
  appointments: string;
  birthday: string;
  key_contact: string;
  green_streak: number;
  call_mode_hint: "charla_breve_90s" | "seguimiento_cercano_3min";
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

/**
 * Combines longitudinal memory, care sheet (meds, appointments, birthday, key holder)
 * and adaptive duration hint for Make S1 / ElevenLabs dynamic variables.
 */
export function buildOutboundCallContext(params: {
  recentCompleted: LastCallRow[];
  seniorCare: SeniorCareRow;
}): OutboundCallContext {
  const { recentCompleted, seniorCare } = params;
  const latest = recentCompleted[0] ?? null;
  const memory = buildLastCallMemory(latest);

  let greenStreak = 0;
  for (const row of recentCompleted) {
    if (!row) break;
    const report =
      row.report && typeof row.report === "object" ? (row.report as ReportMemoryShape) : null;
    const lvl =
      (typeof row.nivel_alerta === "string" && row.nivel_alerta) ||
      (typeof report?.nivel_alerta === "string" && report.nivel_alerta) ||
      "VERDE";
    if (lvl === "VERDE") {
      greenStreak++;
    } else {
      break;
    }
  }

  const meds = seniorCare?.meds?.replace(/\s+/g, " ").trim().slice(0, 180) || "Ninguna especificada";
  const appointments =
    seniorCare?.appointments?.replace(/\s+/g, " ").trim().slice(0, 180) || "Sin citas próximas registradas";
  const birthday = seniorCare?.birthday?.replace(/\s+/g, " ").trim().slice(0, 80) || "";

  const keyName = seniorCare?.key_contact_name?.trim() || "";
  const keyPhone = seniorCare?.key_contact_phone?.trim() || "";
  const keyContact = [keyName, keyPhone].filter(Boolean).join(" · ").slice(0, 160);

  const callModeHint: OutboundCallContext["call_mode_hint"] =
    greenStreak >= 3 && memory.last_alert_level === "VERDE"
      ? "charla_breve_90s"
      : "seguimiento_cercano_3min";

  return {
    ...memory,
    medications: meds,
    appointments,
    birthday,
    key_contact: keyContact,
    green_streak: greenStreak,
    call_mode_hint: callModeHint,
  };
}
