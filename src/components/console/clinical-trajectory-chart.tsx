import { Brain, BookOpen, MessageSquareQuote, TrendingDown, TrendingUp } from "lucide-react";
import type { CallLogRow } from "@/lib/call-logs";
import { buildClinicalChartSeries, extractLifeStoryQuotes } from "@/lib/console";

export function ClinicalTrajectoryChart({
  seniorName,
  logs,
}: {
  seniorName: string;
  logs: CallLogRow[];
}) {
  const series = buildClinicalChartSeries(logs, 14);
  const quotes = extractLifeStoryQuotes(logs);

  if (series.points.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-xs text-muted-foreground">
        Sin suficientes llamadas completadas para generar la gráfica clínica longitudinal de <strong>{seniorName}</strong>.
      </div>
    );
  }

  const W = 640;
  const H = 200;
  const PAD_X = 34;
  const PAD_Y = 22;
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_Y * 2;

  const toX = (idx: number, len: number) =>
    len <= 1 ? PAD_X + plotW / 2 : PAD_X + (idx / (len - 1)) * plotW;
  const toY = (pct: number) => PAD_Y + (1 - Math.max(0, Math.min(100, pct)) / 100) * plotH;

  const globalPath = series.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i, series.points.length).toFixed(1)} ${toY(p.globalPct).toFixed(1)}`)
    .join(" ");

  const lexPoints = series.points
    .map((p, i) => (p.lexicalPct !== null ? { idx: i, val: p.lexicalPct } : null))
    .filter((v): v is { idx: number; val: number } => v !== null);

  const lexicalPath = lexPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.idx, series.points.length).toFixed(1)} ${toY(p.val).toFixed(1)}`)
    .join(" ");

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <Brain className="size-4 text-primary" />
              Curva Clínica Multi-Indicador (Últimas {series.points.length} llamadas)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Comparativa automática entre línea base personal y última llamada (Bienestar Global % y Biomarcador Léxico %).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-primary" /> Bienestar Global %
            </span>
            {lexPoints.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="h-2 w-4 rounded-full bg-amber-500" /> Riqueza Léxica %
              </span>
            )}
          </div>
        </div>

        {/* Baseline vs Latest Delta Tiles */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          <div className="rounded-2xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Línea base inicial</span>
            <span className="text-lg font-black">{series.baselineAvgPct ?? "—"}%</span>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Última llamada</span>
            <span className="text-lg font-black">{series.latestPct ?? "—"}%</span>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Variación vs base</span>
            <span
              className={`inline-flex items-center gap-1 text-lg font-black ${
                (series.deltaFromBaseline ?? 0) < -10
                  ? "text-destructive"
                  : (series.deltaFromBaseline ?? 0) >= 0
                  ? "text-success"
                  : "text-warning"
              }`}
            >
              {(series.deltaFromBaseline ?? 0) >= 0 ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
              {series.deltaFromBaseline !== null
                ? `${series.deltaFromBaseline >= 0 ? "+" : ""}${series.deltaFromBaseline} pts`
                : "—"}
            </span>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Biomarcador Léxico</span>
            <span className="text-lg font-black">
              {series.latestLexicalPct !== null ? `${series.latestLexicalPct}%` : "En espera audio"}
            </span>
          </div>
        </div>

        {/* Responsive Crisp SVG Multi-Series Chart */}
        <div className="overflow-x-auto rounded-2xl border bg-background/50 p-3">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-48 w-full min-w-[460px]"
            role="img"
            aria-label={`Evolución clínica de ${seniorName}`}
          >
            {[25, 50, 75, 100].map((grid) => {
              const y = toY(grid);
              return (
                <g key={grid}>
                  <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="currentColor" strokeOpacity={0.12} strokeDasharray="3 3" />
                  <text x={4} y={y + 3} fontSize="10" fill="currentColor" opacity={0.5}>
                    {grid}%
                  </text>
                </g>
              );
            })}

            <path d={globalPath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />

            {lexPoints.length > 1 && (
              <path
                d={lexicalPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
            )}

            {series.points.map((p, i) => {
              const cx = toX(i, series.points.length);
              const cy = toY(p.globalPct);
              const color =
                p.nivelAlerta === "ROJO" ? "#dc2626" : p.nivelAlerta === "AMARILLO" ? "#d97706" : "#16a34a";
              return (
                <g key={p.id}>
                  <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={1.8}>
                    <title>{`${p.fullDate}: ${p.globalPct}% (${p.nivelAlerta})`}</title>
                  </circle>
                  <text x={cx} y={H - 4} textAnchor="middle" fontSize="9.5" fill="currentColor" opacity={0.65}>
                    {p.dateLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Life Story & Verbatim Memory Capsule (TapestryAI / Famileo style) */}
      <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <BookOpen className="size-4 text-primary" />
            Cápsula de Historia de Vida & Frases Literales ({quotes.length})
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Recopilación automática de palabras literales y vivencias contadas por {seniorName} para reforzar continuidad emocional y compartir con su familia.
          </p>
        </div>

        {quotes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aún no hay frases textuales registradas en las llamadas completadas.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {quotes.slice(0, 6).map((q) => (
              <blockquote key={q.id} className="rounded-2xl border bg-secondary/35 p-3.5 text-xs space-y-1.5">
                <p className="flex items-start gap-1.5 font-semibold italic text-foreground">
                  <MessageSquareQuote className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>«{q.quote}»</span>
                </p>
                <p className="text-[10px] font-bold text-muted-foreground">
                  {q.dateLabel} · Nivel {q.alertLevel}
                </p>
              </blockquote>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
