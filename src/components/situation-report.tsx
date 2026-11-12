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
  MessageSquareQuote,
  Volume2,
  HandHeart,
} from "lucide-react";
import type { CallLogRow } from "@/lib/call-logs";
import { STATUS_MESSAGES } from "@/lib/call-logs";

interface SituationReportProps {
  log: CallLogRow;
  showExecutiveOnly?: boolean;
}

const HUMAN_LABELS: Record<string, string> = {
  SIN_RIESGO: "Sin riesgo",
  RIESGO_MODERADO: "Riesgo moderado",
  AISLAMIENTO_SEVERO: "Aislamiento severo",
  ESTABLE: "Estable",
  BAJON_ANIMICO: "Bajón anímico",
  ALERTA_APATIA_DEPRESIVA: "Alerta de apatía",
  CORRECTO: "Correcto",
  DESCUIDO: "Descuido leve",
  ALERTA: "Alerta",
  INSOMNIO_FATIGA: "Cansancio / Sueño irregular",
  CONFIRMADA: "Confirmada",
  DUDOSA: "Dudosa",
  NO_TOMADA: "Pendiente",
  NO_MENCIONADO: "No mencionado",
  NO_MENCIONADA: "No mencionada",
  FLUIDO_ORIENTADO: "Fluido y orientado",
  LENTITUD_MONOSILABOS: "Pausado / Monosílabos",
  DESORIENTACION_CONFUSION: "Desorientación detectada",
  NINGUNO: "Seguimiento habitual (sin alerta)",
  ANILLO_1_FAMILIA: "Anillo 1 · Familia de referencia",
  ANILLO_2_VOLUNTARIO_CRUZ_ROJA_ONG: "Anillo 2 · Vecino voluntario («Voy yo») / ONG",
  ANILLO_3_SANIDAD_UAD_CENTRO_MAYORES: "AnILLO 3 · Servicios sociosanitarios",
};

function humanize(code?: string | null): string {
  if (!code) return "—";
  return HUMAN_LABELS[code] || code.replace(/_/g, " ");
}

function formatDuration(sec?: number | null): string | null {
  if (!sec || sec <= 0) return null;
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins === 0) return `${rem} s`;
  if (rem === 0) return `${mins} min`;
  return `${mins} min ${rem} s`;
}

export function SituationReportCard({ log, showExecutiveOnly = false }: SituationReportProps) {
  const { status, nivel_alerta, report, duracion_seg } = log;

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
            <h3 className="text-lg font-bold text-primary">Llamando a {log.nombre || "la persona"}...</h3>
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
      <div className="rounded-3xl border-2 border-destructive bg-destructive/15 p-5 shadow-card">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-8 shrink-0 text-destructive animate-pulse" />
          <div>
            <span className="inline-block rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground uppercase">
              Urgencia en curso · Nivel ROJO
            </span>
            <h3 className="mt-1.5 text-lg font-black text-destructive">¡Alerta crítica detectada en la llamada!</h3>
            <p className="mt-1 text-sm font-semibold text-foreground">
              { log.motivo || "Se ha detectado una situación urgente. El protocolo «Voy yo» ha sido activado y se ha notificado al contacto de confianza." }
            </p>
            <p className="mt-2 rounded-xl bg-destructive/15 px-3 py-2 text-xs font-bold text-destructive">
              Si hay riesgo vital o sanitario inmediato, llame al 112 (o al 024 en crisis emocional).
            </p>
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
            <p className="text-xs text-muted-foreground">
              {log.motivo || STATUS_MESSAGES.rechazada.subtitle}
            </p>
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

  // 2. Status: completada - Render Full Situation Report
  const alertLevel = report?.nivel_alerta || nivel_alerta || "VERDE";
  const globalPct =
    report?.global_pct ??
    report?.scores?.global_pct ??
    log.global_pct ??
    (alertLevel === "ROJO" ? 30 : alertLevel === "AMARILLO" ? 64 : 90);
  const score10 =
    report?.score_bienestar_global ?? Number((globalPct / 10).toFixed(1));

  const subPercentages = report?.sub_percentages ?? {
    mood: alertLevel === "ROJO" ? 30 : alertLevel === "AMARILLO" ? 62 : 92,
    social: alertLevel === "ROJO" ? 35 : alertLevel === "AMARILLO" ? 60 : 88,
    chat: alertLevel === "ROJO" ? 40 : alertLevel === "AMARILLO" ? 74 : 94,
    routine: alertLevel === "ROJO" ? 25 : alertLevel === "AMARILLO" ? 68 : 90,
  };

  const headline =
    report?.home_headline ||
    report?.call_title ||
    `${log.nombre || "Carmen"} está tranquila y con buen ánimo hoy`;

  const summary =
    report?.summary ||
    log.motivo ||
    `Conversación completada con normalidad. Se muestra orientada, receptiva y con sus rutinas al día.`;

  const memoryInsight = report?.oye_recuerda_insight || report?.nota_memoria;
  const familyRec = report?.recomendacion_familiar;
  const quotes = report?.citas_textuales ?? [];
  const topBadges = report?.top_badges ?? ["Medicación al día", "Buen descanso", "Orientada y fluida"];
  const bottomTags = report?.bottom_tags ?? report?.senales_detectadas ?? [];
  const durationLabel = formatDuration(duracion_seg);

  const alertBadgeClass =
    alertLevel === "ROJO"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : alertLevel === "AMARILLO"
      ? "bg-warning/20 text-warning-foreground border-warning/40"
      : "bg-success/15 text-success border-success/30";

  return (
    <article className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
      {/* Header: Headline, Duration & Traffic Light */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black uppercase ${alertBadgeClass}`}>
              Semáforo {alertLevel}
            </span>
            {durationLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-foreground">
                <Clock className="size-3 text-primary" /> {durationLabel}
              </span>
            )}
            <span className="text-xs font-semibold text-muted-foreground">
              {new Date(report?.timestamp_evaluacion || log.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold leading-snug text-foreground">{headline}</h2>
        </div>
        <div className="shrink-0 rounded-2xl bg-primary/10 px-3 py-2 text-right">
          <div className="text-2xl font-black leading-none text-primary">{score10}/10</div>
          <p className="mt-1 text-[10px] font-bold uppercase text-primary/80">{globalPct}% Bienestar</p>
        </div>
      </div>

      {/* Badges & Signals */}
      {(topBadges.length > 0 || bottomTags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {topBadges.map((b, i) => (
            <span key={`tb-${i}`} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              ✓ {b}
            </span>
          ))}
          {bottomTags
            .filter((t) => !topBadges.includes(t))
            .map((t, i) => (
              <span key={`bt-${i}`} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                {t}
              </span>
            ))}
        </div>
      )}

      {/* 4-Pillar Sub-percentages Grid with Visual Bars */}
      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/60 p-3 text-center">
        {[
          { label: "Ánimo", val: subPercentages.mood },
          { label: "Social", val: subPercentages.social },
          { label: "Fluidez", val: subPercentages.chat },
          { label: "Rutina", val: subPercentages.routine },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
            <p className="text-sm font-black text-foreground">{item.val}%</p>
            <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full ${
                  item.val >= 75 ? "bg-success" : item.val >= 45 ? "bg-warning" : "bg-destructive"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      <div className="text-sm leading-relaxed text-foreground">
        <p>{summary}</p>
      </div>

      {/* Verbatim Quotes from Call */}
      {quotes.length > 0 && (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3.5 space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <MessageSquareQuote className="size-4" /> Escuchado en la llamada
          </p>
          {quotes.map((q, idx) => (
            <p key={idx} className="text-xs italic leading-relaxed text-foreground/90">
              {q.startsWith("«") ? q : `«${q}»`}
            </p>
          ))}
        </div>
      )}

      {/* Cross-call Insight (Memoria OYE) */}
      {memoryInsight && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/80 p-3 text-xs text-secondary-foreground">
          <Sparkles className="size-4 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold">OYE recuerda: </span>
            <span>{memoryInsight}</span>
          </div>
        </div>
      )}

      {/* Recommendation for Family */}
      {familyRec && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-background/70 p-3 text-xs text-foreground">
          <HandHeart className="size-4 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-primary">Recomendación hoy: </span>
            <span>{familyRec}</span>
          </div>
        </div>
      )}

      {/* Executive Geriatric Diagnosis with Mandatory Legal Disclaimer */}
      {!showExecutiveOnly && report?.diagnostico_situacion_ejecutivo && (
        <div className="rounded-2xl border border-border/80 bg-background/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Valoración orientativa de la llamada
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

      {/* Detailed Geriatric Scales Breakdown */}
      {!showExecutiveOnly && report?.evaluacion_escalas && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Escalas de Bienestar y Triaje Preventivo
            </h4>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Estimación orientativa. No es un diagnóstico.
            </span>
          </div>

          {/* UCLA Loneliness Scale */}
          {report.evaluacion_escalas.soledad_ucla && (
            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" /> Soledad percibida (UCLA-3)
                </span>
                <span className="font-extrabold text-foreground">
                  {humanize(report.evaluacion_escalas.soledad_ucla.nivel)} ({report.evaluacion_escalas.soledad_ucla.puntuacion_estimada}/9)
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
                  <Heart className="size-3.5 text-primary" /> Estado de ánimo (Yesavage GDS-5)
                </span>
                <span className="font-extrabold text-foreground">
                  {humanize(report.evaluacion_escalas.animo_yesavage_gds5.nivel)} ({report.evaluacion_escalas.animo_yesavage_gds5.puntuacion_estimada}/5)
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
                <Activity className="size-3.5 text-primary" /> Autocuidado y Rutina Diaria
              </span>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                <div className="rounded-xl bg-background/80 p-2">
                  <span className="text-muted-foreground block">Alimentación</span>
                  <span className="font-bold text-foreground">
                    {humanize(report.evaluacion_escalas.autocuidado_y_salud.alimentacion_hidratacion)}
                  </span>
                </div>
                <div className="rounded-xl bg-background/80 p-2">
                  <span className="text-muted-foreground block">Descanso</span>
                  <span className="font-bold text-foreground">
                    {humanize(report.evaluacion_escalas.autocuidado_y_salud.sueno_descanso)}
                  </span>
                </div>
                <div className="rounded-xl bg-background/80 p-2">
                  <span className="text-muted-foreground block">Medicación</span>
                  <span className="font-bold text-foreground">
                    {humanize(report.evaluacion_escalas.autocuidado_y_salud.adherencia_medicacion)}
                  </span>
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
                  <Volume2 className="size-3.5 text-primary" /> Fluidez verbal y orientación
                </span>
                <span className="font-bold text-foreground">
                  {humanize(report.evaluacion_escalas.indicadores_vocales_cognitivos.estado)}
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
      {!showExecutiveOnly && report?.prescripcion_y_derivacion_humana && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Red de Cercanía y Derivación Humana
            </span>
            {report.prescripcion_y_derivacion_humana.activar_protocolo_voy_yo && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground">
                Protocolo «Voy yo» activo
              </span>
            )}
          </div>
          {report.prescripcion_y_derivacion_humana.anillo_derivacion_recomendado && (
            <p className="text-foreground">
              <span className="font-semibold text-muted-foreground">Nivel de actuación: </span>
              <span className="font-bold">
                {humanize(report.prescripcion_y_derivacion_humana.anillo_derivacion_recomendado)}
              </span>
            </p>
          )}
          {report.prescripcion_y_derivacion_humana.prescripcion_social_barrio && (
            <div className="flex items-start gap-1.5 pt-1 text-primary">
              <MapPin className="size-3.5 shrink-0 mt-0.5" />
              <span>
                <strong className="font-semibold">Actividad de barrio sugerida: </strong>
                {report.prescripcion_y_derivacion_humana.prescripcion_social_barrio}
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
