import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, PauseCircle, PhoneCall } from "lucide-react";
import { computeTodayScheduleCoverage, type ConsoleCensusRow } from "@/lib/console";

export function DailyAgendaPanel({
  census,
  onInspect,
}: {
  census: ConsoleCensusRow[];
  onInspect: (seniorId: string) => void;
}) {
  const navigate = useNavigate();
  const agenda = computeTodayScheduleCoverage(census);

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
      </div>

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
