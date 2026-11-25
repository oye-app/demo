import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, Loader2, PauseCircle, PhoneCall, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeTodayScheduleCoverage, type ConsoleCensusRow } from "@/lib/console";

type WatchdogSummary = {
  stuck_calls_found: number;
  stuck_calls_healed: number;
  sla_warning_30m: number;
  sla_critical_60m: number;
  no_answer_retry_candidates: number;
  quiet_hours_blocked: boolean;
};

export function DailyAgendaPanel({
  census,
  onInspect,
}: {
  census: ConsoleCensusRow[];
  onInspect: (seniorId: string) => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const agenda = computeTodayScheduleCoverage(census);
  const [watchdogBusy, setWatchdogBusy] = useState(false);
  const [watchdogSummary, setWatchdogSummary] = useState<WatchdogSummary | null>(null);

  async function runSlaWatchdog() {
    setWatchdogBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Debes iniciar sesión como operador para ejecutar la vigilancia SLA.");
        return;
      }
      const supabaseUrl =
        (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "https://lkbplpptjkajtyvcdier.supabase.co";
      const anon = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (anon) headers["apikey"] = anon;

      const res = await fetch(`${supabaseUrl}/functions/v1/sla-watchdog`, {
        method: "POST",
        headers,
        body: JSON.stringify({ heal_stuck_calls: true, dispatch_retries: false }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as WatchdogSummary;
      setWatchdogSummary(data);
      await qc.invalidateQueries({ queryKey: ["console"] });
      toast.success(
        data.stuck_calls_healed > 0
          ? `Watchdog SLA: ${data.stuck_calls_healed} llamada(s) recuperadas`
          : "Watchdog SLA ejecutado · Sin llamadas colgadas"
      );
    } catch {
      toast.error("No se pudo ejecutar el Watchdog SLA");
    } finally {
      setWatchdogBusy(false);
    }
  }

  const badgeStyle = {
    completed_today: "bg-success/15 text-success",
    missed_or_overdue: "bg-destructive/15 text-destructive",
    pending_today: "bg-primary/15 text-primary",
    paused: "bg-muted text-muted-foreground",
  } as const;

  const badgeLabel = {
    completed_today: "Llamada hoy OK",
    missed_or_overdue: "Atención / Retraso",
    pending_today: "Pendiente hoy",
    paused: "En pausa",
  } as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-foreground">Monitor de Agenda Diaria · {agenda.madridDateKey}</h2>
          <p className="text-xs text-muted-foreground">
            Control horario (Madrid, hora actual {String(agenda.madridHour).padStart(2, "0")}:00 h) para garantizar cero puntos ciegos diarios.
          </p>
        </div>

        <button
          type="button"
          disabled={watchdogBusy}
          onClick={() => void runSlaWatchdog()}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-secondary disabled:opacity-50 print:hidden"
        >
          {watchdogBusy ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5 text-primary" />}
          Auditar &amp; Sanear SLA
        </button>
      </div>

      {watchdogSummary && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
          <span className="font-bold text-primary">Watchdog SLA activo:</span>
          <span>Colgadas saneadas: <strong>{watchdogSummary.stuck_calls_healed}</strong></span>
          <span>· SLA &gt;30m: <strong>{watchdogSummary.sla_warning_30m}</strong></span>
          <span>· SLA &gt;60m: <strong>{watchdogSummary.sla_critical_60m}</strong></span>
          <span>· Rellamadas elegibles: <strong>{watchdogSummary.no_answer_retry_candidates}</strong></span>
          {watchdogSummary.quiet_hours_blocked && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">Horario silencio nocturno activo</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 text-xs">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <span className="flex items-center gap-1.5 font-bold text-destructive">
            <AlertCircle className="size-4" /> Incidencia / Vencidas
          </span>
          <p className="mt-1.5 text-3xl font-black text-destructive">{agenda.overdueCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-primary">
            <Clock className="size-4" /> Pendientes hoy
          </span>
          <p className="mt-1.5 text-3xl font-black text-primary">{agenda.pendingCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-success">
            <CheckCircle2 className="size-4" /> Completadas hoy
          </span>
          <p className="mt-1.5 text-3xl font-black text-success">{agenda.completedCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
            <PauseCircle className="size-4" /> En pausa / Vacaciones
          </span>
          <p className="mt-1.5 text-3xl font-black text-foreground">{agenda.pausedCount}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-secondary/70 text-[11px] font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Persona</th>
              <th className="px-3 py-3">Barrio</th>
              <th className="px-3 py-3">Hora prevista</th>
              <th className="px-3 py-3">Estado del día</th>
              <th className="px-3 py-3">Detalle</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {agenda.entries.map(({ row, bucket, scheduledHour, reason }) => (
              <tr key={row.senior_id} className="hover:bg-secondary/35">
                <td className="px-4 py-3 font-bold">
                  {row.name}
                  {row.age ? `, ${row.age}` : ""}
                </td>
                <td className="px-3 py-3">{row.neighborhood || "Chamberí"}</td>
                <td className="px-3 py-3 font-mono font-bold">
                  {bucket === "paused" ? "—" : `${String(scheduledHour).padStart(2, "0")}:00 h`}
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeStyle[bucket]}`}>
                    {badgeLabel[bucket]}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{reason}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspect(row.senior_id)}
                      className="rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-secondary/80"
                    >
                      Expediente
                    </button>
                    {bucket !== "paused" && (
                      <button
                        type="button"
                        onClick={() => void navigate({ to: "/llamada", search: { sid: row.senior_id } })}
                        className="inline-flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90"
                      >
                        <PhoneCall className="size-3" /> Llamar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
