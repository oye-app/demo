import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SituationReportCard } from "@/components/situation-report";
import type { CallLogRow, SituationReport } from "@/lib/call-logs";

describe("SituationReportCard", () => {
  it("renders 'Llamando...' when status is llamando", () => {
    const log: CallLogRow = {
      id: "1",
      created_at: new Date().toISOString(),
      conversation_id: "conv-1",
      call_sid: "sid-1",
      person_id: "person-1",
      nombre: "Carmen",
      telefono_usuario: "+34678617031",
      status: "llamando",
      motivo: null,
      duracion_seg: null,
      llamada_inicio: null,
      nivel_alerta: null,
      global_pct: null,
      activar_protocolo_voy_yo: null,
      acepta_llamada: null,
      acepta_llamadas_diarias: null,
      report: null,
    };

    render(<SituationReportCard log={log} />);
    expect(screen.getByText("Llamando...")).toBeInTheDocument();
  });

  it("renders 'Urgencia en curso' when status is urgencia_en_curso", () => {
    const log: CallLogRow = {
      id: "2",
      created_at: new Date().toISOString(),
      conversation_id: "conv-2",
      call_sid: "sid-2",
      person_id: "person-1",
      nombre: "Carmen",
      telefono_usuario: "+34678617031",
      status: "urgencia_en_curso",
      motivo: null,
      duracion_seg: null,
      llamada_inicio: null,
      nivel_alerta: "ROJO",
      global_pct: null,
      activar_protocolo_voy_yo: true,
      acepta_llamada: true,
      acepta_llamadas_diarias: null,
      report: null,
    };

    render(<SituationReportCard log={log} />);
    expect(screen.getByText(/¡Alerta crítica en la llamada!/i)).toBeInTheDocument();
  });

  it("renders completed report with disclaimers, badges, scales and voy_yo protocol", () => {
    const mockReport: SituationReport = {
      telefono_usuario: "+34678617031",
      timestamp_evaluacion: new Date().toISOString(),
      nivel_alerta: "AMARILLO",
      score_bienestar_global: 5.4,
      global_pct: 54,
      sub_percentages: { mood: 45, social: 25, chat: 80, routine: 65 },
      home_headline: "Carmen se siente sola esta semana",
      call_title: "Llamada de seguimiento",
      summary: "Carmen ha dormido regular y lleva cuatro días sin salir de casa.",
      oye_recuerda_insight: "Primera llamada: aún no hay historial para comparar.",
      top_badges: ["Ha comido caliente", "Medicación tomada"],
      bottom_tags: ["Soledad", "Insomnio leve"],
      diagnostico_situacion_ejecutivo: "Signos de soledad no deseada: cuatro días sin salir ni ver a nadie.",
      evaluacion_escalas: {
        soledad_ucla: {
          nivel: "RIESGO_MODERADO",
          puntuacion_estimada: 7,
          evidencia_escuchada: "«Llevo cuatro días sin ver a nadie»",
        },
        animo_yesavage_gds5: {
          nivel: "BAJON_ANIMICO",
          puntuacion_estimada: 2,
          evidencia_escuchada: "«Estoy un poco desanimada»",
        },
        autocuidado_y_salud: {
          alimentacion_hidratacion: "CORRECTO",
          sueno_descanso: "INSOMNIO_FATIGA",
          adherencia_medicacion: "CONFIRMADA",
          evidencia_escuchada: "«He dormido regular, pero me he hecho un caldito»",
        },
        indicadores_vocales_cognitivos: {
          estado: "FLUIDO_ORIENTADO",
          observacion: "Respuestas completas y orientadas.",
        },
      },
      prescripcion_y_derivacion_humana: {
        activar_protocolo_voy_yo: true,
        anillo_derivacion_recomendado: "ANILLO_1_FAMILIA",
        mensaje_sms_alerta: "OYE: Carmen se siente sola y lleva 4 días sin salir.",
        prescripcion_social_barrio: "Tarde de dominó y cartas en el centro de mayores, viernes a las 17:00",
      },
    };

    const log: CallLogRow = {
      id: "3",
      created_at: new Date().toISOString(),
      conversation_id: "conv-3",
      call_sid: "sid-3",
      person_id: "person-1",
      nombre: "Carmen",
      telefono_usuario: "+34678617031",
      status: "completada",
      motivo: null,
      duracion_seg: 180,
      llamada_inicio: new Date().toISOString(),
      nivel_alerta: "AMARILLO",
      global_pct: 54,
      activar_protocolo_voy_yo: true,
      acepta_llamada: true,
      acepta_llamadas_diarias: true,
      report: mockReport,
    };

    render(<SituationReportCard log={log} />);

    // Checks headline
    expect(screen.getByText("Carmen se siente sola esta semana")).toBeInTheDocument();
    // Checks mandatory legal disclaimer
    expect(screen.getByText("Estimación orientativa. No es un diagnóstico.")).toBeInTheDocument();
    // Checks badges
    expect(screen.getByText("✓ Ha comido caliente")).toBeInTheDocument();
    // Checks voy yo protocol
    expect(screen.getByText("Protocolo «Voy yo» activo")).toBeInTheDocument();
    // Checks social prescription
    expect(screen.getByText(/Tarde de dominó y cartas/i)).toBeInTheDocument();
  });
});
