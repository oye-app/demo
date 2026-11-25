import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  buildClinicalChartSeries,
  buildConsoleCsvExport,
  buildFhirR4Bundle,
  buildNativeTriagePayload,
  classifyUrgencyTier,
  computeB2BPayerEvidenceReport,
  computeCohortUnitEconomics,
  computeDistrictCoverage,
  computeModelProvenanceBadge,
  computePersonalVocalBaseline,
  computePredictiveRiskRadar,
  computeSlaStatus,
  computeTodayScheduleCoverage,
  extractLifeStoryQuotes,
  parseSeniorCsv,
  rankVolunteersForSenior,
  SAMPLE_BARRIO_CSV,
  signPayloadHmacSha256,
  validateWebhookTargetUrl,
  type ConsoleCensusRow,
  type ConsoleCohortSummary,
  type ConsoleQaMetrics,
  type ConsoleVolunteerRow,
} from "@/lib/console";
import { buildOutboundCallContext, extractLifeMemories, matchNeighborhoodPlan } from "@/lib/call-memory";
import type { CallLogRow } from "@/lib/call-logs";
import { DispatchPanel } from "@/components/console/dispatch-panel";
import { AnalyticsPanel } from "@/components/console/analytics-panel";
import { BatchImportModal } from "@/components/console/batch-import-modal";
import { ClinicalTrajectoryChart } from "@/components/console/clinical-trajectory-chart";
import { FhirViewerCard } from "@/components/console/fhir-viewer-card";
import { DailyAgendaPanel } from "@/components/console/daily-agenda-panel";
import { VeracityAuditPanel } from "@/components/console/veracity-audit-panel";
import { RiskRadarCard } from "@/components/console/risk-radar-card";
import { LivePipelineTester } from "@/components/console/live-pipeline-tester";

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

  it("computeModelProvenanceBadge y VeracityAuditPanel distinguen simulación, reglas y GPT-4o verificado", () => {
    const qc = new QueryClient();
    const simProv = computeModelProvenanceBadge(makeCallLog({ is_simulated: true }));
    expect(simProv.tone).toBe("sim");

    const llmProv = computeModelProvenanceBadge(makeCallLog({ analyzer_model: "gpt-4o+verified" }));
    expect(llmProv.tone).toBe("llm");

    const rulesProv = computeModelProvenanceBadge(makeCallLog({ analyzer_model: "deterministic_v4" }));
    expect(rulesProv.tone).toBe("rules");

    const logWithTurns = makeCallLog({
      analyzer_model: "deterministic_v4",
      transcript_turns: [
        { role: "agent", timeSec: 1, text: "Buenos días Carmen" },
        { role: "user", timeSec: 4, text: "Me tomé el café leyendo el periódico." },
      ],
    });

    const qaMetrics: ConsoleQaMetrics = {
      total_live_calls: 10,
      simulated_count: 2,
      llm_calls_count: 8,
      deterministic_count: 2,
      verified_count: 9,
      false_positive_count: 1,
      false_negative_count: 0,
      pending_qa_count: 0,
      precision_pct: 90.0,
    };

    render(
      <QueryClientProvider client={qc}>
        <VeracityAuditPanel logs={[logWithTurns]} />
        <AnalyticsPanel census={[makeSenior()]} volunteers={[makeVolunteer()]} summary={null} qaMetrics={qaMetrics} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Transcripción Completa Turno a Turno \(2\)/i)).toBeTruthy();
    expect(screen.getByText(/90%/i)).toBeTruthy();
    expect(screen.getByText(/1 FP · 0 FN/i)).toBeTruthy();
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

  it("computePersonalVocalBaseline ignora filas legacy null y detecta desvío longitudinal real", () => {
    const empty = computePersonalVocalBaseline([
      makeCallLog({ id: "legacy", report: { nivel_alerta: "VERDE", global_pct: 80, home_headline: "Legacy", summary: "Legacy" } }),
    ]);
    expect(empty.sampleCount).toBe(0);
    expect(empty.statusLabel).toBe("sin_datos");

    const single = computePersonalVocalBaseline([makeCallLog()]);
    expect(single.sampleCount).toBe(1);
    expect(single.statusLabel).toBe("linea_base_inicial");
    expect(single.deltaLexicalPct).toBe(0);

    const logBase1 = makeCallLog({
      id: "c1",
      created_at: "2026-11-21T10:00:00Z",
      report: {
        nivel_alerta: "VERDE",
        global_pct: 90,
        home_headline: "Bien",
        summary: "Llamada tranquila.",
        evaluacion_escalas: {
          indicadores_vocales_cognitivos: {
            estado: "FLUIDO_ORIENTADO",
            observacion: "Fluido",
            biomarcadores: { palabras_totales: 120, palabras_por_respuesta: 20, riqueza_lexica_pct: 86, latencia_respuesta_seg: 2.0 },
          },
        },
      },
    });
    const logBase2 = makeCallLog({
      id: "c2",
      created_at: "2026-11-22T10:00:00Z",
      report: {
        nivel_alerta: "VERDE",
        global_pct: 88,
        home_headline: "Bien",
        summary: "Llamada tranquila.",
        evaluacion_escalas: {
          indicadores_vocales_cognitivos: {
            estado: "FLUIDO_ORIENTADO",
            observacion: "Fluido",
            biomarcadores: { palabras_totales: 110, palabras_por_respuesta: 18, riqueza_lexica_pct: 84, latencia_respuesta_seg: 2.2 },
          },
        },
      },
    });
    const logDrift = makeCallLog({
      id: "c3",
      created_at: "2026-11-24T10:00:00Z",
      report: {
        nivel_alerta: "AMARILLO",
        global_pct: 62,
        home_headline: "Seguimiento",
        summary: "Respuestas escuetas.",
        evaluacion_escalas: {
          indicadores_vocales_cognitivos: {
            estado: "LENTITUD_MONOSILABOS",
            observacion: "Respuestas escuetas",
            biomarcadores: { palabras_totales: 35, palabras_por_respuesta: 7, riqueza_lexica_pct: 60, latencia_respuesta_seg: 5.4 },
          },
        },
      },
    });

    const drifted = computePersonalVocalBaseline([logBase1, logBase2, logDrift]);
    expect(drifted.sampleCount).toBe(3);
    expect(drifted.baselineLexicalPct).toBe(85);
    expect(drifted.latestLexicalPct).toBe(60);
    expect(drifted.deltaLexicalPct).toBe(-25);
    expect(drifted.driftDetected).toBe(true);
    expect(drifted.statusLabel).toBe("desvio_detectado");
  });

  it("computePredictiveRiskRadar explica factores y acciones prioritarias sin inventar datos", () => {
    const stableRadar = computePredictiveRiskRadar({
      senior: makeSenior({ latest_nivel_alerta: "VERDE", latest_ucla_score: 3, latest_yesavage_score: 0 }),
      logs: [makeCallLog()],
      now: new Date("2026-11-24T12:00:00Z"),
    });
    expect(stableRadar.tier).toBe("ESTABLE");
    expect(stableRadar.score).toBeLessThan(22);

    const riskySenior = makeSenior({
      latest_nivel_alerta: "ROJO",
      latest_global_pct: 40,
      latest_ucla_score: 8,
      latest_yesavage_score: 4,
      latest_call_status: "no_contesta",
      active_alert_id: "al-99",
    });
    const riskyLog1 = makeCallLog({
      id: "r1",
      created_at: "2026-11-20T10:00:00Z",
      global_pct: 88,
      report: {
        nivel_alerta: "VERDE",
        global_pct: 88,
        home_headline: "Normal",
        summary: "Llamada normal.",
        evaluacion_escalas: {
          indicadores_vocales_cognitivos: {
            estado: "FLUIDO_ORIENTADO",
            observacion: "Normal",
            biomarcadores: { palabras_totales: 100, palabras_por_respuesta: 20, riqueza_lexica_pct: 85, latencia_respuesta_seg: 2.0 },
          },
        },
      },
    });
    const riskyLog2 = makeCallLog({
      id: "r2",
      created_at: "2026-11-24T09:00:00Z",
      global_pct: 42,
      report: {
        nivel_alerta: "ROJO",
        global_pct: 42,
        home_headline: "Alerta urgente",
        summary: "No se tomó la pastilla y refiere dudas.",
        recuerdo_biografico_nuevo: "Recordaba su juventud en Bilbao",
        motivos_clinicos: ["soledad", "medicacion"],
        evaluacion_escalas: {
          autocuidado_y_salud: {
            alimentacion_hidratacion: "DESCUIDO",
            sueno_descanso: "ALERTA",
            adherencia_medicacion: "NO_TOMADA",
            evidencia_escuchada: "No se tomó la pastilla.",
          },
          indicadores_vocales_cognitivos: {
            estado: "DESORIENTACION_CONFUSION",
            observacion: "Dudas",
            biomarcadores: { palabras_totales: 30, palabras_por_respuesta: 6, riqueza_lexica_pct: 55, latencia_respuesta_seg: 6.1 },
          },
        },
      },
    });

    const criticalRadar = computePredictiveRiskRadar({
      senior: riskySenior,
      logs: [riskyLog1, riskyLog2],
      now: new Date("2026-11-24T12:00:00Z"),
    });
    expect(criticalRadar.tier).toBe("CRITICO");
    expect(criticalRadar.score).toBeGreaterThanOrEqual(70);
    expect(criticalRadar.nextBestActions[0]?.actionType).toBe("call_now");

    const lifeStories = extractLifeStoryQuotes([riskyLog2]);
    expect(lifeStories[0]?.memoryHighlight).toBe("Recordaba su juventud en Bilbao");
    expect(lifeStories[0]?.motivosClinicos).toEqual(["soledad", "medicacion"]);
  });

  it("validateWebhookTargetUrl bloquea SSRF interno y signPayloadHmacSha256 firma en hex sha256", async () => {
    expect(validateWebhookTargetUrl("http://crm.example.com/hook").ok).toBe(false);
    expect(validateWebhookTargetUrl("https://localhost/hook").ok).toBe(false);
    expect(validateWebhookTargetUrl("https://127.0.0.1/hook").ok).toBe(false);
    expect(validateWebhookTargetUrl("https://169.254.169.254/latest").ok).toBe(false);
    expect(validateWebhookTargetUrl("https://10.0.0.5/api").ok).toBe(false);
    expect(validateWebhookTargetUrl("https://192.168.1.20/api").ok).toBe(false);
    expect(validateWebhookTargetUrl("https://crm.aseguradora.es/api/oye-webhook").ok).toBe(true);

    const sig = await signPayloadHmacSha256('{"hello":"world"}', "secret-123");
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
    const sig2 = await signPayloadHmacSha256('{"hello":"world"}', "secret-123");
    expect(sig2).toBe(sig);
  });

  it("RiskRadarCard dispara callbacks y LivePipelineTester ejecuta auditoría sandbox sin escribir en DB", async () => {
    const onAction = vi.fn();
    const radar = computePredictiveRiskRadar({
      senior: makeSenior({ latest_nivel_alerta: "AMARILLO", latest_ucla_score: 7, latest_call_status: "no_contesta" }),
      logs: [makeCallLog()],
      now: new Date("2026-11-24T12:00:00Z"),
    });

    const origFetch = globalThis.fetch;
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "gpt-4o+verified",
          nivel_alerta: "AMARILLO",
          global_pct: 72,
          call_validity: "verified_human",
          motivos_clinicos: ["soledad", "social_positivo"],
          recuerdo_biografico_nuevo: "Veranos en San Sebastián",
          citas_textuales: ["la casa se me hace muy grande"],
          summary: "Resumen verificado sandbox.",
          evaluacion_escalas: {
            soledad_ucla: { puntuacion_estimada: 6 },
            animo_yesavage_gds5: { puntuacion_estimada: 1 },
            autocuidado_y_salud: { adherencia_medicacion: "CONFIRMADA" },
            indicadores_vocales_cognitivos: { biomarcadores: { riqueza_lexica_pct: 89 } },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = mockFetch as typeof fetch;

    try {
      render(
        <div>
          <RiskRadarCard radar={radar} seniorName="Carmen López" onAction={onAction} />
          <LivePipelineTester seniorName="Carmen López" />
        </div>
      );

      expect(screen.getByText(/Radar Predictivo de Riesgo · Carmen López/i)).toBeTruthy();
      fireEvent.click(screen.getByText(/Lanzar llamada OYE ahora/i));
      expect(onAction).toHaveBeenCalledWith("call_now");

      fireEvent.click(screen.getByText(/Ejecutar auditoría en vivo/i));

      await waitFor(() => {
        expect(screen.getByText(/gpt-4o\+verified/i)).toBeTruthy();
        expect(screen.getByText(/Veranos en San Sebastián/i)).toBeTruthy();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(String((callArgs?.[1] as RequestInit | undefined)?.body || "{}"));
      expect(sentBody.person_id).toBe("test-only-console-audit");
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it("extractLifeMemories, matchNeighborhoodPlan, computeB2BPayerEvidenceReport y marcadores cognitivos funcionan con datos reales", () => {
    const wednesdayMadrid = new Date("2026-11-25T10:00:00Z"); // Miércoles
    const plan = matchNeighborhoodPlan({
      neighborhood: "Chamberí",
      now: wednesdayMadrid,
      resources: [
        {
          name: "Centro Municipal Blasco de Garay",
          category: "centro_mayores",
          neighborhood: "Chamberí",
          schedule: "L-V 10:00–19:00",
        },
        {
          name: "Taller de Memoria & Café Comunitario",
          category: "taller_memoria",
          neighborhood: "Chamberí",
          schedule: "Miércoles 11:30–13:00",
        },
      ],
    });
    expect(plan).toContain("Taller de Memoria & Café Comunitario");

    const outbound = buildOutboundCallContext({
      neighborhood: "Chamberí",
      now: wednesdayMadrid,
      seniorCare: { meds: "Enalapril 10mg", key_contact_name: "Rosa", key_contact_phone: "+34678617031" },
      communityResources: [
        {
          name: "Taller de Memoria & Café Comunitario",
          category: "taller_memoria",
          neighborhood: "Chamberí",
          schedule: "Miércoles 11:30–13:00",
        },
      ],
      recentCompleted: [
        makeCallLog({
          id: "m1",
          report: {
            nivel_alerta: "AMARILLO",
            global_pct: 68,
            home_headline: "Seguimiento",
            summary: "No tomó medicación",
            recuerdo_biografico_nuevo: "Veranos en San Sebastián",
            evaluacion_escalas: {
              soledad_ucla: { nivel: "RIESGO_MODERADO", puntuacion_estimada: 6, evidencia_escuchada: "«...»" },
              autocuidado_y_salud: {
                alimentacion_hidratacion: "CORRECTO",
                sueno_descanso: "CORRECTO",
                adherencia_medicacion: "NO_TOMADA",
                evidencia_escuchada: "«No me la tomé»",
              },
            },
          },
        }),
        makeCallLog({
          id: "m2",
          report: {
            nivel_alerta: "VERDE",
            global_pct: 85,
            home_headline: "Bien",
            summary: "Tranquila",
            recuerdo_biografico_nuevo: "Tenía un canario llamado Pipín",
          },
        }),
      ],
    });

    expect(extractLifeMemories([makeCallLog({ report: { nivel_alerta: "VERDE", global_pct: 80, home_headline: "Bien", summary: "Bien", recuerdo_biografico_nuevo: "Recuerdo X" } })])).toEqual(["Recuerdo X"]);
    expect(outbound.life_memories).toContain("Veranos en San Sebastián");
    expect(outbound.life_memories).toContain("Pipín");
    expect(outbound.pending_followups).toContain("Enalapril 10mg");
    expect(outbound.clinical_focus_mode).toBe("vigilancia_adherencia");

    const radarWithRepetition = computePredictiveRiskRadar({
      senior: makeSenior(),
      logs: [
        makeCallLog({
          report: {
            nivel_alerta: "VERDE",
            global_pct: 82,
            home_headline: "Bien",
            summary: "Charla repetitiva",
            evaluacion_escalas: {
              indicadores_vocales_cognitivos: {
                estado: "FLUIDO_ORIENTADO",
                observacion: "Ok",
                biomarcadores: {
                  palabras_totales: 50,
                  palabras_por_respuesta: 15,
                  riqueza_lexica_pct: 70,
                  latencia_respuesta_seg: 2.5,
                  indice_repeticion_tema: 0.56,
                },
              },
            },
          },
        }),
      ],
      now: wednesdayMadrid,
    });
    expect(radarWithRepetition.drivers.some((d) => d.id === "cognitive_micro_markers")).toBe(true);

    const summary: ConsoleCohortSummary = {
      total_seniors: 100,
      active_schedules: 95,
      paused_schedules: 5,
      open_alerts: 2,
      no_answer_open: 1,
      dispatched_active: 1,
      calls_30d: 1000,
      green_calls_30d: 820,
      filter_green_pct: 82,
      visits_30d: 18,
      avg_dispatch_min: 14,
      avg_global_pct_30d: 83,
      avg_ucla_30d: 4.1,
      avg_yesavage_30d: 1.2,
      med_confirmed_30d: 900,
      med_evaluated_30d: 980,
      avg_riqueza_lexica_30d: 86,
      silent_deterioration_count: 3,
    };
    const evidence = computeB2BPayerEvidenceReport({
      census: [makeSenior()],
      summary,
      qaMetrics: {
        total_live_calls: 50,
        simulated_count: 5,
        llm_calls_count: 50,
        deterministic_count: 0,
        verified_count: 48,
        false_positive_count: 2,
        false_negative_count: 0,
        pending_qa_count: 0,
        precision_pct: 96,
      },
    });
    expect(evidence.greenFilteredRatePct).toBe(82);
    expect(evidence.savingVsClassicTelecarePct).toBe(66);
    expect(evidence.savingVsAmbientSensorsPct).toBe(91);
    expect(evidence.markdownDossier).toContain("96%");

    const fhirJson = JSON.stringify(buildFhirR4Bundle(makeSenior()));
    expect(fhirJson).toContain("https://loinc.org");
    expect(fhirJson).toContain("106418-7");
    expect(fhirJson).toContain("48545-8");
    expect(fhirJson).toContain("fullUrl");
  });
});
