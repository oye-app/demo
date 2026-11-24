import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  buildClinicalChartSeries,
  buildConsoleCsvExport,
  buildFhirR4Bundle,
  buildNativeTriagePayload,
  classifyUrgencyTier,
  computeCohortUnitEconomics,
  computeDistrictCoverage,
  computeSlaStatus,
  computeTodayScheduleCoverage,
  extractLifeStoryQuotes,
  parseSeniorCsv,
  rankVolunteersForSenior,
  SAMPLE_BARRIO_CSV,
  type ConsoleCensusRow,
  type ConsoleCohortSummary,
  type ConsoleVolunteerRow,
} from "@/lib/console";
import type { CallLogRow } from "@/lib/call-logs";
import { DispatchPanel } from "@/components/console/dispatch-panel";
import { AnalyticsPanel } from "@/components/console/analytics-panel";
import { BatchImportModal } from "@/components/console/batch-import-modal";
import { ClinicalTrajectoryChart } from "@/components/console/clinical-trajectory-chart";
import { FhirViewerCard } from "@/components/console/fhir-viewer-card";
import { DailyAgendaPanel } from "@/components/console/daily-agenda-panel";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function makeSenior(overrides: Partial<ConsoleCensusRow> = {}): ConsoleCensusRow {
  return {
    senior_id: "11111111-1111-1111-1111-111111111111",
    name: "Carmen López",
    age: 84,
    phone: "+34678617031",
    neighborhood: "Chamberí",
    family_contact: "Lucía (+34600111222)",
    active: true,
    notes: "",
    is_demo: true,
    key_contact_name: "Rosa (vecina 2.º)",
    key_contact_phone: "+34678617031",
    meds: "Enalapril 10mg",
    appointments: "Centro de Salud Chamberí",
    birthday: "14 de marzo",
    schedule_active: true,
    schedule_call_hour: 11,
    schedule_days: [1, 2, 3, 4, 5, 6, 7],
    schedule_last_run_on: null,
    schedule_last_error: "",
    active_alert_id: null,
    active_alert_status: null,
    active_alert_mood: null,
    active_alert_need: null,
    active_alert_created_at: null,
    active_alert_volunteer_id: null,
    active_alert_volunteer_name: null,
    active_alert_summary: null,
    active_alert_memory_note: null,
    active_alert_signals: null,
    latest_call_id: "22222222-2222-2222-2222-222222222222",
    latest_call_status: "completada",
    latest_call_at: "2026-11-24T10:00:00Z",
    latest_nivel_alerta: "VERDE",
    latest_global_pct: 88,
    latest_duracion_seg: 95,
    latest_headline: "Carmen está animada",
    latest_summary: "Conversación tranquila sin incidencias",
    latest_ucla_score: 1,
    latest_yesavage_score: 0,
    latest_adherencia: "CONFIRMADA",
    latest_vocal_estado: "FLUIDO_ORIENTADO",
    latest_riqueza_lexica: 88,
    latest_palabras_resp: 18,
    latest_latencia_seg: 2.4,
    latest_tendencia: "estable",
    latest_anillo: "NINGUNO",
    latest_cita: "Salí a comprar el pan",
    calls_7d: 5,
    green_7d: 5,
    amber_red_7d: 0,
    avg_global_pct_7d: 88,
    prev_global_pct: 87,
    visits_30d: 0,
    ...overrides,
  };
}

function makeVolunteer(overrides: Partial<ConsoleVolunteerRow> = {}): ConsoleVolunteerRow {
  return {
    id: "aaaa1111-1111-1111-1111-111111111111",
    name: "Javier Ruiz",
    phone: "+34611000111",
    neighborhood: "Chamberí",
    available: true,
    source: "profile",
    active_visits: 0,
    completed_30d: 4,
    last_visit_at: "2026-11-23T12:00:00Z",
    ...overrides,
  };
}

function makeCallLog(overrides: Partial<CallLogRow> = {}): CallLogRow {
  return {
    id: "call-1",
    created_at: "2026-11-24T10:00:00Z",
    conversation_id: null,
    call_sid: null,
    person_id: "11111111-1111-1111-1111-111111111111",
    nombre: "Carmen López",
    telefono_usuario: "+34678617031",
    status: "completada",
    motivo: null,
    duracion_seg: 95,
    llamada_inicio: null,
    nivel_alerta: "VERDE",
    global_pct: 88,
    activar_protocolo_voy_yo: false,
    acepta_llamada: true,
    acepta_llamadas_diarias: true,
    report: {
      nivel_alerta: "VERDE",
      global_pct: 88,
      home_headline: "Carmen está animada",
      summary: "Llamada tranquila.",
      citas_textuales: ["Me tomé el café leyendo el periódico."],
      oye_recuerda_insight: "Comentó que hoy iba al parque.",
      evaluacion_escalas: {
        indicadores_vocales_cognitivos: {
          estado: "FLUIDO_ORIENTADO",
          observacion: "Fluida",
          biomarcadores: {
            palabras_totales: 54,
            palabras_por_respuesta: 18,
            riqueza_lexica_pct: 91,
            latencia_respuesta_seg: 2.3,
          },
        },
      },
    },
    ...overrides,
  };
}

describe("OYE Consola Web Desktop & Lógica Clínica N1", () => {
  it("classifyUrgencyTier prioriza críticos, caídas silenciosas >=15 pts y verdes", () => {
    const urg = classifyUrgencyTier(makeSenior({ latest_call_status: "urgencia_en_curso", latest_nivel_alerta: "ROJO" }));
    expect(urg.tier).toBe("critical");

    const silentDrop = classifyUrgencyTier(
      makeSenior({ latest_nivel_alerta: "VERDE", latest_global_pct: 70, prev_global_pct: 88 })
    );
    expect(silentDrop.tier).toBe("preventive");
    expect(silentDrop.silentDropDelta).toBe(-18);

    const green = classifyUrgencyTier(makeSenior());
    expect(green.tier).toBe("green");
    expect(green.label).toContain("Verde");
  });

  it("computeSlaStatus escala a +30 min ONG y +60 min persona con llave", () => {
    const now = Date.parse("2026-11-24T12:00:00Z");
    const w35 = computeSlaStatus("2026-11-24T11:25:00Z", "no_contesta", now);
    expect(w35.level).toBe("warning_30");

    const c70 = computeSlaStatus("2026-11-24T10:50:00Z", "no_contesta", now);
    expect(c70.level).toBe("critical_60");
    expect(c70.protocolHint).toContain("llave");
  });

  it("rankVolunteersForSenior prioriza voluntarios libres del mismo barrio", () => {
    const ranked = rankVolunteersForSenior(
      [
        makeVolunteer({ id: "v-busy", name: "Marta Busy", neighborhood: "Chamberí", active_visits: 1 }),
        makeVolunteer({ id: "v-far", name: "Luis Lejos", neighborhood: "Vallecas", active_visits: 0 }),
        makeVolunteer({ id: "v-best", name: "Javier Cerca", neighborhood: "Chamberí", active_visits: 0 }),
        makeVolunteer({ id: "v-off", name: "Carlos Pausa", available: false }),
      ],
      "Chamberí"
    );

    expect(ranked[0]?.id).toBe("v-best");
    expect(ranked[0]?.sameNeighborhood).toBe(true);
    expect(ranked[0]?.matchTag).toContain("Mismo barrio");
    expect(ranked[ranked.length - 1]?.id).toBe("v-off");
  });

  it("computeDistrictCoverage detecta barrios descubiertos sin voluntarios", () => {
    const cov = computeDistrictCoverage(
      [
        makeSenior({ senior_id: "s1", neighborhood: "Chamberí" }),
        makeSenior({ senior_id: "s2", neighborhood: "Tetuán" }),
      ],
      [makeVolunteer({ neighborhood: "Chamberí", available: true })]
    );
    const tetuan = cov.find((d) => d.neighborhood === "Tetuán");
    const chamberi = cov.find((d) => d.neighborhood === "Chamberí");
    expect(tetuan?.coverageGap).toBe(true);
    expect(chamberi?.coverageGap).toBe(false);
  });

  it("computeTodayScheduleCoverage distingue completadas hoy, retrasadas, pendientes y en pausa", () => {
    const now = new Date("2026-11-24T12:30:00+01:00");
    const cov = computeTodayScheduleCoverage(
      [
        makeSenior({ senior_id: "ok", schedule_call_hour: 11, latest_call_at: "2026-11-24T11:05:00+01:00", latest_call_status: "completada" }),
        makeSenior({ senior_id: "late", schedule_call_hour: 10, latest_call_at: "2026-11-23T10:00:00+01:00" }),
        makeSenior({ senior_id: "pend", schedule_call_hour: 17, latest_call_at: "2026-11-23T17:00:00+01:00" }),
        makeSenior({ senior_id: "paused", schedule_active: false }),
      ],
      now
    );

    expect(cov.completedCount).toBe(1);
    expect(cov.overdueCount).toBe(1);
    expect(cov.pendingCount).toBe(1);
    expect(cov.pausedCount).toBe(1);
    expect(cov.entries[0]?.row.senior_id).toBe("late");
  });

  it("buildClinicalChartSeries, extractLifeStoryQuotes y buildFhirR4Bundle generan salida clínica estándar", () => {
    const logs = [
      makeCallLog({ id: "c1", created_at: "2026-11-20T10:00:00Z", global_pct: 90 }),
      makeCallLog({
        id: "c2",
        created_at: "2026-11-24T10:00:00Z",
        global_pct: 74,
        nivel_alerta: "AMARILLO",
        report: {
          nivel_alerta: "AMARILLO",
          global_pct: 74,
          home_headline: "Bajón leve",
          summary: "Dormida tarde",
          citas_textuales: ["Extrañé a mi nieta ayer."],
        },
      }),
    ];

    const series = buildClinicalChartSeries(logs);
    expect(series.points).toHaveLength(2);
    expect(series.baselineAvgPct).toBe(82);
    expect(series.latestPct).toBe(74);

    const quotes = extractLifeStoryQuotes(logs);
    expect(quotes).toHaveLength(2);
    expect(quotes[0]?.quote).toContain("nieta");

    const senior = makeSenior();
    const bundle = buildFhirR4Bundle(senior);
    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.entry.length).toBeGreaterThanOrEqual(5);

    const nativePayload = buildNativeTriagePayload(senior);
    expect(nativePayload.event).toBe("oye.triage.completed");
    expect(nativePayload.triage.biomarcadores.riqueza_lexica_pct).toBe(88);
  });

  it("parseSeniorCsv y buildConsoleCsvExport gestionan CSV español con UTF-8 BOM", () => {
    const { rows, warnings } = parseSeniorCsv(SAMPLE_BARRIO_CSV);
    expect(warnings).toHaveLength(0);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.name).toBe("Carmen Morales");

    const csv = buildConsoleCsvExport([
      makeSenior({ name: 'Carmen, "La Reina"', latest_cita: "Salí a dar un paseo, muy bien" }),
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Carmen, ""La Reina"""');
  });

  it("computeCohortUnitEconomics calcula ingresos B2B y ahorro de horas humanas", () => {
    const summary: ConsoleCohortSummary = {
      total_seniors: 100,
      active_schedules: 92,
      paused_schedules: 8,
      open_alerts: 6,
      no_answer_open: 2,
      dispatched_active: 3,
      calls_30d: 2500,
      green_calls_30d: 2125,
      filter_green_pct: 85,
      visits_30d: 140,
      avg_dispatch_min: 18.5,
      avg_global_pct_30d: 84.2,
      avg_ucla_30d: 1.4,
      avg_yesavage_30d: 0.7,
      med_confirmed_30d: 1900,
      med_evaluated_30d: 2000,
      avg_riqueza_lexica_30d: 89,
      silent_deterioration_count: 5,
    };
    const econ = computeCohortUnitEconomics(summary);
    expect(econ.monthlyB2bRevEur).toBe(1380);
    expect(econ.savedHumanHours).toBe(425);
  });

  it("renderiza DispatchPanel, AnalyticsPanel, BatchImportModal, ClinicalTrajectoryChart, DailyAgendaPanel y FhirViewerCard", () => {
    const qc = new QueryClient();
    const senior = makeSenior({
      active_alert_id: "alert-1",
      active_alert_status: "open",
      active_alert_mood: "no_contesta",
    });
    const vols = [makeVolunteer()];
    const logs = [makeCallLog()];

    render(
      <QueryClientProvider client={qc}>
        <DispatchPanel senior={senior} volunteers={vols} />
        <AnalyticsPanel census={[senior]} volunteers={vols} summary={null} />
        <BatchImportModal open={true} onClose={() => {}} />
        <ClinicalTrajectoryChart seniorName="Carmen López" logs={logs} />
        <DailyAgendaPanel census={[senior]} onInspect={() => {}} />
        <FhirViewerCard census={[senior]} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Despacho Inteligente de Voluntariado/i)).toBeTruthy();
    expect(screen.getByText(/Curva Clínica Multi-Indicador/i)).toBeTruthy();
    expect(screen.getByText(/Cápsula de Historia de Vida/i)).toBeTruthy();
    expect(screen.getByText(/Monitor de Agenda Diaria/i)).toBeTruthy();
    expect(screen.getByText(/HL7 FHIR R4/i)).toBeTruthy();

    fireEvent.click(screen.getByText(/Cargar plantilla de barrio/i));
    expect(screen.getByText(/3 personas listas para importar/i)).toBeTruthy();
  });
});
