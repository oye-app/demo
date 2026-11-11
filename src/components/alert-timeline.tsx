import { Check } from "lucide-react";
import { fmtTime, type Alert } from "@/lib/alerts";

type A = Pick<Alert, "status" | "volunteer_name"> & Partial<Pick<Alert, "created_at" | "accepted_at" | "arrived_at" | "visited_at">>;

/** Care flow: call + AI → neighbours alerted → on the way → arrived → visit done. */
export function AlertTimeline({ a }: { a: A }) {
  const human = a.status !== "closed";
  const st = a.status;
  const steps = human
    ? [
        { label: "Llamada e IA", done: true, t: a.created_at },
        { label: "Aviso a vecinos", done: true, t: a.created_at },
        { label: a.volunteer_name ? `${a.volunteer_name} va` : "En camino", done: ["accepted", "arrived", "visited"].includes(st), t: a.accepted_at },
        { label: "Ha llegado", done: st === "arrived" || st === "visited", t: a.arrived_at },
        { label: "Visita hecha", done: st === "visited", t: a.visited_at },
      ]
    : [
        { label: "Llamada", done: true, t: a.created_at },
        { label: "IA analiza", done: true, t: a.created_at },
        { label: "Familia avisada", done: true, t: a.created_at },
      ];
  const cur = steps.findIndex((s) => !s.done);
  return (
    <ol className={`mt-4 grid gap-1 ${human ? "grid-cols-5" : "grid-cols-3"}`} aria-label="Progreso del aviso">
      {steps.map((s, i) => (
        <li key={i} className="relative flex flex-col items-center gap-1 text-center">
          {i > 0 && <span className={`absolute top-3.5 right-1/2 -z-0 h-0.5 w-full ${s.done ? "bg-success" : "bg-muted"}`} />}
          <span className={`relative z-10 grid size-7 place-items-center rounded-full ${s.done ? "bg-success text-success-foreground" : i === cur ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"}`}>
            {s.done ? <Check className="size-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
          </span>
          <span className={`text-[0.65rem] leading-tight ${s.done || i === cur ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
          {s.done && s.t && i >= 2 && <span className="text-[0.6rem] text-muted-foreground">{fmtTime(s.t)}</span>}
        </li>
      ))}
    </ol>
  );
}
