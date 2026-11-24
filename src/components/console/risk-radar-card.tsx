import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, PhoneCall, ShieldAlert, Sparkles, Users } from "lucide-react";
import type { PredictiveRiskRadar, RiskAction } from "@/lib/console";

type RiskRadarCardProps = {
  radar: PredictiveRiskRadar;
  seniorName: string;
  onAction?: (actionType: RiskAction["actionType"]) => void;
};

const TIER_STYLES: Record<
  PredictiveRiskRadar["tier"],
  { badge: string; bar: string; ring: string; label: string }
> = {
  CRITICO: {
    badge: "bg-rose-600 text-white",
    bar: "bg-rose-600",
    ring: "border-rose-200 bg-rose-50/40",
    label: "Riesgo Crítico",
  },
  ELEVADO: {
    badge: "bg-amber-600 text-white",
    bar: "bg-amber-500",
    ring: "border-amber-200 bg-amber-50/40",
    label: "Riesgo Elevado",
  },
  VIGILANCIA: {
    badge: "bg-sky-600 text-white",
    bar: "bg-sky-500",
    ring: "border-sky-200 bg-sky-50/40",
    label: "En Vigilancia",
  },
  ESTABLE: {
    badge: "bg-emerald-600 text-white",
    bar: "bg-emerald-500",
    ring: "border-emerald-200 bg-emerald-50/30",
    label: "Estable",
  },
};

function actionIcon(actionType: RiskAction["actionType"]) {
  if (actionType === "call_now") return <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
  if (actionType === "assign_volunteer") return <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
  return <Activity className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
}

export function RiskRadarCard({ radar, seniorName, onAction }: RiskRadarCardProps) {
  const style = TIER_STYLES[radar.tier];
  const { vocalBaseline } = radar;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${style.ring}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Radar Predictivo de Riesgo · {seniorName}
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Score explicable 0–100 basado en historial clínico, biometría vocal y brechas de seguimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 tabular-nums"
            title="Porcentaje de dimensiones clínicas respaldadas por datos reales en Supabase"
          >
            Datos reales: {radar.dataCompletenessPct}%
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${style.badge}`}>
            {style.label} · {radar.score}/100
          </span>
        </div>
      </div>

      {/* Linear Risk Gauge */}
      <div className="space-y-1">
        <div className="h-2.5 w-full rounded-full bg-white/90 border border-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${style.bar}`}
            style={{ width: `${Math.max(4, radar.score)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 tabular-nums">
          <span>0 · Estable</span>
          <span>45 · Elevado</span>
          <span>70+ · Intervención prioritaria</span>
        </div>
      </div>

      {/* Explainable Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {radar.drivers.slice(0, 4).map((d) => (
          <div
            key={d.id}
            className="rounded-xl bg-white border border-slate-200/80 px-3 py-2 flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {d.severity === "high" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : d.severity === "medium" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span className="truncate">{d.label}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{d.detail}</p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums ${
                d.points > 0
                  ? d.severity === "high"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                  : d.points < 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {d.points > 0 ? `+${d.points}` : d.points} pts
            </span>
          </div>
        ))}
      </div>

      {/* Personal Vocal Baseline pill */}
      {vocalBaseline.sampleCount > 0 && (
        <div className="rounded-xl bg-white/90 border border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              Biomarcador vocal personal ({vocalBaseline.sampleCount}{" "}
              {vocalBaseline.sampleCount === 1 ? "llamada" : "llamadas"}):{" "}
              <strong className="tabular-nums text-slate-900">
                {vocalBaseline.latestLexicalPct}% riqueza léxica
              </strong>
              {vocalBaseline.sampleCount >= 2 && vocalBaseline.baselineLexicalPct !== null && (
                <span className="text-slate-500">
                  {" "}
                  (base propia {vocalBaseline.baselineLexicalPct}%,{" "}
                  {vocalBaseline.deltaLexicalPct !== null && vocalBaseline.deltaLexicalPct > 0
                    ? `+${vocalBaseline.deltaLexicalPct}`
                    : vocalBaseline.deltaLexicalPct}
                  {" pts"})
                </span>
              )}
            </span>
          </div>
          {vocalBaseline.latestWordsPerTurn !== null && (
            <span className="text-slate-500 tabular-nums">
              {vocalBaseline.latestWordsPerTurn} pal/resp
              {vocalBaseline.latestLatencySec !== null ? ` · ${vocalBaseline.latestLatencySec}s latencia` : ""}
            </span>
          )}
        </div>
      )}

      {/* Next Best Actions (1-Click Dispatch) */}
      <div className="pt-1 border-t border-slate-200/70">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Siguientes Mejores Acciones (1 clic)
        </p>
        <div className="flex flex-wrap gap-2">
          {radar.nextBestActions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onAction?.(act.actionType)}
              title={act.rationale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition cursor-pointer"
            >
              {actionIcon(act.actionType)}
              <span>{act.label}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
