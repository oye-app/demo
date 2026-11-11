import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, ChevronDown, Phone, ShieldAlert, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Chip, Screen, btn } from "@/components/oye";
import { AlertTimeline } from "@/components/alert-timeline";
import { PersonGate } from "@/components/person-context";
import { personSearch, usePerson } from "@/lib/people";
import { useMe } from "@/lib/auth";
import { MOOD, NEED, STATUS, fmtTime, lonelyLabel, useAlerts, type Alert } from "@/lib/alerts";
import { personDisplayName } from "@/lib/person-presentation";
import { PersonAvatar } from "@/components/person-avatar";
import { useAllCallLogs, type CallLogRow } from "@/lib/call-logs";
import { SituationReportCard } from "@/components/situation-report";

export const Route = createFileRoute("/_authenticated/historial")({
  validateSearch: personSearch,
  head: () => ({
    meta: [
      { title: "Historial de llamadas · OYE" },
      { name: "description", content: "Todas las llamadas de OYE, con su duración y lo que la IA entendió en cada una." },
      { property: "og:title", content: "Historial de llamadas · OYE" },
      { property: "og:description", content: "Cada llamada, con su detalle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryEntry,
});

function HistoryEntry() {
  const { profile } = useMe();
  const { sid } = usePerson();
  if (profile.persona === "voluntario" && !sid) return <HistoryPage />;
  return <PersonGate><HistoryPage /></PersonGate>;
}

function HistoryPage() {
  const { profile, user } = useMe();
  const { data: alerts = [], isLoading: loadingAlerts, error: alertsError } = useAlerts();
  const { sid, person } = usePerson();
  const { data: callLogs = [], isLoading: loadingLogs } = useAllCallLogs(sid);
  const [openId, setOpenId] = useState<string | null>(null);

  const title = profile.persona === "voluntario" ? "Mis visitas" : `Llamadas a ${personDisplayName(person?.name ?? "")}`;

  // Filter legacy alerts for volunteer or current person
  const legacyList = alerts.filter((a) => (!sid || a.senior_id === sid) && (profile.persona !== "voluntario" || a.volunteer_id === user.id));

  const hasLogs = callLogs.length > 0;
  const isLoading = loadingLogs || loadingAlerts;

  return (
    <Screen title={title}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
        {/* Realtime Call Logs from TRD flow */}
        {callLogs.map((log) => (
          <CallLogRowCard
            key={log.id}
            log={log}
            personName={personDisplayName(person?.name ?? log.nombre ?? "Mayor")}
            open={openId === log.id}
            onToggle={() => setOpenId(openId === log.id ? null : log.id)}
          />
        ))}

        {/* Legacy alerts (if any and not already covered by call logs) */}
        {!hasLogs && legacyList.map((a) => (
          <LegacyCallRow
            key={a.id}
            visit={profile.persona === "voluntario"}
            a={a}
            open={openId === a.id}
            onToggle={() => setOpenId(openId === a.id ? null : a.id)}
          />
        ))}

        {alertsError && !hasLogs && (
          <p role="alert" className="pt-10 text-center text-destructive">
            No se pudo cargar el historial.
          </p>
        )}

        {!isLoading && !hasLogs && !legacyList.length && (
          <p className="pt-10 text-center text-muted-foreground">
            {profile.persona === "voluntario" ? "Todavía no hay visitas." : "Todavía no hay llamadas registradas."}
          </p>
        )}
      </div>
    </Screen>
  );
}

function CallLogRowCard({
  log,
  personName,
  open,
  onToggle,
}: {
  log: CallLogRow;
  personName: string;
  open: boolean;
  onToggle: () => void;
}) {
  const d = new Date(log.created_at);
  const day = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const alertBadge =
    log.nivel_alerta === "ROJO"
      ? "bg-destructive text-destructive-foreground"
      : log.nivel_alerta === "AMARILLO"
      ? "bg-warning text-warning-foreground"
      : log.nivel_alerta === "VERDE"
      ? "bg-success text-success-foreground"
      : "bg-muted text-muted-foreground";

  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="tap flex w-full items-center gap-3 p-4 text-left"
      >
        <PersonAvatar id={log.person_id} name={personName} small />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-bold">
            <span className="truncate">{personName}</span>
            {log.nivel_alerta && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${alertBadge}`}>
                {log.nivel_alerta}
              </span>
            )}
            {log.status !== "completada" && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                {log.status.replace(/_/g, " ")}
              </span>
            )}
          </span>
          <span className="block text-xs capitalize text-muted-foreground">
            {day} · {time} · {log.duracion_seg != null ? `${Math.round(log.duracion_seg / 60)} min` : "En curso"}
          </span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-rise space-y-3 border-t p-4 pt-3">
          <SituationReportCard log={log} />
        </div>
      )}
    </article>
  );
}

function LegacyCallRow({ a, open, onToggle, visit = false }: { a: Alert; visit?: boolean; open: boolean; onToggle: () => void }) {
  const m = MOOD[a.mood as keyof typeof MOOD] ?? MOOD.bien;
  const d = new Date(a.created_at);
  const day = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-card">
      <button type="button" onClick={onToggle} aria-expanded={open} className="tap flex w-full items-center gap-3 p-4 text-left">
        <PersonAvatar id={a.senior_id} name={a.senior_name} small />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{personDisplayName(a.senior_name)} · {visit ? STATUS[a.status as keyof typeof STATUS] : m.label}</span>
          <span className="block text-xs capitalize text-muted-foreground">{day} · {fmtTime(a.created_at)} · {visit ? (a.visited_at ? `Visita · ${fmtTime(a.visited_at)}` : "Visita en curso") : a.is_simulated ? `${a.duration_min ?? "—"} min estimados · Demo` : `${a.duration_min ?? "—"} min`}</span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-rise space-y-3 border-t px-4 pt-3 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">{NEED[a.need as keyof typeof NEED]}</span>
            {a.loneliness_score != null && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{lonelyLabel(a.loneliness_score)} · {a.loneliness_score}/9</span>}
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{STATUS[a.status as keyof typeof STATUS]}</span>
          </div>
          {visit && a.senior_id && <Link to="/" search={{sid:a.senior_id,aid:a.id}} className={btn("ghost","sm")}>Abrir visita</Link>}
          <p className="text-sm leading-snug">{a.summary}</p>
          {a.memory_note && <p className="flex gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground"><Brain className="mt-0.5 size-4 shrink-0" />{a.memory_note}</p>}
          {a.signals.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">{a.signals.map((s) => <li key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{s}</li>)}</ul>
          )}
          {a.status !== "closed" && <AlertTimeline a={a} />}
          {a.visit_note && <p className="rounded-xl bg-success/10 p-2.5 text-sm font-semibold">{a.volunteer_name}: «{a.visit_note}»</p>}
        </div>
      )}
    </article>
  );
}
