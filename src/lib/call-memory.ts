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

export type NeighborhoodResourceInput = {
  name: string;
  category: string;
  neighborhood: string;
  schedule: string;
  active?: boolean;
};

export type OutboundCallContext = LastCallMemoryPayload & {
  medications: string;
  appointments: string;
  birthday: string;
  key_contact: string;
  green_streak: number;
  call_mode_hint: "charla_breve_90s" | "seguimiento_cercano_3min";
  life_memories: string;
  pending_followups: string;
  neighborhood_plan: string;
  clinical_focus_mode:
    | "vigilancia_adherencia"
    | "acompanamiento_soledad"
    | "seguimiento_sintoma"
    | "celebrar_vinculo";
};

type ReportMemoryShape = {
  oye_recuerda_insight?: unknown;
  nota_memoria?: unknown;
  summary?: unknown;
  senales_detectadas?: unknown;
  top_badges?: unknown;
  nivel_alerta?: unknown;
  recuerdo_biografico_nuevo?: unknown;
  evaluacion_escalas?: {
    soledad_ucla?: { puntuacion_estimada?: unknown };
    autocuidado_y_salud?: {
      adherencia_medicacion?: unknown;
      sueno_descanso?: unknown;
      alimentacion_hidratacion?: unknown;
    };
  };
};

function madridWeekdayMatcher(now = new Date()): {
  labelEs: string;
  exactDayRegex: RegExp;
  broadRegex: RegExp;
} {
  const wd = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", weekday: "long" })
    .format(now)
    .toLowerCase();
  if (wd.startsWith("lunes")) return { labelEs: "lunes", exactDayRegex: /\blunes\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("martes")) return { labelEs: "martes", exactDayRegex: /\bmartes\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("miércoles") || wd.startsWith("miercoles"))
    return { labelEs: "miércoles", exactDayRegex: /mi[eé]rcoles/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("jueves")) return { labelEs: "jueves", exactDayRegex: /\bjueves\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("viernes")) return { labelEs: "viernes", exactDayRegex: /\bviernes\b/i, broadRegex: /(l-v|l-s|todos los d[ií]as)/i };
  if (wd.startsWith("sábado") || wd.startsWith("sabado"))
    return { labelEs: "sábado", exactDayRegex: /s[aá]bado/i, broadRegex: /(l-s|todos los d[ií]as)/i };
  return { labelEs: "domingo", exactDayRegex: /\bdomingo\b/i, broadRegex: /todos los d[ií]as/i };
}

export function extractLifeMemories(recentCompleted: LastCallRow[], limit = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of recentCompleted) {
    if (!row?.report || typeof row.report !== "object") continue;
    const mem = (row.report as ReportMemoryShape).recuerdo_biografico_nuevo;
    if (typeof mem !== "string") continue;
    const clean = mem.replace(/\s+/g, " ").trim();
    if (clean.length <= 5 || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}

export function extractPendingFollowups(latest: LastCallRow, medsLabel: string): string[] {
  if (!latest?.report || typeof latest.report !== "object") return [];
  const auto = (latest.report as ReportMemoryShape).evaluacion_escalas?.autocuidado_y_salud;
  if (!auto) return [];
  const followups: string[] = [];
  if (auto.adherencia_medicacion === "NO_TOMADA" || auto.adherencia_medicacion === "DUDOSA") {
    followups.push(`Confirmar hoy toma de medicación (${medsLabel || "pauta habitual"})`);
  }
  if (auto.sueno_descanso === "ALERTA" || auto.sueno_descanso === "INSOMNIO_FATIGA") {
    followups.push("Preguntar si descansó mejor anoche");
  }
  if (auto.alimentacion_hidratacion === "ALERTA" || auto.alimentacion_hidratacion === "DESCUIDO") {
    followups.push("Validar si pudo comer e hidratarse bien hoy");
  }
  return followups;
}

export function matchNeighborhoodPlan(params: {
  resources: NeighborhoodResourceInput[];
  neighborhood?: string | null;
  now?: Date;
}): string {
  const activeResources = params.resources.filter((r) => r.active !== false);
  if (activeResources.length === 0) return "";
  const { labelEs, exactDayRegex, broadRegex } = madridWeekdayMatcher(params.now);
  const normHood = (params.neighborhood || "Chamberí").trim().toLowerCase();
  const hoodPool = activeResources.filter((r) => (r.neighborhood || "").trim().toLowerCase() === normHood);
  const pool = hoodPool.length > 0 ? hoodPool : activeResources;

  const chosen =
    pool.find((r) => exactDayRegex.test(r.schedule || "") && r.category !== "servicios_sociales") ||
    pool.find((r) => broadRegex.test(r.schedule || "") && r.category !== "servicios_sociales") ||
    pool.find((r) => r.category === "centro_mayores" || r.category === "paseo_salud") ||
    pool[0];

  if (!chosen) return "";
  return `Plan real para hoy ${labelEs} en ${chosen.neighborhood}: ${chosen.name} (${chosen.schedule}).`;
}

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
  communityResources?: NeighborhoodResourceInput[];
  neighborhood?: string | null;
  now?: Date;
}): OutboundCallContext {
  const { recentCompleted, seniorCare, communityResources = [], neighborhood = "Chamberí", now } = params;
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

  const lifeMemories = extractLifeMemories(recentCompleted, 3).join(" | ");
  const followups = extractPendingFollowups(latest, meds);
  const neighborhoodPlan = matchNeighborhoodPlan({
    resources: communityResources,
    neighborhood,
    ...(now ? { now } : {}),
  });

  const latestReportObj =
    latest?.report && typeof latest.report === "object" ? (latest.report as ReportMemoryShape) : null;
  const latestUcla = Number(latestReportObj?.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada ?? 3);

  const clinicalFocusMode: OutboundCallContext["clinical_focus_mode"] =
    followups.some((f) => f.includes("medicación"))
      ? "vigilancia_adherencia"
      : latestUcla >= 6
      ? "acompanamiento_soledad"
      : followups.length > 0
      ? "seguimiento_sintoma"
      : "celebrar_vinculo";

  return {
    ...memory,
    medications: meds,
    appointments,
    birthday,
    key_contact: keyContact,
    green_streak: greenStreak,
    call_mode_hint: callModeHint,
    life_memories: lifeMemories,
    pending_followups: followups.join("; "),
    neighborhood_plan: neighborhoodPlan,
    clinical_focus_mode: clinicalFocusMode,
  };
}
