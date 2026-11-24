import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  buildConsoleCsvExport,
  classifyUrgencyTier,
  computeCohortUnitEconomics,
  computeDistrictCoverage,
  computeSlaStatus,
  parseSeniorCsv,
  rankVolunteersForSenior,
  SAMPLE_BARRIO_CSV,
  type ConsoleCensusRow,
  type ConsoleCohortSummary,
  type ConsoleVolunteerRow,
} from "@/lib/console";
import { DispatchPanel } from "@/components/console/dispatch-panel";
import { AnalyticsPanel } from "@/components/console/analytics-panel";
import { BatchImportModal } from "@/components/console/batch-import-modal";

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

describe("OYE Consola Web Desktop & Lógica de Coordinación", () => {
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

  it("parseSeniorCsv interpreta CSV español con punto y coma y valida filas", () => {
    const { rows, warnings } = parseSeniorCsv(SAMPLE_BARRIO_CSV);
    expect(warnings).toHaveLength(0);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.name).toBe("Carmen Morales");
    expect(rows[0]?.age).toBe(84);
    expect(rows[0]?.key_contact_name).toBe("Rosa vecina 2º");

    const invalid = parseSeniorCsv("nombre;edad\n;85\nPepe;12");
    expect(invalid.rows).toHaveLength(1);
    expect(invalid.warnings.length).toBe(2);
  });

  it("buildConsoleCsvExport incluye BOM UTF-8 y escapa comillas/comas", () => {
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
    expect(econ.optimizedMonthlyCostMidEur).toBeLessThan(econ.monthlyB2bRevEur);
  });

  it("renderiza DispatchPanel, AnalyticsPanel y BatchImportModal sin errores", () => {
    const qc = new QueryClient();
    const senior = makeSenior({
      active_alert_id: "alert-1",
      active_alert_status: "open",
      active_alert_mood: "no_contesta",
    });
    const vols = [makeVolunteer()];

    render(
      <QueryClientProvider client={qc}>
        <DispatchPanel senior={senior} volunteers={vols} />
        <AnalyticsPanel census={[senior]} volunteers={vols} summary={null} />
        <BatchImportModal open={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Despacho Inteligente de Voluntariado/i)).toBeTruthy();
    expect(screen.getByText(/Recomendado/i)).toBeTruthy();
    expect(screen.getByText(/Radar de Cobertura Territorial/i)).toBeTruthy();

    const loadSampleBtn = screen.getByText(/Cargar plantilla de barrio/i);
    fireEvent.click(loadSampleBtn);
    expect(screen.getByText(/3 personas listas para importar/i)).toBeTruthy();
  });
});
