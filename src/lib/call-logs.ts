import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NivelAlerta = "VERDE" | "AMARILLO" | "ROJO";

export type CallLogStatus =
  | "llamando"
  | "urgencia_en_curso"
  | "analizando"
  | "completada"
  | "rechazada"
  | "no_contesta"
  | "error";

export type SituationReport = {
  telefono_usuario: string;
  timestamp_evaluacion: string;
  nivel_alerta: NivelAlerta;
  score_bienestar_global: number;
  global_pct: number;
  sub_percentages: {
    mood: number;
    social: number;
    chat: number;
    routine: number;
  };
  home_headline: string;
  call_title: string;
  summary: string;
  oye_recuerda_insight: string;
  top_badges: string[];
  bottom_tags: string[];
  diagnostico_situacion_ejecutivo: string;
  evaluacion_escalas: {
    soledad_ucla: {
      nivel: "SIN_RIESGO" | "RIESGO_MODERADO" | "AISLAMIENTO_SEVERO" | string;
      puntuacion_estimada: number | string;
      evidencia_escuchada: string;
    };
    animo_yesavage_gds5: {
      nivel: "ESTABLE" | "BAJON_ANIMICO" | "ALERTA_APATIA_DEPRESIVA" | string;
      puntuacion_estimada: number | string;
      evidencia_escuchada: string;
    };
    autocuidado_y_salud: {
      alimentacion_hidratacion: "CORRECTO" | "DESCUIDO" | "ALERTA" | string;
      sueno_descanso: "CORRECTO" | "INSOMNIO_FATIGA" | "ALERTA" | string;
      adherencia_medicacion: "CONFIRMADA" | "DUDOSA" | "NO_TOMADA" | string;
      evidencia_escuchada: string;
    };
    indicadores_vocales_cognitivos: {
      estado: "FLUIDO_ORIENTADO" | "LENTITUD_MONOSILABOS" | "DESORIENTACION_CONFUSION" | string;
      observacion: string;
    };
  };
  prescripcion_y_derivacion_humana: {
    activar_protocolo_voy_yo: boolean;
    anillo_derivacion_recomendado:
      | "ANILLO_1_FAMILIA"
      | "ANILLO_2_VOLUNTARIO_CRUZ_ROJA_ONG"
      | "ANILLO_3_SANIDAD_UAD_CENTRO_MAYORES"
      | "NINGUNO"
      | string;
    mensaje_sms_alerta: string;
    prescripcion_social_barrio: string;
  };
};

export type CallLogRow = {
  id: string;
  created_at: string;
  conversation_id: string | null;
  call_sid: string | null;
  person_id: string;
  nombre: string | null;
  telefono_usuario: string | null;
  status: CallLogStatus;
  motivo: string | null;
  duracion_seg: number | null;
  llamada_inicio: string | null;
  nivel_alerta: NivelAlerta | null;
  global_pct: number | null;
  activar_protocolo_voy_yo: boolean | null;
  acepta_llamada: boolean | null;
  acepta_llamadas_diarias: boolean | null;
  report: SituationReport | null;
};

export const STATUS_MESSAGES: Record<CallLogStatus, { title: string; subtitle: string; tone: "info" | "warning" | "destructive" | "success" }> = {
  llamando: {
    title: "Llamando...",
    subtitle: "Marcando el teléfono de la persona mayor",
    tone: "info",
  },
  analizando: {
    title: "Analizando la llamada...",
    subtitle: "Procesando la conversación y contrastando con el historial",
    tone: "info",
  },
  urgencia_en_curso: {
    title: "Urgencia en curso",
    subtitle: "Se ha detectado una situación crítica durante la llamada",
    tone: "destructive",
  },
  completada: {
    title: "Informe disponible",
    subtitle: "Llamada analizada con éxito",
    tone: "success",
  },
  rechazada: {
    title: "Hoy no ha querido hablar",
    subtitle: "La persona declinó la llamada o pidió posponerla",
    tone: "warning",
  },
  no_contesta: {
    title: "Hoy no ha contestado",
    subtitle: "Línea ocupada, buzón de voz o sin respuesta",
    tone: "warning",
  },
  error: {
    title: "No se pudo analizar",
    subtitle: "Hubo un error al procesar el informe de la llamada",
    tone: "destructive",
  },
};

export function fetchLatestCallLog(personId: string) {
  return queryOptions({
    queryKey: ["call_logs", "latest", personId],
    queryFn: async (): Promise<CallLogRow | null> => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .eq("person_id", personId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching latest call_log:", error);
        return null;
      }
      return (data as unknown as CallLogRow) ?? null;
    },
    staleTime: 2000,
  });
}

export function fetchAllCallLogs(personId?: string) {
  return queryOptions({
    queryKey: ["call_logs", "list", personId ?? "all"],
    queryFn: async (): Promise<CallLogRow[]> => {
      let q = supabase.from("call_logs").select("*");
      if (personId) q = q.eq("person_id", personId);
      const { data, error } = await q.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching call_logs:", error);
        return [];
      }
      return (data as unknown as CallLogRow[]) ?? [];
    },
    staleTime: 5000,
  });
}

/**
 * Hook that subscribes via Supabase Realtime to public.call_logs.
 * Updates in under 3 seconds upon INSERT or UPDATE.
 */
export function useLatestCallLog(personId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!personId) return;

    const channelName = `call_logs_realtime_${personId}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_logs",
          filter: `person_id=eq.${personId}`,
        },
        (payload) => {
          // Immediately update query cache on new row or update
          qc.invalidateQueries({ queryKey: ["call_logs"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [personId, qc]);

  return useQuery(fetchLatestCallLog(personId ?? ""));
}

export function useAllCallLogs(personId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const channelName = `call_logs_all_realtime_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_logs",
        },
        () => {
          qc.invalidateQueries({ queryKey: ["call_logs"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery(fetchAllCallLogs(personId));
}
