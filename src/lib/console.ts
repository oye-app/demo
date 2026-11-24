import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ESCALATE_FAMILY_MIN, ESCALATE_ONG_MIN, RETRY_MIN, sameArea } from "@/lib/alerts";

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
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [enabled, qc]);
}
