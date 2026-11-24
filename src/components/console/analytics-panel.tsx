import { Activity, AlertTriangle, Clock, Download, FileCheck2, MapPin, Pill, Printer, ShieldCheck, TrendingUp } from "lucide-react";
import { B2BModeSelector } from "@/components/b2b-meeting-panel";
import {
  buildConsoleCsvExport,
  computeCohortUnitEconomics,
  computeDistrictCoverage,
  type ConsoleCensusRow,
  type ConsoleCohortSummary,
  type ConsoleQaMetrics,
  type ConsoleVolunteerRow,
} from "@/lib/console";

export function AnalyticsPanel({
  census,
  volunteers,
  summary,
  qaMetrics = null,
}: {
  census: ConsoleCensusRow[];
  volunteers: ConsoleVolunteerRow[];
  summary: ConsoleCohortSummary | null;
  qaMetrics?: ConsoleQaMetrics | null;
}) {
  const coverage = computeDistrictCoverage(census, volunteers);
  const economics = computeCohortUnitEconomics(summary, census.length);
  const medRatePct =
    summary && summary.med_evaluated_30d > 0
      ? Math.round((summary.med_confirmed_30d / summary.med_evaluated_30d) * 100)
      : null;

  function handleExportCsv() {
    const csv = buildConsoleCsvExport(census);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oye-informe-cohorte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground">Impacto Clínico, Cobertura Territorial & ROI B2B</h2>
          <p className="text-xs text-muted-foreground">
            Métricas en tiempo real calculadas sobre llamadas reales (`call_logs`), escalas UCLA-3 / Yesavage GDS-5 y despacho vecinal (30 días).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <B2BModeSelector />
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3.5 py-2 text-xs font-bold hover:bg-secondary"
          >
            <Printer className="size-4 text-muted-foreground" />
            Imprimir Memoria Ejecutiva A4
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={census.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="size-4" />
            Exportar Informe Clínico (CSV)
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="size-4 text-success" /> Filtro Silencioso IA (30d)
          </span>
          <p className="mt-2 text-3xl font-black text-foreground">
            {summary?.filter_green_pct !== null && summary?.filter_green_pct !== undefined
              ? `${summary.filter_green_pct}%`
              : "—"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary?.green_calls_30d ?? 0} de {summary?.calls_30d ?? 0} llamadas en VERDE · ~{economics.savedHumanHours} h de centralita ahorradas
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Activity className="size-4 text-primary" /> Escalas Científicas (30d)
          </span>
          <p className="mt-2 text-3xl font-black text-foreground">
            {summary?.avg_global_pct_30d !== null && summary?.avg_global_pct_30d !== undefined
              ? `${summary.avg_global_pct_30d}%`
              : "—"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            UCLA-3 medio: {summary?.avg_ucla_30d ?? "—"}/6 · Yesavage GDS-5: {summary?.avg_yesavage_30d ?? "—"}/5
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Pill className="size-4 text-primary" /> Adherencia Terapéutica
          </span>
          <p className="mt-2 text-3xl font-black text-foreground">
            {medRatePct !== null ? `${medRatePct}%` : "—"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary?.med_confirmed_30d ?? 0} confirmadas de {summary?.med_evaluated_30d ?? 0} evaluaciones de medicación
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Clock className="size-4 text-warning" /> SLA Respuesta & Deterioro
          </span>
          <p className="mt-2 text-3xl font-black text-foreground">
            {summary?.avg_dispatch_min !== null && summary?.avg_dispatch_min !== undefined
              ? `${summary.avg_dispatch_min} min`
              : "—"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tiempo medio asignación · {summary?.silent_deterioration_count ?? 0} alertas de deterioro silencioso
          </p>
        </div>
      </div>

      {/* Two-column Bottom: Territorial Coverage Gaps + Unit Economics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
                <MapPin className="size-4 text-primary" />
                Radar de Cobertura Territorial por Barrio
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Detecta barrios descubiertos antes de aceptar altas nuevas o cerrar convenios municipales.
              </p>
            </div>
          </div>

          {coverage.length === 0 ? (
            <p className="py-4 text-xs text-muted-foreground">Sin datos territoriales todavía.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/70 text-[11px] font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Barrio</th>
                    <th className="px-3 py-2">Mayores</th>
                    <th className="px-3 py-2">Con alerta</th>
                    <th className="px-3 py-2">Voluntarios</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coverage.map((c) => (
                    <tr key={c.neighborhood}>
                      <td className="px-3 py-2 font-bold">{c.neighborhood}</td>
                      <td className="px-3 py-2">{c.seniorsCount}</td>
                      <td className="px-3 py-2">{c.urgentCount}</td>
                      <td className="px-3 py-2">{c.volunteersAvailable}</td>
                      <td className="px-3 py-2">
                        {c.coverageGap ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            <AlertTriangle className="size-3" /> {c.ratioLabel}
                          </span>
                        ) : (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                            Cubierto · {c.ratioLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <TrendingUp className="size-4 text-primary" />
              Proyección Economía Unitaria ({economics.seniors} {economics.seniors === 1 ? "mayor activo" : "mayores activos"})
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Comparativa mensual de ingresos B2B (ref. 0,46 €/día = 13,80 €/mes) frente a escenarios de arquitectura telefónica del benchmark.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border bg-primary/5 px-3 py-2">
              <span className="font-bold text-primary">Ingreso bruto piloto B2B (13,80 €/mes × {economics.seniors})</span>
              <span className="text-sm font-black text-primary">{economics.monthlyB2bRevEur.toFixed(2)} €/mes</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span className="text-muted-foreground">Modo actual sin EEA (Twilio intl + ElevenLabs, ~18,75 €)</span>
              <span className="font-bold text-destructive">{economics.unoptimizedCostMidEur.toFixed(2)} €/mes</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <span className="text-muted-foreground">Fase Piloto optimizada (EEA / Fijo + duración 90s, ~8,50 €)</span>
              <span className="font-bold text-foreground">{economics.optimizedMonthlyCostMidEur.toFixed(2)} €/mes</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-3 py-2">
              <span className="font-semibold text-success">Escala SIP directa + motor voz propio (~4,55 €/mes)</span>
              <span className="font-black text-success">{economics.scaleMonthlyCostMidEur.toFixed(2)} €/mes</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Nota operativa: al activar llamada adaptativa de ~90 s cuando un mayor acumula 3+ días consecutivos en VERDE (`call_mode_hint`), el consumo de minutos baja automáticamente sin reducir la sensación de cercanía. Las cifras económicas son modelos de referencia del benchmark.
          </p>
        </section>
      </div>

      {/* Clinical Veracity & Human QA Audit Card */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <FileCheck2 className="size-4 text-primary" />
              Auditoría de Veracidad Clínica & Control de Calidad Humano (QA)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Trazabilidad real de motores de análisis (`GPT-4o + Citas Verificadas` vs `Reglas Deterministas`), exclusión de simulaciones y tasa de precisión validada en `/consola`.
            </p>
          </div>
          {qaMetrics && qaMetrics.llm_calls_count === 0 && qaMetrics.total_live_calls > 0 && (
            <span className="rounded-full bg-warning/20 px-3 py-1 text-[11px] font-bold text-foreground">
              `OPENAI_API_KEY` no activa aún en Supabase Secrets (usando motor determinista)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Llamadas Reales vs Simuladas</span>
            <span className="text-lg font-black">
              {qaMetrics?.total_live_calls ?? 0} reales · {qaMetrics?.simulated_count ?? 0} sim
            </span>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Motor GPT-4o Verificado</span>
            <span className="text-lg font-black text-primary">
              {qaMetrics?.llm_calls_count ?? 0} LLM · {qaMetrics?.deterministic_count ?? 0} reglas
            </span>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Tasa Precisión QA Humana</span>
            <span className="text-lg font-black text-success">
              {qaMetrics?.precision_pct !== null && qaMetrics?.precision_pct !== undefined
                ? `${qaMetrics.precision_pct}%`
                : "Sin auditar aún"}
            </span>
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <span className="block text-[10px] font-semibold text-muted-foreground">Incidencias QA Reportadas</span>
            <span className="text-lg font-black">
              {qaMetrics ? `${qaMetrics.false_positive_count} FP · ${qaMetrics.false_negative_count} FN` : "0 FP · 0 FN"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
