import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ESCALATE_FAMILY_MIN, ESCALATE_ONG_MIN, RETRY_MIN, sameArea } from "@/lib/alerts";
import type { CallLogRow } from "@/lib/call-logs";

export type CareInterventionRow = {
  id: string;
  senior_id: string;
  alert_id: string | null;
  author_name: string;
  category: string;
  ring: number;
  title: string;
  details: string;
  outcome: string;
  created_at: string;
};

export type DossierAlertRow = {
  id: string;
  status: string;
  mood: string;
  need: string;
  volunteer_name: string;
  summary: string;
  memory_note: string;
  visit_note: string;
  created_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  visited_at: string | null;
};

export type SeniorDossierData = {
  interventions: CareInterventionRow[];
  alerts: DossierAlertRow[];
};

export type CommunityResourceRow = {
  id: string;
  org_id: string | null;
  name: string;
  category: string;
  neighborhood: string;
  schedule: string;
  contact: string;
  description: string;
  is_demo: boolean;
  active: boolean;
  created_at: string;
};

export type ConsoleCensusRow = {
  senior_id: string;
  name: string;
  age: number | null;
  phone: string;
  neighborhood: string;
  family_contact: string;
  active: boolean;
  notes: string;
  is_demo: boolean;
  key_contact_name: string;
  key_contact_phone: string;
  meds: string;
  appointments: string;
  birthday: string;
  schedule_active: boolean;
  schedule_call_hour: number | null;
  schedule_days: number[] | null;
  schedule_last_run_on: string | null;
  schedule_last_error: string;
  active_alert_id: string | null;
  active_alert_status: string | null;
  active_alert_mood: string | null;
  active_alert_need: string | null;
  active_alert_created_at: string | null;
  active_alert_volunteer_id: string | null;
  active_alert_volunteer_name: string | null;
  active_alert_summary: string | null;
  active_alert_memory_note: string | null;
  active_alert_signals: string[] | null;
  latest_call_id: string | null;
  latest_call_status: string | null;
  latest_call_at: string | null;
  latest_nivel_alerta: string | null;
  latest_global_pct: number | null;
  latest_duracion_seg: number | null;
  latest_headline: string;
  latest_summary: string;
  latest_ucla_score: number | null;
  latest_yesavage_score: number | null;
  latest_adherencia: string;
  latest_vocal_estado: string;
  latest_riqueza_lexica: number | null;
  latest_palabras_resp: number | null;
  latest_latencia_seg: number | null;
  latest_tendencia: string;
  latest_anillo: string;
  latest_cita: string;
  calls_7d: number;
  green_7d: number;
  amber_red_7d: number;
  avg_global_pct_7d: number | null;
  prev_global_pct: number | null;
  visits_30d: number;
};

export type ConsoleVolunteerRow = {
  id: string;
  name: string;
  phone: string;
  neighborhood: string;
  available: boolean;
  source: string;
  active_visits: number;
  completed_30d: number;
  last_visit_at: string | null;
};

export type ConsoleCohortSummary = {
  total_seniors: number;
  active_schedules: number;
  paused_schedules: number;
  open_alerts: number;
  no_answer_open: number;
  dispatched_active: number;
  calls_30d: number;
  green_calls_30d: number;
  filter_green_pct: number | null;
  visits_30d: number;
  avg_dispatch_min: number | null;
  avg_global_pct_30d: number | null;
  avg_ucla_30d: number | null;
  avg_yesavage_30d: number | null;
  med_confirmed_30d: number;
  med_evaluated_30d: number;
  avg_riqueza_lexica_30d: number | null;
  silent_deterioration_count: number;
};

export type UrgencyTier = "critical" | "preventive" | "green" | "pending";

export function classifyUrgencyTier(
  row: Pick<
    ConsoleCensusRow,
    | "latest_call_status"
    | "latest_nivel_alerta"
    | "latest_global_pct"
    | "prev_global_pct"
    | "latest_ucla_score"
    | "active_alert_status"
    | "active_alert_mood"
    | "active_alert_created_at"
  >,
  now = Date.now()
): { tier: UrgencyTier; label: string; silentDropDelta: number | null } {
  const silentDropDelta =
    row.prev_global_pct !== null && row.latest_global_pct !== null
      ? row.latest_global_pct - row.prev_global_pct
      : null;

  const waitMin = row.active_alert_created_at
    ? Math.max(0, Math.round((now - new Date(row.active_alert_created_at).getTime()) / 60000))
    : 0;

  if (
    row.latest_call_status === "urgencia_en_curso" ||
    (row.active_alert_status === "open" && row.active_alert_mood === "no_contesta") ||
    row.latest_nivel_alerta === "ROJO" ||
    (row.active_alert_status === "open" && waitMin >= ESCALATE_ONG_MIN)
  ) {
    const label =
      row.latest_call_status === "urgencia_en_curso" || row.latest_nivel_alerta === "ROJO"
        ? "Alerta Roja"
        : row.active_alert_mood === "no_contesta"
        ? "No contesta"
        : "SLA > 30 min";
    return { tier: "critical", label, silentDropDelta };
  }

  if (
    row.active_alert_status === "open" ||
    row.active_alert_status === "accepted" ||
    row.active_alert_status === "arrived" ||
    row.latest_nivel_alerta === "AMARILLO" ||
    (silentDropDelta !== null && silentDropDelta <= -15) ||
    (row.latest_ucla_score !== null && row.latest_ucla_score >= 4)
  ) {
    const label =
      row.active_alert_status === "arrived"
        ? "Voluntario en casa"
        : row.active_alert_status === "accepted"
        ? "Voluntario en camino"
        : silentDropDelta !== null && silentDropDelta <= -15
        ? `Caída ${silentDropDelta} pts`
        : row.latest_nivel_alerta === "AMARILLO"
        ? "Seguimiento Amarillo"
        : "Aviso abierto";
    return { tier: "preventive", label, silentDropDelta };
  }

  if (row.latest_call_status === "completada") {
    return {
      tier: "green",
      label: row.latest_global_pct !== null ? `Verde · ${row.latest_global_pct}%` : "Verde",
      silentDropDelta,
    };
  }

  return { tier: "pending", label: "Sin llamada hoy", silentDropDelta };
}

export function computeSlaStatus(
  createdAtIso: string | null,
  mood?: string | null,
  now = Date.now()
): {
  elapsedMin: number;
  label: string;
  level: "normal" | "warning_30" | "critical_60";
  protocolHint: string;
} {
  if (!createdAtIso) {
    return {
      elapsedMin: 0,
      label: "Sin cola activa",
      level: "normal",
      protocolHint: "",
    };
  }
  const elapsedMin = Math.max(0, Math.round((now - new Date(createdAtIso).getTime()) / 60000));
  const label =
    elapsedMin < 60
      ? `${elapsedMin} min`
      : elapsedMin < 1440
      ? `${Math.floor(elapsedMin / 60)} h ${elapsedMin % 60} min`
      : `${Math.floor(elapsedMin / 1440)} d`;

  if (elapsedMin >= ESCALATE_FAMILY_MIN) {
    return {
      elapsedMin,
      label,
      level: "critical_60",
      protocolHint:
        mood === "no_contesta"
          ? "Protocolo +60 min: contactar con persona con llave o familia"
          : "SLA +60 min superado: escalar a familia / responsable de turno",
    };
  }
  if (elapsedMin >= ESCALATE_ONG_MIN || (mood === "no_contesta" && elapsedMin >= RETRY_MIN)) {
    return {
      elapsedMin,
      label,
      level: "warning_30",
      protocolHint:
        mood === "no_contesta"
          ? "Reintento +15 min vencido: asignar vecino o llamar a quien tiene llave"
          : "SLA +30 min: prioridad de despacho por coordinación ONG",
    };
  }
  return {
    elapsedMin,
    label,
    level: "normal",
    protocolHint: "Dentro de ventana vecinal (< 30 min)",
  };
}

export type RankedVolunteer = ConsoleVolunteerRow & {
  sameNeighborhood: boolean;
  matchTag: string;
  score: number;
};

export function rankVolunteersForSenior(
  volunteers: ConsoleVolunteerRow[],
  seniorNeighborhood: string
): RankedVolunteer[] {
  return [...volunteers]
    .map((v) => {
      const sameNeighborhood =
        Boolean(seniorNeighborhood.trim()) &&
        Boolean(v.neighborhood.trim()) &&
        sameArea(v.neighborhood, seniorNeighborhood);
      let score = 0;
      if (v.available) score += 1000;
      if (sameNeighborhood) score += 300;
      score -= v.active_visits * 200;
      score += Math.min(50, v.completed_30d * 2);

      const matchTag = !v.available
        ? "No disponible"
        : v.active_visits > 0
        ? `Con ${v.active_visits} visita en curso`
        : sameNeighborhood
        ? "Mismo barrio · Libre"
        : "Disponible";

      return { ...v, sameNeighborhood, matchTag, score };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "es"));
}

export type DistrictCoverageRow = {
  neighborhood: string;
  seniorsCount: number;
  urgentCount: number;
  volunteersAvailable: number;
  ratioLabel: string;
  coverageGap: boolean;
};

export function computeDistrictCoverage(
  census: ConsoleCensusRow[],
  volunteers: ConsoleVolunteerRow[]
): DistrictCoverageRow[] {
  const byDistrict = new Map<
    string,
    { label: string; seniorsCount: number; urgentCount: number; volunteersAvailable: number }
  >();

  for (const s of census) {
    const label = s.neighborhood.trim() || "Sin barrio asignado";
    const key = label.toLowerCase();
    const cur = byDistrict.get(key) ?? {
      label,
      seniorsCount: 0,
      urgentCount: 0,
      volunteersAvailable: 0,
    };
    cur.seniorsCount += 1;
    const { tier } = classifyUrgencyTier(s);
    if (tier === "critical" || tier === "preventive") cur.urgentCount += 1;
    byDistrict.set(key, cur);
  }

  for (const [key, entry] of byDistrict.entries()) {
    let matchCount = 0;
    for (const v of volunteers) {
      if (!v.available) continue;
      if (v.neighborhood.trim() && (sameArea(v.neighborhood, entry.label) || v.neighborhood.trim().toLowerCase() === key)) {
        matchCount += 1;
      }
    }
    entry.volunteersAvailable = matchCount;
  }

  return [...byDistrict.values()]
    .map((e) => {
      const coverageGap = e.seniorsCount > 0 && (e.volunteersAvailable === 0 || e.seniorsCount / e.volunteersAvailable > 8);
      const ratioLabel =
        e.volunteersAvailable === 0
          ? `${e.seniorsCount}:0 (descubierto)`
          : `${Math.round((e.seniorsCount / e.volunteersAvailable) * 10) / 10}:1`;
      return {
        neighborhood: e.label,
        seniorsCount: e.seniorsCount,
        urgentCount: e.urgentCount,
        volunteersAvailable: e.volunteersAvailable,
        ratioLabel,
        coverageGap,
      };
    })
    .sort((a, b) => Number(b.coverageGap) - Number(a.coverageGap) || b.seniorsCount - a.seniorsCount);
}

export type CsvSeniorDraft = {
  name: string;
  age: number | null;
  phone: string;
  neighborhood: string;
  family_contact: string;
  key_contact_name: string;
  key_contact_phone: string;
  meds: string;
  appointments: string;
};

export const SAMPLE_BARRIO_CSV = `nombre;edad;telefono;barrio;familia;llave;telefono_llave;medicacion;citas
Carmen Morales;84;+34600112233;Chamberí;Lucía Morales (+34600998877);Rosa vecina 2º;+34600445566;Enalapril 10mg desayuno;Centro Salud Chamberí Jueves 10:30
Manuel Ortega;81;+34600223344;Chamberí;Carlos Ortega (+34611223344);Portería Mariano;+34611334455;Sintrom martes y jueves;Cardiología 28 nov
Pilar Gómez;88;+34600334455;Tetuán;Ana Gómez (+34622334455);Sobrina Elena;+34622445566;Metformina 850mg comida;Podólogo viernes 12:00`;

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line.charAt(i);
    if (ch === '"') {
      if (inQuotes && line.charAt(i + 1) === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const HEADER_ALIASES: Record<string, keyof CsvSeniorDraft> = {
  nombre: "name",
  name: "name",
  persona: "name",
  edad: "age",
  age: "age",
  telefono: "phone",
  phone: "phone",
  tel: "phone",
  movil: "phone",
  barrio: "neighborhood",
  distrito: "neighborhood",
  neighborhood: "neighborhood",
  familia: "family_contact",
  contacto_familia: "family_contact",
  family_contact: "family_contact",
  llave: "key_contact_name",
  contacto_llave: "key_contact_name",
  key_contact: "key_contact_name",
  key_contact_name: "key_contact_name",
  telefono_llave: "key_contact_phone",
  tel_llave: "key_contact_phone",
  key_contact_phone: "key_contact_phone",
  medicacion: "meds",
  meds: "meds",
  citas: "appointments",
  cita: "appointments",
  appointments: "appointments",
};

export function parseSeniorCsv(raw: string): { rows: CsvSeniorDraft[]; warnings: string[] } {
  const lines = raw
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], warnings: ["Pega o sube un CSV con al menos una fila."] };
  }

  const first = lines[0] ?? "";
  const semiCount = (first.match(/;/g) ?? []).length;
  const commaCount = (first.match(/,/g) ?? []).length;
  const tabCount = (first.match(/\t/g) ?? []).length;
  const delimiter = tabCount > semiCount && tabCount > commaCount ? "\t" : semiCount >= commaCount ? ";" : ",";

  const firstCells = splitCsvLine(first, delimiter).map(normalizeHeaderKey);
  const hasHeader = firstCells.some((c) => HEADER_ALIASES[c] !== undefined);
  const columns: (keyof CsvSeniorDraft)[] = hasHeader
    ? firstCells.map((c) => HEADER_ALIASES[c] ?? "notes" as never)
    : [
        "name",
        "age",
        "phone",
        "neighborhood",
        "family_contact",
        "key_contact_name",
        "key_contact_phone",
        "meds",
        "appointments",
      ];

  const startIdx = hasHeader ? 1 : 0;
  const rows: CsvSeniorDraft[] = [];
  const warnings: string[] = [];

  for (let i = startIdx; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i] ?? "", delimiter);
    const draft: CsvSeniorDraft = {
      name: "",
      age: null,
      phone: "",
      neighborhood: "Chamberí",
      family_contact: "",
      key_contact_name: "",
      key_contact_phone: "",
      meds: "",
      appointments: "",
    };

    columns.forEach((field, colIdx) => {
      const val = (cells[colIdx] ?? "").trim();
      if (!val) return;
      if (field === "age") {
        const num = Number(val);
        if (Number.isFinite(num) && num >= 40 && num <= 120) {
          draft.age = Math.round(num);
        } else {
          warnings.push(`Fila ${i + 1}: edad "${val}" ignorada (debe estar entre 40 y 120).`);
        }
      } else if (field in draft) {
        (draft as Record<string, string | number | null>)[field] = val;
      }
    });

    if (!draft.name) {
      warnings.push(`Fila ${i + 1}: omitida porque falta el nombre.`);
      continue;
    }

    rows.push(draft);
  }

  return { rows, warnings };
}

function escapeCsvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildConsoleCsvExport(rows: ConsoleCensusRow[]): string {
  const headers = [
    "Nombre",
    "Edad",
    "Barrio",
    "Teléfono",
    "Estado Programación",
    "Nivel Alerta",
    "Bienestar %",
    "UCLA-3",
    "Yesavage GDS-5",
    "Adherencia Medicación",
    "Riqueza Léxica %",
    "Latencia Vocal (s)",
    "Aviso Activo",
    "Voluntario Asignado",
    "Contacto con Llave",
    "Teléfono Llave",
    "Última Cita Textual",
  ];

  const lines = rows.map((r) => [
    r.name,
    r.age ?? "",
    r.neighborhood,
    r.phone,
    r.schedule_active ? "Activa" : "En pausa",
    r.latest_nivel_alerta ?? r.latest_call_status ?? "Sin llamada",
    r.latest_global_pct ?? "",
    r.latest_ucla_score ?? "",
    r.latest_yesavage_score ?? "",
    r.latest_adherencia || "",
    r.latest_riqueza_lexica ?? "",
    r.latest_latencia_seg ?? "",
    r.active_alert_status ?? "Ninguno",
    r.active_alert_volunteer_name ?? "",
    r.key_contact_name,
    r.key_contact_phone,
    r.latest_cita,
  ]);

  const body = [headers, ...lines].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
  return `\uFEFF${body}`;
}

export function computeCohortUnitEconomics(
  summary: ConsoleCohortSummary | null | undefined,
  activeCountOverride?: number
) {
  const seniors = activeCountOverride ?? summary?.total_seniors ?? 0;
  const monthlyB2bRevEur = Math.round(seniors * 13.8 * 100) / 100; // 0.46 EUR/day * 30
  const optimizedMonthlyCostMidEur = Math.round(seniors * 8.5 * 100) / 100; // ~7.40-9.60 EUR/month benchmark Opt B
  const scaleMonthlyCostMidEur = Math.round(seniors * 4.55 * 100) / 100; // ~3.40-5.70 EUR/month benchmark Opt C
  const unoptimizedCostMidEur = Math.round(seniors * 18.75 * 100) / 100; // ~18.50-19.00 EUR/month Opt A

  const greenCalls = summary?.green_calls_30d ?? 0;
  const savedHumanHours = Math.round(((greenCalls * 12) / 60) * 10) / 10;

  return {
    seniors,
    monthlyB2bRevEur,
    optimizedMonthlyCostMidEur,
    scaleMonthlyCostMidEur,
    unoptimizedCostMidEur,
    savedHumanHours,
  };
}

export function useIsConsoleOperator() {
  return useQuery({
    queryKey: ["console", "is-operator"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_console_operator");
      if (error) return false;
      return Boolean(data);
    },
    staleTime: 30_000,
  });
}

export function useConsoleCensus(enabled = true) {
  return useQuery({
    queryKey: ["console", "census"],
    enabled,
    queryFn: async (): Promise<ConsoleCensusRow[]> => {
      const { data, error } = await supabase.rpc("console_census_snapshot");
      if (error) throw error;
      return (data ?? []) as ConsoleCensusRow[];
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useConsoleVolunteers(enabled = true) {
  return useQuery({
    queryKey: ["console", "volunteers"],
    enabled,
    queryFn: async (): Promise<ConsoleVolunteerRow[]> => {
      const { data, error } = await supabase.rpc("console_volunteers_overview");
      if (error) throw error;
      return (data ?? []) as ConsoleVolunteerRow[];
    },
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

export function useConsoleCohortSummary(enabled = true) {
  return useQuery({
    queryKey: ["console", "cohort-summary"],
    enabled,
    queryFn: async (): Promise<ConsoleCohortSummary | null> => {
      const { data, error } = await supabase.rpc("console_cohort_summary");
      if (error) throw error;
      return (data?.[0] as ConsoleCohortSummary | undefined) ?? null;
    },
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

export type AgendaBucket = "completed_today" | "missed_or_overdue" | "pending_today" | "paused";

export type DailyAgendaEntry = {
  row: ConsoleCensusRow;
  bucket: AgendaBucket;
  scheduledHour: number;
  reason: string;
};

function madridClock(now: Date): { dateKey: string; hour: number; isoDay: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    dateKey: `${parts['year'] ?? "2026"}-${parts['month'] ?? "01"}-${parts['day'] ?? "01"}`,
    hour: Number(parts['hour'] ?? 11),
    isoDay: weekdayMap[parts['weekday'] ?? "Mon"] ?? 1,
  };
}

function sameMadridDay(iso: string | null, dateKey: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return madridClock(d).dateKey === dateKey;
}

/**
 * Evaluates today's daily-call SLA across the whole census (Europe/Madrid timezone)
 * to eliminate blind spots between automated calling and coordinator oversight.
 */
export function computeTodayScheduleCoverage(
  census: ConsoleCensusRow[],
  now = new Date()
): {
  entries: DailyAgendaEntry[];
  completedCount: number;
  overdueCount: number;
  pendingCount: number;
  pausedCount: number;
  madridDateKey: string;
  madridHour: number;
} {
  const { dateKey, hour, isoDay } = madridClock(now);
  const entries: DailyAgendaEntry[] = [];
  let completedCount = 0;
  let overdueCount = 0;
  let pendingCount = 0;
  let pausedCount = 0;

  for (const row of census) {
    const scheduledHour = row.schedule_call_hour ?? 11;
    const days = row.schedule_days && row.schedule_days.length > 0 ? row.schedule_days : [1, 2, 3, 4, 5, 6, 7];
    const calledToday = sameMadridDay(row.latest_call_at, dateKey);

    if (!row.schedule_active || !days.includes(isoDay)) {
      pausedCount += 1;
      entries.push({
        row,
        bucket: "paused",
        scheduledHour,
        reason: !row.schedule_active ? "Pausa temporal / Vacaciones" : "Fuera de días programados",
      });
      continue;
    }

    if (calledToday && row.latest_call_status === "completada") {
      completedCount += 1;
      entries.push({
        row,
        bucket: "completed_today",
        scheduledHour,
        reason: `Completada hoy (${row.latest_nivel_alerta || "VERDE"})`,
      });
      continue;
    }

    if (
      (calledToday && (row.latest_call_status === "no_contesta" || row.latest_call_status === "urgencia_en_curso" || row.latest_call_status === "error")) ||
      (!calledToday && hour > scheduledHour)
    ) {
      overdueCount += 1;
      entries.push({
        row,
        bucket: "missed_or_overdue",
        scheduledHour,
        reason: calledToday
          ? `Incidencia hoy: ${row.latest_call_status}`
          : `Sin llamada tras las ${String(scheduledHour).padStart(2, "0")}:00 h`,
      });
      continue;
    }

    pendingCount += 1;
    entries.push({
      row,
      bucket: "pending_today",
      scheduledHour,
      reason: `Programada hoy a las ${String(scheduledHour).padStart(2, "0")}:00 h`,
    });
  }

  const order: Record<AgendaBucket, number> = {
    missed_or_overdue: 0,
    pending_today: 1,
    completed_today: 2,
    paused: 3,
  };
  entries.sort((a, b) => order[a.bucket] - order[b.bucket] || a.scheduledHour - b.scheduledHour);

  return {
    entries,
    completedCount,
    overdueCount,
    pendingCount,
    pausedCount,
    madridDateKey: dateKey,
    madridHour: hour,
  };
}

export type ClinicalSeriesPoint = {
  id: string;
  dateLabel: string;
  fullDate: string;
  globalPct: number;
  uclaWellbeingPct: number | null;
  yesavageWellbeingPct: number | null;
  lexicalPct: number | null;
  wordsPerTurn: number | null;
  latencySec: number | null;
  nivelAlerta: string;
};

export function buildClinicalChartSeries(logs: CallLogRow[], limit = 14): {
  points: ClinicalSeriesPoint[];
  baselineAvgPct: number | null;
  latestPct: number | null;
  deltaFromBaseline: number | null;
  baselineLexicalPct: number | null;
  latestLexicalPct: number | null;
} {
  const completed = [...logs]
    .filter((l) => l.status === "completada" && typeof (l.global_pct ?? l.report?.global_pct) === "number")
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .slice(-limit);

  const points: ClinicalSeriesPoint[] = completed.map((l) => {
    const r = l.report;
    const globalPct = Math.round(Number(l.global_pct ?? r?.global_pct ?? 85));
    const uclaRaw = r?.scores?.ucla3?.pct_bienestar ?? r?.sub_percentages?.social ?? null;
    const gdsRaw = r?.scores?.yesavage_gds5?.pct_bienestar ?? r?.sub_percentages?.mood ?? null;
    const bio = r?.evaluacion_escalas?.indicadores_vocales_cognitivos?.biomarcadores;

    return {
      id: l.id,
      dateLabel: new Date(l.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
      fullDate: new Date(l.created_at).toLocaleString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      globalPct,
      uclaWellbeingPct: typeof uclaRaw === "number" ? Math.round(uclaRaw) : null,
      yesavageWellbeingPct: typeof gdsRaw === "number" ? Math.round(gdsRaw) : null,
      lexicalPct: typeof bio?.riqueza_lexica_pct === "number" ? Math.round(bio.riqueza_lexica_pct) : null,
      wordsPerTurn: typeof bio?.palabras_por_respuesta === "number" ? bio.palabras_por_respuesta : null,
      latencySec: typeof bio?.latencia_respuesta_seg === "number" ? bio.latencia_respuesta_seg : null,
      nivelAlerta: r?.nivel_alerta || l.nivel_alerta || "VERDE",
    };
  });

  const baselineSample = points.slice(0, Math.min(3, points.length));
  const baselineAvgPct =
    baselineSample.length > 0
      ? Math.round(baselineSample.reduce((s, p) => s + p.globalPct, 0) / baselineSample.length)
      : null;
  const latestPct = points[points.length - 1]?.globalPct ?? null;
  const deltaFromBaseline =
    baselineAvgPct !== null && latestPct !== null ? latestPct - baselineAvgPct : null;

  const lexPoints = points.filter((p) => p.lexicalPct !== null);
  const baselineLexicalPct = lexPoints[0]?.lexicalPct ?? null;
  const latestLexicalPct = lexPoints[lexPoints.length - 1]?.lexicalPct ?? null;

  return {
    points,
    baselineAvgPct,
    latestPct,
    deltaFromBaseline,
    baselineLexicalPct,
    latestLexicalPct,
  };
}

export type LifeStoryItem = {
  id: string;
  dateLabel: string;
  quote: string;
  insight: string;
  alertLevel: string;
  memoryHighlight: string | null;
  motivosClinicos: string[];
};

export function extractLifeStoryQuotes(logs: CallLogRow[]): LifeStoryItem[] {
  const seen = new Set<string>();
  const items: LifeStoryItem[] = [];
  const sorted = [...logs]
    .filter((l) => l.status === "completada")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  for (const log of sorted) {
    const quotes = log.report?.citas_textuales ?? [];
    const memoryHighlight =
      typeof log.report?.recuerdo_biografico_nuevo === "string" &&
      log.report.recuerdo_biografico_nuevo.trim().length > 4
        ? log.report.recuerdo_biografico_nuevo.trim()
        : null;
    const rawMotivos = Array.isArray(log.report?.motivos_clinicos) ? log.report.motivos_clinicos : [];
    const motivosClinicos = rawMotivos.filter((m): m is string => typeof m === "string");
    const quote = quotes.find((q) => typeof q === "string" && q.trim().length > 4)?.trim() || memoryHighlight;
    if (!quote) continue;
    const norm = quote.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    items.push({
      id: log.id,
      dateLabel: new Date(log.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      quote,
      insight: log.report?.oye_recuerda_insight || log.report?.summary || "",
      alertLevel: log.report?.nivel_alerta || log.nivel_alerta || "VERDE",
      memoryHighlight,
      motivosClinicos,
    });
  }

  return items;
}

export type PersonalVocalBaseline = {
  sampleCount: number;
  latestLexicalPct: number | null;
  baselineLexicalPct: number | null;
  deltaLexicalPct: number | null;
  latestWordsPerTurn: number | null;
  baselineWordsPerTurn: number | null;
  deltaWordsPct: number | null;
  latestLatencySec: number | null;
  baselineLatencySec: number | null;
  driftDetected: boolean;
  statusLabel: "estable" | "desvio_detectado" | "linea_base_inicial" | "sin_datos";
};

/**
 * Computes longitudinal vocal & lexical biomarkers from completed calls against
 * each senior's own prior baseline (never inventing values for legacy null rows).
 */
export function computePersonalVocalBaseline(logs: CallLogRow[]): PersonalVocalBaseline {
  const withBio = [...logs]
    .filter((l) => l.status === "completada")
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    .flatMap((l) => {
      const bio = l.report?.evaluacion_escalas?.indicadores_vocales_cognitivos?.biomarcadores;
      if (!bio || typeof bio.riqueza_lexica_pct !== "number") return [];
      return [{ log: l, bio }];
    });

  if (withBio.length === 0) {
    return {
      sampleCount: 0,
      latestLexicalPct: null,
      baselineLexicalPct: null,
      deltaLexicalPct: null,
      latestWordsPerTurn: null,
      baselineWordsPerTurn: null,
      deltaWordsPct: null,
      latestLatencySec: null,
      baselineLatencySec: null,
      driftDetected: false,
      statusLabel: "sin_datos",
    };
  }

  const latest = withBio[withBio.length - 1]!;
  const prior = withBio.slice(0, -1);

  const latestLexicalPct = Math.round(latest.bio.riqueza_lexica_pct);
  const latestWordsPerTurn =
    typeof latest.bio.palabras_por_respuesta === "number"
      ? Math.round(latest.bio.palabras_por_respuesta * 10) / 10
      : null;
  const latestLatencySec =
    typeof latest.bio.latencia_respuesta_seg === "number"
      ? Math.round(latest.bio.latencia_respuesta_seg * 10) / 10
      : null;

  if (prior.length === 0) {
    return {
      sampleCount: 1,
      latestLexicalPct,
      baselineLexicalPct: latestLexicalPct,
      deltaLexicalPct: 0,
      latestWordsPerTurn,
      baselineWordsPerTurn: latestWordsPerTurn,
      deltaWordsPct: 0,
      latestLatencySec,
      baselineLatencySec: latestLatencySec,
      driftDetected: false,
      statusLabel: "linea_base_inicial",
    };
  }

  const baselineLexicalPct = Math.round(
    prior.reduce((sum, x) => sum + x.bio.riqueza_lexica_pct, 0) / prior.length
  );
  const priorWords = prior
    .map((x) => x.bio.palabras_por_respuesta)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const baselineWordsPerTurn =
    priorWords.length > 0
      ? Math.round((priorWords.reduce((s, n) => s + n, 0) / priorWords.length) * 10) / 10
      : null;
  const priorLatencies = prior
    .map((x) => x.bio.latencia_respuesta_seg)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const baselineLatencySec =
    priorLatencies.length > 0
      ? Math.round((priorLatencies.reduce((s, n) => s + n, 0) / priorLatencies.length) * 10) / 10
      : null;

  const deltaLexicalPct = latestLexicalPct - baselineLexicalPct;
  const deltaWordsPct =
    baselineWordsPerTurn && baselineWordsPerTurn > 0 && latestWordsPerTurn !== null
      ? Math.round(((latestWordsPerTurn - baselineWordsPerTurn) / baselineWordsPerTurn) * 100)
      : null;

  const driftDetected =
    Boolean(latest.bio.deriva_vocal_detectada) ||
    deltaLexicalPct <= -12 ||
    (deltaWordsPct !== null && deltaWordsPct <= -35);

  return {
    sampleCount: withBio.length,
    latestLexicalPct,
    baselineLexicalPct,
    deltaLexicalPct,
    latestWordsPerTurn,
    baselineWordsPerTurn,
    deltaWordsPct,
    latestLatencySec,
    baselineLatencySec,
    driftDetected,
    statusLabel: driftDetected ? "desvio_detectado" : "estable",
  };
}

export type RiskDriver = {
  id: string;
  label: string;
  detail: string;
  points: number;
  severity: "high" | "medium" | "info";
};

export type RiskAction = {
  id: string;
  label: string;
  rationale: string;
  actionType: "call_now" | "assign_volunteer" | "open_dossier";
};

export type PredictiveRiskRadar = {
  score: number;
  tier: "CRITICO" | "ELEVADO" | "VIGILANCIA" | "ESTABLE";
  drivers: RiskDriver[];
  nextBestActions: RiskAction[];
  dataCompletenessPct: number;
  vocalBaseline: PersonalVocalBaseline;
};

/**
 * Computes an explainable 0–100 Risk Radar strictly from Supabase clinical history,
 * triage state, scale scores, vocal baseline drift and intervention gaps.
 */
export function computePredictiveRiskRadar(params: {
  senior: ConsoleCensusRow;
  logs: CallLogRow[];
  interventions?: { created_at: string }[];
  now?: Date;
}): PredictiveRiskRadar {
  const { senior, logs, interventions = [], now = new Date() } = params;
  const series = buildClinicalChartSeries(logs, 14);
  const vocalBaseline = computePersonalVocalBaseline(logs);
  const completedLogs = [...logs]
    .filter((l) => l.status === "completada")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const latestLog = completedLogs[0] ?? null;
  const recentThree = completedLogs.slice(0, 3);

  const drivers: RiskDriver[] = [];
  let rawScore = 0;

  // 1. Longitudinal wellbeing trajectory vs personal baseline
  if (series.deltaFromBaseline !== null && series.deltaFromBaseline <= -20) {
    const pts = 28;
    rawScore += pts;
    drivers.push({
      id: "wellbeing_drop",
      label: `Caída fuerte de bienestar (${series.deltaFromBaseline} pts vs base)`,
      detail: `Pasó de su media base (${series.baselineAvgPct}%) a ${series.latestPct}%.`,
      points: pts,
      severity: "high",
    });
  } else if (series.deltaFromBaseline !== null && series.deltaFromBaseline <= -10) {
    const pts = 18;
    rawScore += pts;
    drivers.push({
      id: "wellbeing_drop",
      label: `Descenso frente a línea base (${series.deltaFromBaseline} pts)`,
      detail: `Referencia histórica ${series.baselineAvgPct}% → última llamada ${series.latestPct}%.`,
      points: pts,
      severity: "medium",
    });
  } else if (series.latestPct !== null && series.latestPct < 60) {
    const pts = 16;
    rawScore += pts;
    drivers.push({
      id: "low_wellbeing",
      label: `Bienestar global bajo (${series.latestPct}%)`,
      detail: "Último índice registrado por debajo del umbral óptimo (60%).",
      points: pts,
      severity: "medium",
    });
  }

  // 2. Current alert level & active alerts
  if (senior.latest_nivel_alerta === "ROJO") {
    const pts = 30;
    rawScore += pts;
    drivers.push({
      id: "triage_red",
      label: "Estado actual en Alerta ROJA",
      detail: senior.active_alert_id ? "Alerta activa pendiente de cierre." : "Prioridad máxima de triaje.",
      points: pts,
      severity: "high",
    });
  } else if (senior.latest_nivel_alerta === "AMARILLO" || Boolean(senior.active_alert_id)) {
    const pts = 14;
    rawScore += pts;
    drivers.push({
      id: "triage_yellow",
      label: senior.latest_nivel_alerta === "AMARILLO" ? "Triaje en seguimiento AMARILLO" : "Alerta operativa abierta",
      detail: senior.latest_headline || "Alerta activa en cola de coordinación.",
      points: pts,
      severity: "medium",
    });
  }

  // 3. Psychometric loneliness & mood scales (UCLA-3 / GDS-5)
  const ucla = senior.latest_ucla_score;
  const gds = senior.latest_yesavage_score;
  if ((ucla !== null && ucla >= 7) || (gds !== null && gds >= 4)) {
    const pts = 20;
    rawScore += pts;
    drivers.push({
      id: "scales_high",
      label: "Sobrecarga emocional / soledad elevada",
      detail: `UCLA-3: ${ucla ?? "—"}/9 · Yesavage GDS-5: ${gds ?? "—"}/5.`,
      points: pts,
      severity: "high",
    });
  } else if ((ucla !== null && ucla >= 6) || (gds !== null && gds >= 2)) {
    const pts = 12;
    rawScore += pts;
    drivers.push({
      id: "scales_mod",
      label: ucla !== null && ucla >= 6 ? `Riesgo de soledad (UCLA-3 ${ucla}/9)` : `Ánimo sensible (GDS-5 ${gds}/5)`,
      detail: "Señal preventiva para acompañamiento humano o prescripción social.",
      points: pts,
      severity: "medium",
    });
  }

  // 4. Personal vocal & cognitive drift
  const vocalState = latestLog?.report?.evaluacion_escalas?.indicadores_vocales_cognitivos?.estado ?? null;
  if (vocalState === "DESORIENTACION_CONFUSION") {
    const pts = 18;
    rawScore += pts;
    drivers.push({
      id: "vocal_disorientation",
      label: "Indicio cognitivo de desorientación",
      detail: "Detectado en indicadores vocales y coherencia del discurso.",
      points: pts,
      severity: "high",
    });
  } else if (vocalBaseline.driftDetected) {
    const pts = 15;
    rawScore += pts;
    drivers.push({
      id: "vocal_drift",
      label: "Desvío frente a su línea base vocal",
      detail: `Riqueza léxica ${vocalBaseline.baselineLexicalPct}% → ${vocalBaseline.latestLexicalPct}% (${vocalBaseline.deltaLexicalPct ?? 0} pts).`,
      points: pts,
      severity: "high",
    });
  } else if (vocalState === "LENTITUD_MONOSILABOS") {
    const pts = 8;
    rawScore += pts;
    drivers.push({
      id: "vocal_brief",
      label: "Respuestas breves o menor fluidez",
      detail: "Recomendable validar descanso o fatiga en siguiente contacto.",
      points: pts,
      severity: "medium",
    });
  }

  // 5. Adherence & daily self-care across last 3 completed calls
  let pendingMedCount = 0;
  let sleepFoodIssueCount = 0;
  for (const log of recentThree) {
    const auto = log.report?.evaluacion_escalas?.autocuidado_y_salud;
    if (!auto) continue;
    if (auto.adherencia_medicacion === "NO_TOMADA" || auto.adherencia_medicacion === "DUDOSA") {
      pendingMedCount += 1;
    }
    if (
      auto.sueno_descanso === "ALERTA" ||
      auto.sueno_descanso === "INSOMNIO_FATIGA" ||
      auto.alimentacion_hidratacion === "ALERTA" ||
      auto.alimentacion_hidratacion === "DESCUIDO"
    ) {
      sleepFoodIssueCount += 1;
    }
  }
  if (pendingMedCount > 0 || sleepFoodIssueCount >= 2) {
    const pts = pendingMedCount >= 2 ? 14 : 9;
    rawScore += pts;
    drivers.push({
      id: "selfcare",
      label: pendingMedCount > 0 ? "Incidencia reciente en medicación" : "Irregularidad reiterada en sueño/nutrición",
      detail:
        pendingMedCount > 0
          ? `Adherencia dudosa o pendiente en ${pendingMedCount} de las últimas ${recentThree.length} llamadas.`
          : `Descuido o descanso irregular observado en ${sleepFoodIssueCount} llamadas recientes.`,
      points: pts,
      severity: pendingMedCount >= 2 ? "high" : "medium",
    });
  }

  // 6. Contact continuity & recent human follow-up mitigation
  const newestFirstLogs = [...logs].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  let consecutiveNoAnswer = 0;
  for (const l of newestFirstLogs) {
    if (l.status === "no_contesta") consecutiveNoAnswer += 1;
    else break;
  }
  if (consecutiveNoAnswer === 0 && senior.latest_call_status === "no_contesta") {
    consecutiveNoAnswer = 1;
  }

  const lastCallMs = senior.latest_call_at ? +new Date(senior.latest_call_at) : null;
  const hoursSinceCall = lastCallMs && !Number.isNaN(lastCallMs) ? (now.getTime() - lastCallMs) / 3_600_000 : null;
  if (consecutiveNoAnswer >= 1 || senior.latest_call_status === "no_contesta") {
    const pts = consecutiveNoAnswer >= 2 ? 16 : 10;
    rawScore += pts;
    drivers.push({
      id: "unanswered",
      label: `Sin respuesta reciente (${consecutiveNoAnswer || 1} intento)`,
      detail: "Requiere rellamada de verificación o contacto con persona con llave.",
      points: pts,
      severity: consecutiveNoAnswer >= 2 ? "high" : "medium",
    });
  } else if (senior.schedule_active && hoursSinceCall !== null && hoursSinceCall > 36) {
    const pts = 8;
    rawScore += pts;
    drivers.push({
      id: "overdue_contact",
      label: `Más de ${Math.floor(hoursSinceCall)} h sin llamada completada`,
      detail: "Agenda diaria activa con brecha superior a 36 horas.",
      points: pts,
      severity: "medium",
    });
  }

  const recentHumanTouch = interventions.some((i) => {
    const ageH = (now.getTime() - +new Date(i.created_at)) / 3_600_000;
    return !Number.isNaN(ageH) && ageH <= 24;
  });
  if (recentHumanTouch && rawScore > 0) {
    rawScore = Math.max(0, rawScore - 6);
    drivers.push({
      id: "human_mitigation",
      label: "Seguimiento humano reciente registrado (<24h)",
      detail: "Reduce riesgo operativo (-6 pts) al existir intervención en curso.",
      points: -6,
      severity: "info",
    });
  }

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const tier: PredictiveRiskRadar["tier"] =
    score >= 70 ? "CRITICO" : score >= 45 ? "ELEVADO" : score >= 22 ? "VIGILANCIA" : "ESTABLE";

  if (drivers.length === 0) {
    drivers.push({
      id: "stable_protective",
      label: "Sin factores de riesgo activos en el historial",
      detail:
        vocalBaseline.sampleCount >= 2
          ? `Línea base vocal consistente (${vocalBaseline.latestLexicalPct}% riqueza léxica) y rutinas estables.`
          : "Última evaluación en parámetros habituales sin alertas ni brechas de contacto.",
      points: 0,
      severity: "info",
    });
  } else {
    drivers.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  }

  // Build prioritized 1-click Next Best Actions
  const nextBestActions: RiskAction[] = [];
  if (
    senior.latest_nivel_alerta === "ROJO" ||
    consecutiveNoAnswer >= 1 ||
    senior.latest_call_status === "no_contesta" ||
    senior.latest_call_status === "urgencia_en_curso"
  ) {
    nextBestActions.push({
      id: "nba_call",
      label: "Lanzar llamada OYE ahora",
      rationale: "Verificar estado en tiempo real tras alerta o intento sin respuesta.",
      actionType: "call_now",
    });
  }
  if ((ucla !== null && ucla >= 6) || !senior.active_alert_volunteer_name) {
    nextBestActions.push({
      id: "nba_volunteer",
      label: senior.active_alert_volunteer_name
        ? `Coordinar con ${senior.active_alert_volunteer_name}`
        : "Asignar voluntario cercano (Anillo 2)",
      rationale:
        ucla !== null && ucla >= 6
          ? `Soledad UCLA-3 (${ucla}/9): requiere acompañamiento vecinal o llamada cálida.`
          : "Sin voluntario asignado en alerta activa.",
      actionType: "assign_volunteer",
    });
  }
  nextBestActions.push({
    id: "nba_dossier",
    label: pendingMedCount > 0 ? "Verificar medicación y anotar dossier" : "Registrar intervención en dossier",
    rationale:
      pendingMedCount > 0
        ? "Incidencia de adherencia terapéutica detectada en llamadas recientes."
        : "Dejar trazabilidad clínica/social auditada en historial.",
    actionType: "open_dossier",
  });

  // Compute transparent data completeness % across 6 verifiable domains
  const checks = [
    completedLogs.length > 0,
    series.points.length >= 2,
    ucla !== null && gds !== null,
    vocalBaseline.sampleCount >= 1,
    Boolean(latestLog?.report?.evaluacion_escalas?.autocuidado_y_salud),
    Boolean(senior.meds || senior.key_contact_name),
  ];
  const dataCompletenessPct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return {
    score,
    tier,
    drivers,
    nextBestActions: nextBestActions.slice(0, 3),
    dataCompletenessPct,
    vocalBaseline,
  };
}

/**
 * Signs JSON webhook payloads with HMAC-SHA256 using standard Web Crypto API (`sha256=<hex>`).
 */
export async function signPayloadHmacSha256(payloadText: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(payloadText));
  const bytes = new Uint8Array(sigBuf);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}`;
}

export function isPrivateOrReservedIp(ipRaw: string): boolean {
  const ip = ipRaw.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0] ?? "";
  if (!ip) return true;

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    const c = Number(v4[3]);
    const d = Number(v4[4]);
    if ([a, b, c, d].some((n) => n < 0 || n > 255)) return true;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
    if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    if (a >= 224) return true;
    return false;
  }

  if (ip.includes(":")) {
    if (ip === "::" || ip === "::1") return true;
    if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("ff")) return true;
    if (ip.startsWith("::ffff:")) return true;
    return false;
  }

  return false;
}

export function validateWebhookTargetUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "URL inválida." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Solo se permiten endpoints HTTPS externos." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "No se permiten credenciales incrustadas en la URL." };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.+$/, "").replace(/^\[|\]$/g, "");
  if (!host) return { ok: false, reason: "Hostname vacío." };
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
    return { ok: false, reason: "Hostname numérico no permitido." };
  }
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".arpa")
  ) {
    return { ok: false, reason: "Host local o interno bloqueado por seguridad SSRF." };
  }
  if (isPrivateOrReservedIp(host)) {
    return { ok: false, reason: "IP privada o reservada bloqueada por seguridad SSRF." };
  }
  if (!host.includes(":")) {
    const parts = host.split(".");
    if (parts.length < 2 || parts.some((p) => p.length === 0)) {
      return { ok: false, reason: "Se requiere un dominio público completo (FQDN)." };
    }
  }

  return { ok: true, url: parsed };
}

export function buildFhirR4Bundle(row: ConsoleCensusRow) {
  const nowIso = row.latest_call_at || new Date().toISOString();
  const entries: Record<string, unknown>[] = [
    {
      resource: {
        resourceType: "Patient",
        id: row.senior_id,
        name: [{ text: row.name }],
        telecom: row.phone ? [{ system: "phone", value: row.phone }] : [],
        address: [{ district: row.neighborhood || "Chamberí", country: "ES" }],
      },
    },
    {
      resource: {
        resourceType: "RiskAssessment",
        status: "final",
        subject: { reference: `Patient/${row.senior_id}` },
        occurrenceDateTime: nowIso,
        prediction: [
          {
            outcome: {
              coding: [
                {
                  system: "https://oye.app/fhir/triage-level",
                  code: row.latest_nivel_alerta || "VERDE",
                  display:
                    row.latest_nivel_alerta === "ROJO"
                      ? "Urgencia / Derivación inmediata Anillo 2-3"
                      : row.latest_nivel_alerta === "AMARILLO"
                      ? "Seguimiento preventivo comunitario"
                      : "Estable · Filtrado sin intervención",
                },
              ],
            },
            qualitativeRisk: {
              text: row.latest_headline || row.latest_summary || "Seguimiento diario OYE",
            },
          },
        ],
      },
    },
  ];

  if (row.latest_global_pct !== null) {
    entries.push({
      resource: {
        resourceType: "Observation",
        status: "final",
        category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey" }] }],
        code: { text: "Índice Global de Bienestar OYE (%)" },
        subject: { reference: `Patient/${row.senior_id}` },
        effectiveDateTime: nowIso,
        valueQuantity: { value: row.latest_global_pct, unit: "%" },
      },
    });
  }

  if (row.latest_ucla_score !== null) {
    entries.push({
      resource: {
        resourceType: "Observation",
        status: "final",
        code: { text: "UCLA 3-Item Loneliness Scale (estimación conversacional)" },
        subject: { reference: `Patient/${row.senior_id}` },
        effectiveDateTime: nowIso,
        valueInteger: row.latest_ucla_score,
      },
    });
  }

  if (row.latest_yesavage_score !== null) {
    entries.push({
      resource: {
        resourceType: "Observation",
        status: "final",
        code: { text: "Yesavage GDS-5 Screening Ánimo (estimación conversacional)" },
        subject: { reference: `Patient/${row.senior_id}` },
        effectiveDateTime: nowIso,
        valueInteger: row.latest_yesavage_score,
      },
    });
  }

  if (row.latest_riqueza_lexica !== null) {
    entries.push({
      resource: {
        resourceType: "Observation",
        status: "final",
        code: { text: "Biomarcador Vocal · Riqueza Léxica (%)" },
        subject: { reference: `Patient/${row.senior_id}` },
        effectiveDateTime: nowIso,
        valueQuantity: { value: row.latest_riqueza_lexica, unit: "%" },
      },
    });
  }

  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    meta: {
      source: "https://oye.app/console",
      profile: ["https://hl7.org/fhir/R4/bundle.html"],
    },
    entry: entries,
  };
}

export function buildNativeTriagePayload(row: ConsoleCensusRow) {
  return {
    event: "oye.triage.completed",
    timestamp: row.latest_call_at || new Date().toISOString(),
    senior: {
      person_id: row.senior_id,
      name: row.name,
      age: row.age,
      neighborhood: row.neighborhood,
      key_contact: row.key_contact_name
        ? `${row.key_contact_name}${row.key_contact_phone ? ` (${row.key_contact_phone})` : ""}`
        : null,
    },
    triage: {
      nivel_alerta: row.latest_nivel_alerta || "VERDE",
      global_pct: row.latest_global_pct,
      ucla3_score: row.latest_ucla_score,
      yesavage_gds5_score: row.latest_yesavage_score,
      adherencia_medicacion: row.latest_adherencia || "NO_MENCIONADO",
      biomarcadores: {
        estado_vocal: row.latest_vocal_estado || "FLUIDO_ORIENTADO",
        riqueza_lexica_pct: row.latest_riqueza_lexica,
        palabras_por_respuesta: row.latest_palabras_resp,
        latencia_respuesta_seg: row.latest_latencia_seg,
      },
      anillo_derivacion: row.latest_anillo || "NINGUNO",
      cita_textual: row.latest_cita || null,
    },
  };
}

export type ConsoleQaMetrics = {
  total_live_calls: number;
  simulated_count: number;
  llm_calls_count: number;
  deterministic_count: number;
  verified_count: number;
  false_positive_count: number;
  false_negative_count: number;
  pending_qa_count: number;
  precision_pct: number | null;
};

export function computeModelProvenanceBadge(log: CallLogRow): {
  label: string;
  tone: "llm" | "rules" | "sim" | "legacy";
} {
  const isSim = Boolean(log.is_simulated || (log.conversation_id && log.conversation_id.startsWith("sim-")));
  if (isSim) {
    return { label: "Simulación / Test", tone: "sim" };
  }
  const model = log.analyzer_model || log.report?.auditoria_veracidad?.analyzer_model || "";
  if (model.toLowerCase().includes("gpt-4o")) {
    return { label: "GPT-4o + Verificado", tone: "llm" };
  }
  if (model.includes("deterministic_v")) {
    return { label: "Reglas Clínicas v4", tone: "rules" };
  }
  return { label: "Histórico anterior", tone: "legacy" };
}

export function useConsoleQaMetrics(enabled = true) {
  return useQuery({
    queryKey: ["console", "qa-metrics"],
    enabled,
    queryFn: async (): Promise<ConsoleQaMetrics | null> => {
      const { data, error } = await supabase.rpc("console_qa_metrics");
      if (error) throw error;
      return (data?.[0] as ConsoleQaMetrics | undefined) ?? null;
    },
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

export function useSeniorDossier(seniorId?: string) {
  return useQuery({
    queryKey: ["console", "dossier", seniorId ?? ""],
    enabled: !!seniorId,
    queryFn: async (): Promise<SeniorDossierData> => {
      if (!seniorId) return { interventions: [], alerts: [] };
      const { data, error } = await supabase.rpc("console_get_senior_dossier", {
        _senior_id: seniorId,
      });
      if (error || !data || typeof data !== "object") {
        return { interventions: [], alerts: [] };
      }
      const obj = data as Record<string, unknown>;
      return {
        interventions: Array.isArray(obj["interventions"]) ? (obj["interventions"] as CareInterventionRow[]) : [],
        alerts: Array.isArray(obj["alerts"]) ? (obj["alerts"] as DossierAlertRow[]) : [],
      };
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useCommunityResources(enabled = true) {
  return useQuery({
    queryKey: ["console", "community-resources"],
    enabled,
    queryFn: async (): Promise<CommunityResourceRow[]> => {
      const { data, error } = await supabase.rpc("console_list_community_resources");
      if (error) throw error;
      return (data ?? []) as CommunityResourceRow[];
    },
    staleTime: 30_000,
  });
}

export function useConsoleRealtimeSync(enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel(`console_live_${Math.random().toString(36).slice(2, 7)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
        void qc.invalidateQueries({ queryKey: ["alerts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "call_logs" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
        void qc.invalidateQueries({ queryKey: ["call_logs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "seniors" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
        void qc.invalidateQueries({ queryKey: ["people"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "call_schedules" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteers" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "senior_care" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "care_interventions" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "community_resources" }, () => {
        void qc.invalidateQueries({ queryKey: ["console"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [enabled, qc]);
}
