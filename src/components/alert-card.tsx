import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AlertTimeline } from "./alert-timeline";
import { MOOD, NEED, STATUS, escalation, timeAgo, type Alert } from "@/lib/alerts";
import { personDisplayName } from "@/lib/person-presentation";
import { PersonAvatar } from "./person-avatar";

export function AlertCard({ a, actions, showTranscript = true }: { a: Alert; actions?: React.ReactNode; showTranscript?: boolean }) {
  const [open, setOpen] = useState(false);
  const m = MOOD[a.mood as keyof typeof MOOD];
  return (
    <article className="animate-rise rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <PersonAvatar id={a.senior_id} name={a.senior_name} small />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`size-2.5 shrink-0 rounded-full ${m.dot}`} />
            <h3 className="truncate text-lg font-extrabold">{personDisplayName(a.senior_name)}</h3>
          </div>
          <p className="text-sm font-semibold text-primary">{NEED[a.need as keyof typeof NEED]}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
      </div>
      {a.summary && <p className="mt-2 text-[0.95rem] leading-snug text-foreground">{a.summary}</p>}
      {a.memory_note && <p className="mt-1.5 text-sm text-muted-foreground">{a.memory_note}</p>}
      {a.signals.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {a.signals.map((s) => <li key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{s}</li>)}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {STATUS[a.status as keyof typeof STATUS]}{a.volunteer_name ? ` · ${a.volunteer_name}` : ""}{a.family_notified ? " · Familia avisada" : ""}
      </p>
      {(() => { const e = escalation(a); return e.label || e.next ? (
        <p className={`mt-2 rounded-xl p-2.5 text-sm font-semibold ${e.level ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
          {e.label}{e.label && e.next ? " · " : ""}{e.next && <span className="font-normal">Si nadie va: {e.next}</span>}
        </p>) : null; })()}
      {a.visit_note && <p className="mt-2 rounded-xl bg-success/10 p-2.5 text-sm font-semibold">{a.volunteer_name}: «{a.visit_note}»</p>}
      {a.status !== "closed" && <AlertTimeline a={a} />}
      {actions && <div className="mt-4">{actions}</div>}
      {showTranscript && a.transcript.length > 0 && (
        <>
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
            {open ? "Ocultar llamada" : "Ver la llamada"} <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <ol className="mt-2 space-y-1.5 rounded-2xl bg-muted p-3 text-sm">
              {a.transcript.map((l, i) => (
                <li key={i}><strong className={l.who === "oye" ? "text-primary" : "text-foreground"}>{l.who === "oye" ? "OYE" : personDisplayName(a.senior_name)}:</strong> {l.text}</li>
              ))}
            </ol>
          )}
        </>
      )}
    </article>
  );
}
