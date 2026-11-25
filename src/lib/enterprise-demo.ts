import {
  buildFhirR4Bundle,
  computeCohortUnitEconomics,
  type ConsoleCensusRow,
} from "@/lib/console";

export type BaselineBenchmarkKey = "telecare_es" | "sensi_audio" | "manual_callcenter";

export interface BaselineBenchmarkMeta {
  key: BaselineBenchmarkKey;
  label: string;
  shortLabel: string;
  monthlyEurPerSenior: number;
  sourceNote: string;
}

export const BASELINE_BENCHMARKS: Record<BaselineBenchmarkKey, BaselineBenchmarkMeta> = {
  telecare_es: {
    key: "telecare_es",
    label: "Teleasistencia clásica (botón/fijo)",
    shortLabel: "Teleasistencia (24,90 €)",
    monthlyEurPerSenior: 24.9,
    sourceNote: "Referencia servicio teleasistencia estándar España (~24,90 €/mes por usuario).",
  },
  sensi_audio: {
    key: "sensi_audio",
    label: "Monitorización audio continua hogar",
    shortLabel: "Audio continuo (92,00 €)",
    monthlyEurPerSenior: 92.0,
    sourceNote: "Referencia mercado internacional (~100 $/mes · ~92 €/mes sin llamada diaria).",
  },
  manual_callcenter: {
    key: "manual_callcenter",
    label: "Call-center humano diario (10 min/día)",
    shortLabel: "Operador humano (42,00 €)",
    monthlyEurPerSenior: 42.0,
    sourceNote: "Referencia 5 h/mes agente telefónico con supervisión sin triaje IA.",
  },
};

export interface EnterprisePreset {
  id: "municipio" | "teleasistencia" | "aseguradora" | "ong";
  label: string;
  sector: string;
  seniors: number;
  eeaSharePct: number;
  greenFilterRatePct: number;
  baselineKey: BaselineBenchmarkKey;
  summary: string;
}

export const ENTERPRISE_PRESETS: EnterprisePreset[] = [
  {
    id: "municipio",
    label: "Ayuntamiento / Distrito",
    sector: "Sector Público · Servicios Sociales",
    seniors: 250,
    eeaSharePct: 95,
    greenFilterRatePct: 85,
    baselineKey: "telecare_es",
    summary: "Piloto municipal sin hardware con derivación a red vecinal y prescripción social de barrio.",
  },
  {
    id: "teleasistencia",
    label: "Operador Teleasistencia",
    sector: "B2B Telecare · Tunstall / Atenzia",
    seniors: 2500,
    eeaSharePct: 90,
    greenFilterRatePct: 86,
    baselineKey: "telecare_es",
    summary: "Cobertura proactiva diaria sobre parque de terminales ya desplegados y cola SLA.",
  },
  {
    id: "aseguradora",
    label: "Aseguradora Salud Senior",
    sector: "Seguros · Sanitas / Mapfre / DKV",
    seniors: 10000,
    eeaSharePct: 85,
    greenFilterRatePct: 85,
    baselineKey: "sensi_audio",
    summary: "Detección precoz UCLA-3, GDS-5 y adherencia con exportación HL7 FHIR R4 y webhook HMAC.",
  },
  {
    id: "ong",
    label: "Red Nacional ONG",
    sector: "Tercer Sector · SoledadES / Fundaciones",
    seniors: 25000,
    eeaSharePct: 82,
    greenFilterRatePct: 84,
    baselineKey: "manual_callcenter",
    summary: "Escala nacional SIP/VoIP optimizada liberando miles de horas de trabajo social al mes.",
  },
];

export interface CohortSimulationInput {
  seniors: number;
  eeaSharePct: number;
  greenFilterRatePct: number;
  baselineKey: BaselineBenchmarkKey;
  coordinatorHourlyCostEur?: number;
}

export interface CohortSimulationResult {
  seniors: number;
  eeaSharePct: number;
  greenFilterRatePct: number;
  baseline: BaselineBenchmarkMeta;
  tierLabel: "Estándar Optimizado (Opt B)" | "Escala SIP / Telecom (Opt C)";
  costPerSeniorEur: number;
  monthlyOyeCostEur: number;
  annualOyeCostEur: number;
  monthlyBaselineCostEur: number;
  monthlySavingsEur: number;
  annualSavingsEur: number;
  savingsPct: number;
  dailyCallsTotal: number;
  dailyAutoResolvedGreen: number;
  dailyHumanPriorityCases: number;
  monthlyHumanHoursSaved: number;
  fteEquivalentFreed: number;
  monthlyHumanValueSavedEur: number;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Deterministic cohort ROI & staffing simulator built directly on verified
 * `computeCohortUnitEconomics` infrastructure benchmarks.
 */
export function simulateEnterpriseCohort(input: CohortSimulationInput): CohortSimulationResult {
  const seniors = Math.round(clamp(input.seniors, 50, 50000));
  const eeaSharePct = Math.round(clamp(input.eeaSharePct, 0, 100));
  const greenFilterRatePct = Math.round(clamp(input.greenFilterRatePct, 65, 95));
  const hourlyCost = clamp(input.coordinatorHourlyCostEur ?? 22, 12, 80);
  const baseline = BASELINE_BENCHMARKS[input.baselineKey];

  const baseEcon = computeCohortUnitEconomics(null, seniors);
  const perSeniorOptB = baseEcon.seniors > 0 ? baseEcon.optimizedMonthlyCostMidEur / baseEcon.seniors : 8.5;
  const perSeniorOptC = baseEcon.seniors > 0 ? baseEcon.scaleMonthlyCostMidEur / baseEcon.seniors : 4.55;

  // Volume fleets >= 2,500 unlock direct SIP trunking tier (Opt C); international calls add a modest telecom delta
  const usesScaleTier = seniors >= 2500;
  const baseInfraPerSenior = usesScaleTier ? perSeniorOptC : perSeniorOptB;
  const intlFactor = 1 + ((100 - eeaSharePct) / 100) * 0.22;
  const costPerSeniorEur = Math.round(baseInfraPerSenior * intlFactor * 100) / 100;

  const monthlyOyeCostEur = Math.round(seniors * costPerSeniorEur * 100) / 100;
  const annualOyeCostEur = Math.round(monthlyOyeCostEur * 12 * 100) / 100;
  const monthlyBaselineCostEur = Math.round(seniors * baseline.monthlyEurPerSenior * 100) / 100;
  const monthlySavingsEur = Math.round((monthlyBaselineCostEur - monthlyOyeCostEur) * 100) / 100;
  const annualSavingsEur = Math.round(monthlySavingsEur * 12 * 100) / 100;
  const savingsPct =
    monthlyBaselineCostEur > 0
      ? Math.round(((monthlyBaselineCostEur - monthlyOyeCostEur) / monthlyBaselineCostEur) * 1000) / 10
      : 0;

  const dailyCallsTotal = seniors;
  const dailyAutoResolvedGreen = Math.round((dailyCallsTotal * greenFilterRatePct) / 100);
  const dailyHumanPriorityCases = Math.max(0, dailyCallsTotal - dailyAutoResolvedGreen);

  // Use same 12-min/call human benchmark from computeCohortUnitEconomics over 30 days
  const monthlyGreenSummaryEcon = computeCohortUnitEconomics({
    total_seniors: seniors,
    active_schedules: seniors,
    paused_schedules: 0,
    open_alerts: 0,
    no_answer_open: 0,
    dispatched_active: 0,
    calls_30d: dailyCallsTotal * 30,
    green_calls_30d: dailyAutoResolvedGreen * 30,
    filter_green_pct: greenFilterRatePct,
    visits_30d: 0,
    avg_dispatch_min: null,
    avg_global_pct_30d: 88,
    avg_ucla_30d: 1,
    avg_yesavage_30d: 0,
    med_confirmed_30d: dailyCallsTotal * 30,
    med_evaluated_30d: dailyCallsTotal * 30,
    avg_riqueza_lexica_30d: 72,
    silent_deterioration_count: 0,
  });

  const monthlyHumanHoursSaved = monthlyGreenSummaryEcon.savedHumanHours;
  const fteEquivalentFreed = Math.round((monthlyHumanHoursSaved / 160) * 10) / 10;
  const monthlyHumanValueSavedEur = Math.round(monthlyHumanHoursSaved * hourlyCost);

  return {
    seniors,
    eeaSharePct,
    greenFilterRatePct,
    baseline,
    tierLabel: usesScaleTier ? "Escala SIP / Telecom (Opt C)" : "Estándar Optimizado (Opt B)",
    costPerSeniorEur,
    monthlyOyeCostEur,
    annualOyeCostEur,
    monthlyBaselineCostEur,
    monthlySavingsEur,
    annualSavingsEur,
    savingsPct,
    dailyCallsTotal,
    dailyAutoResolvedGreen,
    dailyHumanPriorityCases,
    monthlyHumanHoursSaved,
    fteEquivalentFreed,
    monthlyHumanValueSavedEur,
  };
}

export interface CompetitorMatrixRow {
  criterion: string;
  oye: string;
  tucuvi: string;
  elliq: string;
  sensi: string;
  durcal: string;
  telecross: string;
}

export const COMPETITOR_BENCHMARK_MATRIX: CompetitorMatrixRow[] = [
  {
    criterion: "Hardware requerido en hogar",
    oye: "0 € · Cualquier teléfono fijo o móvil",
    tucuvi: "0 € · Solo llamada telefónica",
    elliq: "Tablet + base en mesa (~250 $)",
    sensi: "Unidades audio ambiente 24/7",
    durcal: "Reloj GPS específico (~199 €)",
    telecross: "Botón colgante / fijo clásico",
  },
  {
    criterion: "Llamada entrante 24/7 + Caller ID",
    oye: "Sí · Contexto vivo + plan de barrio",
    tucuvi: "Limitado a campañas clínicas",
    elliq: "Voz en tablet local, sin telefonía",
    sensi: "Escucha ambiental, sin diálogo",
    durcal: "Botón SOS a central de alarmas",
    telecross: "Solo franja de llamadas voluntarias",
  },
  {
    criterion: "Escalado intra-llamada urgente",
    oye: "Sí (<300 ms · mid-call-alert)",
    tucuvi: "Triaje al cierre de la llamada",
    elliq: "No clínico en tiempo real",
    sensi: "Alerta de incidente ambiental",
    durcal: "Botón manual o detector caída",
    telecross: "Escalamiento manual posterior",
  },
  {
    criterion: "Guardia anti-alucinación verificada",
    oye: "Sí · Citas y recuerdos validados vs texto",
    tucuvi: "Protocolo médico estructurado",
    elliq: "Diálogo abierto de compañía",
    sensi: "Etiquetado automático de audio",
    durcal: "No aplica (telemetría wearable)",
    telecross: "Notas subjetivas de voluntariado",
  },
  {
    criterion: "Cierre humano vecinal con SLA",
    oye: "Sí · Cola SLA 30/60m + Radar barrio",
    tucuvi: "No · Solo canal clínico/enfermería",
    elliq: "No · Solo aviso a familiar en app",
    sensi: "Envío de alerta a agencia de cuidados",
    durcal: "Aviso a familiares en aplicación",
    telecross: "Red humana manual sin radar SLA",
  },
  {
    criterion: "Biomarcadores y escalas clínicas",
    oye: "UCLA-3, GDS-5 + 5 biomarcadores vocales",
    tucuvi: "Protocolos EPOC / ICC / posalta",
    elliq: "Autoreportes simples de bienestar",
    sensi: "Eventos conductuales en domicilio",
    durcal: "Pasos, ritmo cardíaco y GPS",
    telecross: "Sin biomarcadores longitudinales",
  },
  {
    criterion: "Interoperabilidad FHIR R4 + HMAC",
    oye: "Sí · HL7 FHIR R4 LOINC + webhook HMAC",
    tucuvi: "Integración HIS hospitalaria",
    elliq: "Ecosistema propietario cerrado",
    sensi: "Panel propio de agencia",
    durcal: "App cerrada familiar/central",
    telecross: "Sistemas internos sin FHIR abierto",
  },
  {
    criterion: "Referencia coste mensual / mayor",
    oye: "~4,55 €–8,50 € infra IA+voz/mes",
    tucuvi: "Licencia hospitalaria / pagador",
    elliq: "~60 $/mes + equipo inicial",
    sensi: "~92 €/mes (~100 $/mes)",
    durcal: "~19,90 €/mes + reloj ~199 €",
    telecross: "~24,90 €/mes ref. teleasistencia",
  },
];

export interface PilotPhase {
  week: string;
  title: string;
  deliverables: string[];
}

export const PILOT_BLUEPRINT_PHASES: PilotPhase[] = [
  {
    week: "Semana 1",
    title: "Alta Segura, Censo & Silencio",
    deliverables: [
      "Carga masiva CSV de cohorte (hasta 500+ mayores por lote)",
      "Configuración de franja de silencio Madrid (22:00–07:59)",
      "Firma DPA RGPD + alta de webhook HMAC-SHA256 corporativo",
    ],
  },
  {
    week: "Semana 2",
    title: "Calibración Vocal & Línea Base",
    deliverables: [
      "Primeras 5 llamadas por mayor para fijar baseline acústico individual",
      "Validación clínica de citas literales y guardia anti-falsos positivos",
      "Activación de llamadas entrantes 24/7 con reconocimiento Caller ID",
    ],
  },
  {
    week: "Semana 3",
    title: "Red Vecinal, SLA & Prescripción",
    deliverables: [
      "Alta de voluntarios / trabajadoras sociales en Radar de Barrios",
      "Catálogo de recursos sociales locales para prescripción en 1 clic",
      "Simulacros verificados de escalado intra-llamada <300 ms",
    ],
  },
  {
    week: "Semana 4",
    title: "Auditoría Veracidad, FHIR R4 & ROI",
    deliverables: [
      "Exportación HL7 FHIR R4 (LOINC 106418-7 / 48545-8) a EHR/HIS",
      "Auditoría de tasa Filtro Verde (~85%) y tiempos de despacho SLA",
      "Cierre con Dossier Ejecutivo para expansión a flota completa",
    ],
  },
];

export function buildEnterpriseSampleFhirBundle() {
  const sampleRow: ConsoleCensusRow = {
    senior_id: "00000000-0000-4000-8000-000000000001",
    name: "Carmen M. (Ejemplo Estructural)",
    age: 82,
    phone: "+34 600 000 000",
    neighborhood: "Chamberí",
    family_contact: "Marta G. (Hija)",
    active: true,
    notes: "Ejemplo estructural anónimo para evaluación FHIR R4.",
    is_demo: true,
    key_contact_name: "Marta G. (Contacto autorizado)",
    key_contact_phone: "+34 600 000 001",
    meds: "Sintrom 20:00 h · Enalapril 09:00 h",
    appointments: "Cardiología próximo martes 11:00 h",
    birthday: "1944-03-14",
    schedule_active: true,
    schedule_call_hour: 10,
    schedule_days: [1, 2, 3, 4, 5, 6, 7],
    schedule_last_run_on: "2026-11-24",
    schedule_last_error: "",
    active_alert_id: "alert-sample-001",
    active_alert_status: "open",
    active_alert_mood: "alerta",
    active_alert_need: "adherencia",
    active_alert_created_at: "2026-11-24T09:32:15.000Z",
    active_alert_volunteer_id: null,
    active_alert_volunteer_name: null,
    active_alert_summary: "Duda puntual con medicación matinal.",
    active_alert_memory_note: "Prefiere revisión tranquila por la tarde.",
    active_alert_signals: ["Duda pastilla tensión", "Sueño fraccionado"],
    latest_call_id: "call-sample-fhir-001",
    latest_call_status: "completada",
    latest_call_at: "2026-11-24T09:32:10.000Z",
    latest_nivel_alerta: "AMARILLO",
    latest_global_pct: 74,
    latest_duracion_seg: 142,
    latest_headline: "Noche inquieta y duda con pastilla de tensión; pide visita por la tarde.",
    latest_summary: "Conversación coherente con leve preocupación nocturna y duda de adherencia.",
    latest_ucla_score: 2,
    latest_yesavage_score: 1,
    latest_adherencia: "dudosa",
    latest_vocal_estado: "estable",
    latest_riqueza_lexica: 68,
    latest_palabras_resp: 14,
    latest_latencia_seg: 2.1,
    latest_tendencia: "estable",
    latest_anillo: "Anillo 2 · Coordinación Vecinal",
    latest_cita: "Anoche dormí a ratos y no recuerdo si me tomé la pastilla pequeña.",
    calls_7d: 6,
    green_7d: 5,
    amber_red_7d: 1,
    avg_global_pct_7d: 82,
    prev_global_pct: 84,
    visits_30d: 1,
  };

  return {
    structural_sample: true,
    note: "Ejemplo estructural anónimo generado con esquema real HL7 FHIR R4 LOINC de OYE. Para pacientes reales, accede a /consola > Impacto & FHIR.",
    bundle: buildFhirR4Bundle(sampleRow),
  };
}

export function buildEnterpriseProposalMarkdown(
  sim: CohortSimulationResult,
  presetLabel = "Cohorte personalizada",
  organizationName = "Entidad Evaluadora"
): string {
  return [
    `# Propuesta Técnica y Económica de Piloto OYE (30 días)`,
    ``,
    `- **Organización**: ${organizationName}`,
    `- **Escenario seleccionado**: ${presetLabel} (${sim.seniors.toLocaleString("es-ES")} mayores)`,
    `- **Tramo de arquitectura**: ${sim.tierLabel} · ${sim.eeaSharePct}% líneas fijas/móviles EEE`,
    `- **Nota de modelado**: Cifras calculadas con el simulador unitario paramétrico de OYE; no representan facturación emitida ni métricas históricas cerradas.`,
    ``,
    `## 1. Impacto Económico y Operativo Estimado`,
    `| Indicador | Valor Estimado |`,
    `|---|---|`,
    `| Coste infraestructura IA + Voz por mayor / mes | **${sim.costPerSeniorEur.toFixed(2)} €/mes** |`,
    `| Inversión mensual cohorte OYE | **${sim.monthlyOyeCostEur.toLocaleString("es-ES")} €/mes** (${sim.annualOyeCostEur.toLocaleString("es-ES")} €/año) |`,
    `| Referencia comparada (${sim.baseline.label}) | ${sim.monthlyBaselineCostEur.toLocaleString("es-ES")} €/mes (${sim.baseline.monthlyEurPerSenior.toFixed(2)} €/mayor) |`,
    `| Ahorro neto estimado frente a referencia | **${sim.monthlySavingsEur.toLocaleString("es-ES")} €/mes** (${sim.savingsPct}% · ${sim.annualSavingsEur.toLocaleString("es-ES")} €/año) |`,
    `| Tasa Filtro Verde automatizado | **${sim.greenFilterRatePct}%** (${sim.dailyAutoResolvedGreen.toLocaleString("es-ES")} llamadas/día sin carga humana) |`,
    `| Casos prioritarios diarios para equipo humano | **${sim.dailyHumanPriorityCases.toLocaleString("es-ES")} casos/día** |`,
    `| Horas de coordinación liberadas al mes | **${sim.monthlyHumanHoursSaved.toLocaleString("es-ES")} h/mes** (~${sim.fteEquivalentFreed} FTE · valorado en ${sim.monthlyHumanValueSavedEur.toLocaleString("es-ES")} €/mes) |`,
    ``,
    `## 2. Garantías Técnicas Verificables en Producción`,
    `- **Zero-Hardware Universal**: Operativo desde cualquier teléfono fijo analógico o móvil.`,
    `- **Veracidad Anti-Alucinaciones**: GPT-4o contrasta citas literales y memorias biográficas contra la transcripción real (\`analyze-call\`).`,
    `- **Escalado Intra-Llamada < 300 ms**: Disparo paralelo (\`mid-call-alert\`) con apertura de incidente y alerta al contacto de emergencia.`,
    `- **24/7 Inbound + Horario Silencio**: Resolución por Caller ID (\`inbound-call-context\`) y bloqueo de reintentos nocturnos Madrid 22:00–07:59 (\`sla-watchdog\`).`,
    `- **Interoperabilidad Clínica**: Exportación HL7 FHIR R4 (\`LOINC 106418-7\` UCLA-3 y \`48545-8\` GDS-5) y webhooks firmados \`HMAC-SHA256\` con protección SSRF.`,
  ].join("\n");
}
