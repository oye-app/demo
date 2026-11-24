import { useContext } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Activity } from "lucide-react";
import { useAllCallLogs, type CallLogRow, type NivelAlerta } from "@/lib/call-logs";

export type TrendPoint = {
  id: string;
  label: string;
  shortDate: string;
  pct: number;
  alertLevel: NivelAlerta;
  uclaScore: number | string | null;
  yesavageScore: number | string | null;
};

export type LongitudinalSummary = {
  points: TrendPoint[];
  latestPct: number | null;
  prevAvgPct: number | null;
  dropFromAvg: number;
  recentYellowRedCount: number;
  silentDeterioration: boolean;
  greenRatioPct: number | null;
  completedCount: number;
};

function resolvePct(row: CallLogRow): number | null {
  if (typeof row.global_pct === "number") return row.global_pct;
  if (typeof row.report?.global_pct === "number") return row.report.global_pct;
  if (typeof row.report?.scores?.global_pct === "number") return row.report.scores.global_pct;
  const lvl = row.report?.nivel_alerta || row.nivel_alerta;
  if (lvl === "ROJO") return 30;
  if (lvl === "AMARILLO") return 64;
  if (lvl === "VERDE") return 88;
  return null;
}

export function computeLongitudinalMetrics(logs: CallLogRow[]): LongitudinalSummary {
  const completedAsc = logs
    .filter((l) => l.status === "completada")
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const valid = completedAsc
    .map((row) => {
      const pct = resolvePct(row);
      if (pct === null) return null;
      const alertLevel: NivelAlerta = row.report?.nivel_alerta || row.nivel_alerta || "VERDE";
      const ucla = row.report?.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada ?? null;
      const yesavage = row.report?.evaluacion_escalas?.animo_yesavage_gds5?.puntuacion_estimada ?? null;
      return { row, pct, alertLevel, ucla, yesavage };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const greenCount = valid.filter((v) => v.alertLevel === "VERDE").length;
  const greenRatioPct = valid.length > 0 ? Math.round((greenCount / valid.length) * 100) : null;

  const recentSlice = valid.slice(-7);
  const total = recentSlice.length;
  const points: TrendPoint[] = recentSlice.map((item, idx) => {
    const offset = total - 1 - idx;
    const label = offset === 0 ? "Hoy" : `Llamada -${offset}`;
    const shortDate = new Date(item.row.created_at).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    return {
      id: item.row.id,
      label,
      shortDate,
      pct: item.pct,
      alertLevel: item.alertLevel,
      uclaScore: item.ucla,
      yesavageScore: item.yesavage,
    };
  });

  if (valid.length === 0) {
    return {
      points: [],
      latestPct: null,
      prevAvgPct: null,
      dropFromAvg: 0,
      recentYellowRedCount: 0,
      silentDeterioration: false,
      greenRatioPct: null,
      completedCount: 0,
    };
  }

  const latest = valid[valid.length - 1];
  if (!latest) {
    return {
      points: [],
      latestPct: null,
      prevAvgPct: null,
      dropFromAvg: 0,
      recentYellowRedCount: 0,
      silentDeterioration: false,
      greenRatioPct: null,
      completedCount: 0,
    };
  }
  const prev = valid.slice(0, -1);
  const prevAvgPct =
    prev.length > 0 ? Math.round(prev.reduce((acc, item) => acc + item.pct, 0) / prev.length) : null;
  const dropFromAvg = prevAvgPct !== null ? prevAvgPct - latest.pct : 0;
  const recentYellowRedCount = valid
    .slice(-3)
    .filter((v) => v.alertLevel === "AMARILLO" || v.alertLevel === "ROJO").length;

  const silentDeterioration = prev.length >= 1 && (dropFromAvg >= 15 || recentYellowRedCount >= 2);

  return {
    points,
    latestPct: latest.pct,
    prevAvgPct,
    dropFromAvg,
    recentYellowRedCount,
    silentDeterioration,
    greenRatioPct,
    completedCount: valid.length,
  };
}

function LongitudinalTrendWithQuery({
  personId,
  currentLog,
}: {
  personId?: string | undefined;
  currentLog?: CallLogRow | undefined;
}) {
  const { data: logs = [] } = useAllCallLogs(personId);
  return <LongitudinalTrendView logs={logs} currentLog={currentLog} />;
}

export function LongitudinalTrendCard({
  personId,
  currentLog,
}: {
  personId?: string | undefined;
  currentLog?: CallLogRow | undefined;
}) {
  const queryClient = useContext(QueryClientContext);
  if (!queryClient) {
    return <LongitudinalTrendView logs={[]} currentLog={currentLog} />;
  }
  return <LongitudinalTrendWithQuery personId={personId} currentLog={currentLog} />;
}

function LongitudinalTrendView({
  logs,
  currentLog,
}: {
  logs: CallLogRow[];
  currentLog?: CallLogRow | undefined;
}) {
  const mergedLogs = (() => {
    if (!currentLog) return logs;
    const exists = logs.some((l) => l.id === currentLog.id || (currentLog.conversation_id && l.conversation_id === currentLog.conversation_id));
    return exists ? logs : [currentLog, ...logs];
  })();

  const summary = computeLongitudinalMetrics(mergedLogs);
  const last = summary.points[summary.points.length - 1];
  const prev = summary.points[summary.points.length - 2];
  if (!last || !prev) return null;

  const stepDelta = last.pct - prev.pct;

  return (
    <section
      aria-label="Tendencia longitudinal"
      className="rounded-2xl border border-border/70 bg-muted/40 p-3.5 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Activity className="size-4 text-primary shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Tendencia Longitudinal (Detección Temprana)
          </h4>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            stepDelta >= 5
              ? "bg-success/15 text-success"
              : stepDelta <= -10
              ? "bg-destructive/15 text-destructive"
              : "bg-background text-muted-foreground"
          }`}
        >
          {stepDelta >= 5 ? (
            <TrendingUp className="size-3" />
          ) : stepDelta <= -10 ? (
            <TrendingDown className="size-3" />
          ) : (
            <Minus className="size-3" />
          )}
          {stepDelta > 0 ? `+${stepDelta} pts` : `${stepDelta} pts`} vs previa
        </span>
      </div>

      {summary.silentDeterioration && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-warning/50 bg-warning/20 p-2.5 text-xs text-foreground"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning-foreground mt-0.5" />
          <div>
            <p className="font-extrabold">Alerta Preventiva: Deterioro silencioso detectado antes de urgencia</p>
            <p className="mt-0.5 text-[11px] text-foreground/85">
              {summary.dropFromAvg >= 15
                ? `Descenso de ${summary.dropFromAvg} pts respecto a la media previa (${summary.prevAvgPct}% → ${summary.latestPct}%).`
                : `${summary.recentYellowRedCount} de las últimas llamadas en seguimiento preventivo (Amarillo/Rojo).`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-0.5">
        {summary.points.slice(-7).map((pt) => {
          const barColor =
            pt.alertLevel === "ROJO"
              ? "bg-destructive"
              : pt.alertLevel === "AMARILLO"
              ? "bg-warning"
              : "bg-success";
          const isToday = pt.label === "Hoy";
          return (
            <div
              key={pt.id}
              className={`flex flex-col justify-between rounded-xl p-2 text-center ${
                isToday ? "border border-primary/40 bg-background shadow-sm" : "bg-background/70"
              }`}
            >
              <span className={`text-[10px] font-bold truncate ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {pt.label}
              </span>
              <span className="text-[9px] text-muted-foreground">{pt.shortDate}</span>
              <div className="my-1.5 flex h-10 items-end justify-center">
                <div className="w-4 overflow-hidden rounded-t-md bg-muted/70 h-full flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${barColor}`}
                    style={{ height: `${Math.max(18, Math.min(100, pt.pct))}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-black text-foreground">{pt.pct}%</span>
              {(pt.uclaScore !== null || pt.yesavageScore !== null) && (
                <span className="mt-0.5 text-[9px] text-muted-foreground">
                  {pt.uclaScore !== null ? `U:${pt.uclaScore}` : ""}
                  {pt.uclaScore !== null && pt.yesavageScore !== null ? " · " : ""}
                  {pt.yesavageScore !== null ? `Y:${pt.yesavageScore}` : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
