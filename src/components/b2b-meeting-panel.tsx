import { useContext } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { Building2, HeartHandshake, PhoneCall, ShieldCheck, X } from "lucide-react";
import { B2B_MODE_OPTIONS, useB2BMode, type B2BClientMode } from "@/lib/b2b-mode";
import { computeLongitudinalMetrics } from "./longitudinal-trend";
import { useAllCallLogs, type CallLogRow } from "@/lib/call-logs";

export function B2BModeSelector() {
  const [mode, setMode] = useB2BMode();

  if (mode === "standard") {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setMode("aseguradora")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Building2 className="size-3" />
          Modo B2B
        </button>
      </div>
    );
  }

  const activeMeta = B2B_MODE_OPTIONS.find((m) => m.id === mode);

  return (
    <section
      aria-label="Selector de vista comercial B2B"
      className="rounded-2xl border border-primary/25 bg-primary/5 p-2.5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Building2 className="size-3.5" />
          Modo Reunión B2B · {activeMeta?.clients}
        </span>
        <button
          type="button"
          onClick={() => setMode("standard")}
          aria-label="Cerrar modo B2B"
          className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" />
          Estándar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {B2B_MODE_OPTIONS.map((opt) => {
          const selected = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id as B2BClientMode)}
              className={`rounded-xl px-2 py-1.5 text-center text-[11px] font-bold transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 text-foreground hover:bg-background"
              }`}
            >
              {opt.shortLabel}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function B2BExecutivePanelWithQuery({
  mode,
  log,
}: {
  mode: Exclude<B2BClientMode, "standard">;
  log: CallLogRow;
}) {
  const { data: fetchedLogs = [] } = useAllCallLogs(log.person_id);
  return <B2BExecutivePanelView mode={mode} log={log} resolvedLogs={fetchedLogs} />;
}

export function B2BExecutivePanel({
  log,
  allLogs,
}: {
  log: CallLogRow;
  allLogs?: CallLogRow[];
}) {
  const [mode] = useB2BMode();
  const queryClient = useContext(QueryClientContext);
  if (mode === "standard" || log.status !== "completada") return null;

  if (allLogs) {
    return <B2BExecutivePanelView mode={mode} log={log} resolvedLogs={allLogs} />;
  }
  if (!queryClient) {
    return <B2BExecutivePanelView mode={mode} log={log} resolvedLogs={[log]} />;
  }
  return <B2BExecutivePanelWithQuery mode={mode} log={log} />;
}

function B2BExecutivePanelView({
  mode,
  log,
  resolvedLogs,
}: {
  mode: Exclude<B2BClientMode, "standard">;
  log: CallLogRow;
  resolvedLogs: CallLogRow[];
}) {

  const report = log.report;
  const alertLevel = report?.nivel_alerta || log.nivel_alerta || "VERDE";
  const summary = computeLongitudinalMetrics(resolvedLogs);
  const realGreenLabel =
    summary.greenRatioPct !== null ? `${summary.greenRatioPct}% en histórico` : "Triaje sin visita";

  const selfCare = report?.evaluacion_escalas?.autocuidado_y_salud;
  const vocal = report?.evaluacion_escalas?.indicadores_vocales_cognitivos;
  const ucla = report?.evaluacion_escalas?.soledad_ucla;
  const yesavage = report?.evaluacion_escalas?.animo_yesavage_gds5;
  const quotes = report?.citas_textuales ?? [];
  const referral = report?.prescripcion_y_derivacion_humana;

  if (mode === "aseguradora") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-extrabold text-primary">
            <ShieldCheck className="size-4" />
            Enfoque Aseguradora Salud (Sanitas · DKV · Mapfre)
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-primary">
            Prevención clínica
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-background/85 p-2.5">
            <span className="block text-[10px] font-semibold text-muted-foreground">Adherencia & Rutina</span>
            <span className="font-bold text-foreground">
              Med: {selfCare?.adherencia_medicacion ?? "—"} · Comida: {selfCare?.alimentacion_hidratacion ?? "—"}
            </span>
          </div>
          <div className="rounded-xl bg-background/85 p-2.5">
            <span className="block text-[10px] font-semibold text-muted-foreground">Fluidez Vocal / Cognitiva</span>
            <span className="font-bold text-foreground">{vocal?.estado ?? "FLUIDO_ORIENTADO"}</span>
          </div>
          <div className="rounded-xl bg-background/85 p-2.5">
            <span className="block text-[10px] font-semibold text-muted-foreground">Filtro Sin Derivación</span>
            <span className="font-bold text-foreground">{realGreenLabel} (obj. ~85% verdes)</span>
          </div>
          <div className="rounded-xl bg-background/85 p-2.5">
            <span className="block text-[10px] font-semibold text-muted-foreground">Prevención Evitable</span>
            <span className="font-bold text-foreground">
              {summary.silentDeterioration
                ? "Deterioro detectado antes de urgencia"
                : "Sin señales de descompensación"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "teleasistencia") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-extrabold text-primary">
            <PhoneCall className="size-4" />
            Enfoque Teleasistencia (Tunstall · ILUNION · Atenzia)
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-primary">
            Ref. piloto 0,46 €/día
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-background/85 p-2.5">
            <span className="block text-[10px] font-semibold text-muted-foreground">Triaje Centralita</span>
            <span className="font-bold text-foreground">
              Semáforo {alertLevel} · {referral?.anillo_derivacion_recomendado ?? "NINGUNO"}
            </span>
          </div>
          <div className="rounded-xl bg-background/85 p-2.5">
            <span className="block text-[10px] font-semibold text-muted-foreground">Marco Estatal 2026-2030</span>
            <span className="font-bold text-foreground truncate block">
              {referral?.prescripcion_social_barrio ?? "Seguimiento comunitario"}
            </span>
          </div>
        </div>
        {quotes[0] && (
          <p className="rounded-xl bg-background/85 p-2.5 italic text-foreground/90">
            <strong className="not-italic text-primary">Evidencia literal para operador: </strong>«{quotes[0]}»
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-extrabold text-primary">
          <HeartHandshake className="size-4" />
          Enfoque Fundación & Impacto (SoledadES · ONCE · la Caixa)
        </span>
        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-primary">
          Escalas validadas
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-background/85 p-2.5">
          <span className="block text-[10px] font-semibold text-muted-foreground">Soledad UCLA-3</span>
          <span className="font-bold text-foreground">{ucla?.puntuacion_estimada ?? "3"}/9</span>
        </div>
        <div className="rounded-xl bg-background/85 p-2.5">
          <span className="block text-[10px] font-semibold text-muted-foreground">Yesavage GDS-5</span>
          <span className="font-bold text-foreground">{yesavage?.puntuacion_estimada ?? "0"}/5</span>
        </div>
        <div className="rounded-xl bg-background/85 p-2.5">
          <span className="block text-[10px] font-semibold text-muted-foreground">Protocolo «Voy yo»</span>
          <span className="font-bold text-foreground">
            {referral?.activar_protocolo_voy_yo ? "Activado (vecino)" : "En prevención"}
          </span>
        </div>
      </div>
    </div>
  );
}
