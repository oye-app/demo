import { useAlerts } from "@/lib/alerts";
import { overallLabel, wellbeing } from "@/lib/wellbeing";

const BAR = { good: "bg-success", warn: "bg-warning", bad: "bg-destructive", unknown: "bg-muted" } as const;
const TXT = { good: "text-success", warn: "text-warning", bad: "text-destructive", unknown: "text-muted-foreground" } as const;

/** Quick wellbeing summary for one senior: overall % + 4 priority bars. */
export function WellbeingCard({ senior, seniorId, compact = false }: { senior: string; seniorId?: string | undefined; compact?: boolean }) {
  const { data = [] } = useAlerts();
  const { overall, items } = wellbeing(data, senior, seniorId);
  if (overall == null) return <p className="text-sm text-muted-foreground">Sin datos suficientes</p>;

  if (compact) {
    return (
      <section aria-label={`Resumen de bienestar de ${senior}`} className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold ${TXT[tone(overall)]}`}>{overall}%</span>
            <span className="text-xs font-bold text-muted-foreground">{overallLabel(overall)}</span>
          </p>
          <ul className="flex gap-3">
            {items.map((i) => (
              <li key={i.key} className="flex flex-col items-center gap-0.5" title={`${i.label}: ${i.hint}`}>
                <i.icon className={`size-4 ${TXT[i.tone]}`} />
                <span className={`text-xs font-extrabold ${TXT[i.tone]}`}>{i.pct == null ? "—" : `${i.pct}%`}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={`Resumen de bienestar de ${senior}`} className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground">Bienestar · 14 días</h2>
        <p className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-extrabold ${TXT[tone(overall)]}`}>{overall}%</span>
          <span className="text-xs font-bold text-muted-foreground">{overallLabel(overall)}</span>
        </p>
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-3">
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl bg-secondary ${TXT[i.tone]}`}>
              <i.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold">{i.label}</p>
                <p className={`text-sm font-extrabold ${TXT[i.tone]}`}>{i.pct == null ? "—" : `${i.pct}%`}</p>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${BAR[i.tone]}`} style={{ width: `${i.pct == null ? "—" : `${i.pct}%`}` }} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{i.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function tone(pct: number) {
  return pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad";
}
