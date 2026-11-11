import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  PhoneCall,
  Activity,
  Users,
  Brain,
  ShieldAlert,
  Sparkles,
  MapPin,
  MessageSquare,
  Volume2,
} from "lucide-react";
import type { CallLogRow, SituationReport } from "@/lib/call-logs";
import { STATUS_MESSAGES } from "@/lib/call-logs";

interface SituationReportProps {
  log: CallLogRow;
  showExecutiveOnly?: boolean;
}

export function SituationReportCard({ log, showExecutiveOnly = false }: SituationReportProps) {
  const { status, nivel_alerta, report } = log;

  // 1. Status: in-progress or non-completed states
  if (status === "llamando") {
    return (
      <div className="animate-pulse rounded-3xl border border-primary/30 bg-primary/10 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="relative flex size-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-4 rounded-full bg-primary" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-primary">Llamando...</h3>
            <p className="text-xs text-muted-foreground">{STATUS_MESSAGES.llamando.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "analizando") {
    return (
      <div className="animate-pulse rounded-3xl border border-primary/20 bg-secondary/60 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <Brain className="size-6 animate-spin text-primary" style={{ animationDuration: "3s" }} />
          <div>
            <h3 className="text-lg font-bold text-foreground">Analizando la llamada...</h3>
            <p className="text-xs text-muted-foreground">{STATUS_MESSAGES.analizando.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "urgencia_en_curso") {
    return (
      <div className="animate-bounce rounded-3xl border-2 border-destructive bg-destructive/15 p-5 shadow-card">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-8 shrink-0 text-destructive" />
          <div>
            <span className="inline-block rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground uppercase">
              Urgencia en curso
            </span>
            <h3 className="mt-1 text-lg font-black text-destructive">¡Alerta crítica en la llamada!</h3>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Se ha detectado una situación urgente. El protocolo de emergencia ha sido activado y se ha alertado al contacto de confianza.
            </p>
            <p className="mt-2 text-xs font-bold text-destructive">Si es necesario, contacte inmediatamente con el 112.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rechazada") {
    return (
      <div className="rounded-3xl border border-warning/30 bg-warning/10 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <Clock className="size-6 text-warning" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Hoy no ha querido hablar</h3>
            <p className="text-xs text-muted-foreground">{STATUS_MESSAGES.rechazada.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "no_contesta") {
    return (
      <div className="rounded-3xl border border-warning/30 bg-muted/60 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <PhoneCall className="size-6 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Hoy no ha contestado</h3>
            <p className="text-xs text-muted-foreground">
              {log.motivo ? `Motivo: ${log.motivo}` : STATUS_MESSAGES.no_contesta.subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-6 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">No se pudo analizar</h3>
            <p className="text-xs text-muted-foreground">{STATUS_MESSAGES.error.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Status: completada - Render Full Situation Report from JSON
  if (!report) {
    return (
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <p className="text-sm text-muted-foreground">Llamada completada sin informe detallado.</p>
      </div>
    );
  }

  const alertLevel = report.nivel_alerta || nivel_alerta || "VERDE";
  const alertColor =
    alertLevel === "ROJO"
      ? "bg-destructive text-destructive-foreground border-destructive"
      : alertLevel === "AMARILLO"
      ? "bg-warning text-warning-foreground border-warning"
      : "bg-success text-success-foreground border-success";

  const alertBadgeClass =
    alertLevel === "ROJO"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : alertLevel === "AMARILLO"
      ? "bg-warning/20 text-warning-foreground border-warning/40"
      : "bg-success/15 text-success border-success/30";

  return (
    <article className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      {/* Header: Headline & Traffic Light */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black uppercase ${alertBadgeClass}`}>
              Nivel {alertLevel}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {new Date(report.timestamp_evaluacion || log.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-extrabold leading-snug text-foreground">
            {report.home_headline || report.call_title || "Informe de llamada"}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-primary">
            {report.score_bienestar_global != null ? `${report.score_bienestar_global}/10` : `${report.global_pct}%`}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Bienestar</p>
        </div>
      </div>

      {/* Badges & Tags */}
      {(report.top_badges?.length > 0 || report.bottom_tags?.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {report.top_badges?.map((b, i) => (
            <span key={`tb-${i}`} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              ✓ {b}
            </span>
          ))}
          {report.bottom_tags?.map((t, i) => (
            <span key={`bt-${i}`} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Sub-percentages grid */}
      {report.sub_percentages && (
        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/60 p-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Ánimo</p>
            <p className="text-sm font-black text-foreground">{report.sub_percentages.mood}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Social</p>
            <p className="text-sm font-black text-foreground">{report.sub_percentages.social}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Fluidez</p>
            <p className="text-sm font-black text-foreground">{report.sub_percentages.chat}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Rutina</p>
            <p className="text-sm font-black text-foreground">{report.sub_percentages.routine}%</p>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {report.summary && (
        <div className="text-sm leading-relaxed text-foreground">
          <p>{report.summary}</p>
        </div>
      )}

      {/* Cross-call insight */}
      {report.oye_recuerda_insight && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/80 p-3 text-xs text-secondary-foreground">
          <Sparkles className="size-4 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold">Memoria OYE: </span>
            <span>{report.oye_recuerda_insight}</span>
          </div>
        </div>
      )}

      {/* Executive Geriatric Diagnosis with Mandatory Legal Disclaimer */}
      {report.diagnostico_situacion_ejecutivo && (
        <div className="rounded-2xl border border-border/80 bg-background/50 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Diagnóstico ejecutivo de situación
            </h4>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Estimación orientativa. No es un diagnóstico.
            </span>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed font-medium text-foreground">
            {report.diagnostico_situacion_ejecutivo}
          </p>
        </div>
      )}

      {/* If only executive view requested, skip detailed scales breakdown */}
      {!showExecutiveOnly && report.evaluacion_escalas && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Evaluación de Escalas Geriátricas
          </h4>

          {/* UCLA Loneliness Scale */}
          {report.evaluacion_escalas.soledad_ucla && (
            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" /> Soledad (UCLA-3)
                </span>
                <span className="font-extrabold text-foreground">
                  {report.evaluacion_escalas.soledad_ucla.nivel} ({report.evaluacion_escalas.soledad_ucla.puntuacion_estimada}/9)
                </span>
              </div>
              {report.evaluacion_escalas.soledad_ucla.evidencia_escuchada && (
                <p className="mt-1.5 italic text-muted-foreground">
                  {report.evaluacion_escalas.soledad_ucla.evidencia_escuchada}
                </p>
              )}
            </div>
          )}

          {/* Yesavage GDS-5 Mood */}
          {report.evaluacion_escalas.animo_yesavage_gds5 && (
            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Heart className="size-3.5 text-primary" /> Ánimo (Yesavage GDS-5)
                </span>
                <span className="font-extrabold text-foreground">
                  {report.evaluacion_escalas.animo_yesavage_gds5.nivel} ({report.evaluacion_escalas.animo_yesavage_gds5.puntuacion_estimada}/5)
                </span>
              </div>
              {report.evaluacion_escalas.animo_yesavage_gds5.evidencia_escuchada && (
                <p className="mt-1.5 italic text-muted-foreground">
                  {report.evaluacion_escalas.animo_yesavage_gds5.evidencia_escuchada}
                </p>
              )}
            </div>
          )}

          {/* Self-care & Health */}
          {report.evaluacion_escalas.autocuidado_y_salud && (
            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <Activity className="size-3.5 text-primary" /> Autocuidado y Salud
              </span>
              <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
                <div className="rounded bg-background/80 p-1.5">
                  <span className="text-muted-foreground block">Comida:</span>
                  <span className="font-bold">{report.evaluacion_escalas.autocuidado_y_salud.alimentacion_hidratacion}</span>
                </div>
                <div className="rounded bg-background/80 p-1.5">
                  <span className="text-muted-foreground block">Sueño:</span>
                  <span className="font-bold">{report.evaluacion_escalas.autocuidado_y_salud.sueno_descanso}</span>
                </div>
                <div className="rounded bg-background/80 p-1.5">
                  <span className="text-muted-foreground block">Medicación:</span>
                  <span className="font-bold">{report.evaluacion_escalas.autocuidado_y_salud.adherencia_medicacion}</span>
                </div>
              </div>
              {report.evaluacion_escalas.autocuidado_y_salud.evidencia_escuchada && (
                <p className="italic text-muted-foreground pt-0.5">
                  {report.evaluacion_escalas.autocuidado_y_salud.evidencia_escuchada}
                </p>
              )}
            </div>
          )}

          {/* Vocal / Cognitive Indicators */}
          {report.evaluacion_escalas.indicadores_vocales_cognitivos && (
            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Volume2 className="size-3.5 text-primary" /> Indicadores cognitivos y voz
                </span>
                <span className="font-bold text-foreground">
                  {report.evaluacion_escalas.indicadores_vocales_cognitivos.estado}
                </span>
              </div>
              {report.evaluacion_escalas.indicadores_vocales_cognitivos.observacion && (
                <p className="mt-1 text-muted-foreground">
                  {report.evaluacion_escalas.indicadores_vocales_cognitivos.observacion}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Human Referral & Social Prescription */}
      {report.prescripcion_y_derivacion_humana && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Derivación y Protocolo Humano
            </span>
            {report.prescripcion_y_derivacion_humana.activar_protocolo_voy_yo && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">
                Protocolo «Voy yo» activo
              </span>
            )}
          </div>
          {report.prescripcion_y_derivacion_humana.anillo_derivacion_recomendado && (
            <p className="text-foreground">
              <span className="font-semibold text-muted-foreground">Anillo recomendado: </span>
              {report.prescripcion_y_derivacion_humana.anillo_derivacion_recomendado.replace(/_/g, " ")}
            </p>
          )}
          {report.prescripcion_y_derivacion_humana.mensaje_sms_alerta && (
            <p className="rounded-xl bg-background/80 p-2.5 font-mono text-[11px] text-foreground">
              «{report.prescripcion_y_derivacion_humana.mensaje_sms_alerta}»
            </p>
          )}
          {report.prescripcion_y_derivacion_humana.prescripcion_social_barrio && (
            <div className="flex items-start gap-1.5 pt-1 text-primary">
              <MapPin className="size-3.5 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold">Actividad sugerida: </strong>
                {report.prescripcion_y_derivacion_humana.prescripcion_social_barrio}
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
