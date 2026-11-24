import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildLastCallMemory } from "@/lib/call-memory";
import { computeLongitudinalMetrics } from "@/components/longitudinal-trend";
import { B2BModeSelector } from "@/components/b2b-meeting-panel";
import { SituationReportCard } from "@/components/situation-report";
import { setB2BMode } from "@/lib/b2b-mode";
import type { CallLogRow } from "@/lib/call-logs";

function mockLog(overrides: Partial<CallLogRow>): CallLogRow {
  const alertLvl = overrides.nivel_alerta ?? "AMARILLO";
  const pct = overrides.global_pct ?? 68;
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    conversation_id: "conv-test-1",
    call_sid: null,
    person_id: "d0000000-0000-4000-8000-000000000001",
    nombre: "Carmen",
    telefono_usuario: "+34678617031",
    status: "completada",
    motivo: null,
    duracion_seg: 95,
    llamada_inicio: null,
    nivel_alerta: alertLvl,
    global_pct: pct,
    activar_protocolo_voy_yo: alertLvl !== "VERDE",
    acepta_llamada: true,
    acepta_llamadas_diarias: true,
    report: {
      nivel_alerta: alertLvl,
      global_pct: pct,
      home_headline: "Carmen requiere seguimiento cercano hoy",
      summary: "Comentó que durmió regular.",
      citas_textuales: ["Me costó dormirme anoche."],
      evaluacion_escalas: {
        soledad_ucla: { nivel: "RIESGO_MODERADO", puntuacion_estimada: 6, evidencia_escuchada: "«...»" },
        animo_yesavage_gds5: { nivel: "BAJON_ANIMICO", puntuacion_estimada: 2, evidencia_escuchada: "«...»" },
        autocuidado_y_salud: {
          alimentacion_hidratacion: "CORRECTO",
          sueno_descanso: "INSOMNIO_FATIGA",
          adherencia_medicacion: "CONFIRMADA",
          evidencia_escuchada: "«...»",
        },
        indicadores_vocales_cognitivos: { estado: "FLUIDO_ORIENTADO", observacion: "Discurso claro." },
      },
      prescripcion_y_derivacion_humana: {
        activar_protocolo_voy_yo: alertLvl !== "VERDE",
        anillo_derivacion_recomendado: "ANILLO_2_VOLUNTARIO_CRUZ_ROJA_ONG",
        mensaje_sms_alerta: "Aviso amarillo",
        prescripcion_social_barrio: "Paseo vecinal en Chamberí",
      },
    },
    ...overrides,
  };
}

describe("buildLastCallMemory", () => {
  it("returns safe default when no prior completed call exists", () => {
    const res = buildLastCallMemory(null);
    expect(res.last_alert_level).toBe("VERDE");
    expect(res.last_call_memory).toContain("Primera llamada");
  });

  it("extracts insight and top signals cleanly", () => {
    const res = buildLastCallMemory({
      nivel_alerta: "AMARILLO",
      report: {
        oye_recuerda_insight: "Ayer mencionó dolor leve de rodilla.",
        senales_detectadas: ["Molestia en rodilla", "Buen descanso"],
      },
    });
    expect(res.last_alert_level).toBe("AMARILLO");
    expect(res.last_call_memory).toContain("Ayer mencionó dolor leve de rodilla.");
    expect(res.last_call_memory).toContain("Señales previas: Molestia en rodilla, Buen descanso.");
  });
});

describe("computeLongitudinalMetrics", () => {
  it("detects silent deterioration on >= 15 pt drop vs prior average", () => {
    const logs = [
      mockLog({ created_at: "2026-11-10T10:00:00Z", global_pct: 90, nivel_alerta: "VERDE" }),
      mockLog({ created_at: "2026-11-11T10:00:00Z", global_pct: 86, nivel_alerta: "VERDE" }),
      mockLog({ created_at: "2026-11-12T10:00:00Z", global_pct: 68, nivel_alerta: "AMARILLO" }),
    ];

    const summary = computeLongitudinalMetrics(logs);
    expect(summary.completedCount).toBe(3);
    expect(summary.prevAvgPct).toBe(88);
    expect(summary.dropFromAvg).toBe(20);
    expect(summary.silentDeterioration).toBe(true);
    expect(summary.points.map((p) => p.label)).toEqual(["Llamada -2", "Llamada -1", "Hoy"]);
  });

  it("detects silent deterioration on 2+ AMARILLO/ROJO in recent calls", () => {
    const logs = [
      mockLog({ created_at: "2026-11-10T10:00:00Z", global_pct: 74, nivel_alerta: "AMARILLO" }),
      mockLog({ created_at: "2026-11-11T10:00:00Z", global_pct: 70, nivel_alerta: "AMARILLO" }),
      mockLog({ created_at: "2026-11-12T10:00:00Z", global_pct: 85, nivel_alerta: "VERDE" }),
    ];
    const summary = computeLongitudinalMetrics(logs);
    expect(summary.recentYellowRedCount).toBe(2);
    expect(summary.silentDeterioration).toBe(true);
    expect(summary.greenRatioPct).toBe(33);
  });

  it("ignores non-completed calls and avoids false deterioration on stable green calls", () => {
    const logs = [
      mockLog({ created_at: "2026-11-10T10:00:00Z", global_pct: 88, nivel_alerta: "VERDE" }),
      mockLog({ created_at: "2026-11-11T10:00:00Z", status: "no_contesta", global_pct: null, nivel_alerta: null }),
      mockLog({ created_at: "2026-11-12T10:00:00Z", global_pct: 90, nivel_alerta: "VERDE" }),
    ];
    const summary = computeLongitudinalMetrics(logs);
    expect(summary.completedCount).toBe(2);
    expect(summary.silentDeterioration).toBe(false);
    expect(summary.greenRatioPct).toBe(100);
  });
});

describe("B2B meeting selector and webhook payload viewer", () => {
  it("keeps B2B panel hidden in standard mode and switches cleanly across the 3 client views", () => {
    setB2BMode("standard");
    const log = mockLog({});
    const { unmount } = render(
      <div>
        <B2BModeSelector />
        <SituationReportCard log={log} />
      </div>
    );

    expect(screen.queryByText(/Enfoque Aseguradora Salud/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Modo B2B"));
    expect(screen.getByText(/Enfoque Aseguradora Salud/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Teleasistencia"));
    expect(screen.getByText(/Enfoque Teleasistencia/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Fundación"));
    expect(screen.getByText(/Enfoque Fundación & Impacto/i)).toBeInTheDocument();

    // Expand B2B webhook payload viewer
    fireEvent.click(screen.getByText(/Ver Payload API \/ Webhook B2B/i));
    expect(screen.getByText(/oye\.triage\.completed/)).toBeInTheDocument();
    expect(screen.getByText("Copiar JSON")).toBeInTheDocument();

    unmount();
    setB2BMode("standard");
  });
});
