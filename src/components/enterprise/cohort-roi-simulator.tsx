import { useMemo, useState } from "react";
import { Calculator, Check, Copy, Download, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import {
  BASELINE_BENCHMARKS,
  ENTERPRISE_PRESETS,
  buildEnterpriseProposalMarkdown,
  simulateEnterpriseCohort,
  type BaselineBenchmarkKey,
  type EnterprisePreset,
} from "@/lib/enterprise-demo";

export function CohortRoiSimulator() {
  const [activePresetId, setActivePresetId] = useState<EnterprisePreset["id"]>("aseguradora");
  const [seniors, setSeniors] = useState<number>(2500);
  const [eeaSharePct, setEeaSharePct] = useState<number>(90);
  const [greenFilterRatePct, setGreenFilterRatePct] = useState<number>(85);
  const [baselineKey, setBaselineKey] = useState<BaselineBenchmarkKey>("telecare_es");
  const [orgName, setOrgName] = useState<string>("Organización Evaluadora");
  const [copiedProposal, setCopiedProposal] = useState(false);

  const activePreset =
    ENTERPRISE_PRESETS.find((p) => p.id === activePresetId) ?? ENTERPRISE_PRESETS[0]!;

  const sim = useMemo(
    () =>
      simulateEnterpriseCohort({
        seniors,
        eeaSharePct,
        greenFilterRatePct,
        baselineKey,
      }),
    [seniors, eeaSharePct, greenFilterRatePct, baselineKey]
  );

  function applyPreset(preset: EnterprisePreset) {
    setActivePresetId(preset.id);
    setSeniors(preset.seniors);
    setEeaSharePct(preset.eeaSharePct);
    setGreenFilterRatePct(preset.greenFilterRatePct);
    setBaselineKey(preset.baselineKey);
  }

  function handleCopyProposal() {
    const md = buildEnterpriseProposalMarkdown(sim, activePreset.label, orgName.trim() || "Entidad");
    void navigator.clipboard.writeText(md).then(() => {
      setCopiedProposal(true);
      setTimeout(() => setCopiedProposal(false), 2200);
    });
  }

  function handleDownloadProposal() {
    const md = buildEnterpriseProposalMarkdown(sim, activePreset.label, orgName.trim() || "Entidad");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oye-propuesta-piloto-${sim.seniors}-mayores.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      id="simulador-roi"
      aria-labelledby="roi-heading"
      className="rounded-3xl border bg-card p-6 shadow-sm space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
            <Calculator className="size-3.5" />
            Simulador Económico & Operativo de Cohorte
          </div>
          <h2 id="roi-heading" className="text-2xl font-black tracking-tight text-foreground">
            Calcula el ahorro mensual, la carga humana liberada y el tramo SIP en vivo
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Modelado paramétrico construido sobre los costes unitarios reales de OYE (Opt B estándar y Opt C escala ≥ 2.500 mayores).
            Las cifras de este bloque son una proyección parametrizable para presupuesto de piloto, separada de los datos de pacientes en Consola.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
          <ShieldCheck className="size-3.5" />
          Modelo Paramétrico Transparente
        </span>
      </div>

      {/* Buyer Presets */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {ENTERPRISE_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id && seniors === preset.seniors;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                isActive
                  ? "border-primary bg-primary/6 ring-1 ring-primary/30 shadow-xs"
                  : "bg-background hover:bg-secondary/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                  {preset.seniors.toLocaleString("es-ES")} mayores
                </span>
                <Users className="size-3.5 text-muted-foreground" />
              </div>
              <p className="mt-1 text-xs font-extrabold text-foreground">{preset.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{preset.summary}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[410px_1fr]">
        {/* Controls Column */}
        <div className="rounded-2xl border bg-secondary/25 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-foreground">
            <SlidersHorizontal className="size-4 text-primary" />
            Parámetros de tu organización
          </div>

          <label className="block space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span>Mayores en seguimiento diario</span>
              <span className="font-black text-primary tabular-nums">
                {sim.seniors.toLocaleString("es-ES")} personas
              </span>
            </div>
            <input
              type="range"
              aria-label="Número de mayores en seguimiento"
              min={100}
              max={50000}
              step={100}
              value={seniors}
              onChange={(e) => setSeniors(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>100</span>
              <span>2.500 (salto SIP Opt C)</span>
              <span>50.000</span>
            </div>
          </label>

          <label className="block space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span>Líneas en España / EEE</span>
              <span className="font-black tabular-nums">{sim.eeaSharePct}%</span>
            </div>
            <input
              type="range"
              aria-label="Porcentaje de líneas España y Espacio Económico Europeo"
              min={40}
              max={100}
              step={2}
              value={eeaSharePct}
              onChange={(e) => setEeaSharePct(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </label>

          <label className="block space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span>Filtro Verde IA automatizado</span>
              <span className="font-black text-success tabular-nums">{sim.greenFilterRatePct}%</span>
            </div>
            <input
              type="range"
              aria-label="Porcentaje de llamadas resueltas automáticamente en verde"
              min={70}
              max={92}
              step={1}
              value={greenFilterRatePct}
              onChange={(e) => setGreenFilterRatePct(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </label>

          <div className="space-y-1.5 text-xs">
            <span className="block font-bold">Comparar ahorro frente a:</span>
            <div className="grid gap-1.5">
              {(Object.keys(BASELINE_BENCHMARKS) as BaselineBenchmarkKey[]).map((key) => {
                const b = BASELINE_BENCHMARKS[key];
                const selected = baselineKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBaselineKey(key)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"
                    }`}
                  >
                    <span>{b.label}</span>
                    <span className="tabular-nums">{b.monthlyEurPerSenior.toFixed(2)} €</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="font-bold text-muted-foreground">Nombre entidad para dossier descargable</span>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ej. Ayuntamiento de Chamberí / Sanitas"
              className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
            />
          </label>
        </div>

        {/* Outputs Column */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-background p-4 space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground">Coste Infra OYE / Mayor</p>
              <p className="text-2xl font-black text-primary tabular-nums">
                {sim.costPerSeniorEur.toFixed(2)} €
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground">{sim.tierLabel}</p>
            </div>

            <div className="rounded-2xl border bg-background p-4 space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground">Inversión Total Mensual</p>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {sim.monthlyOyeCostEur.toLocaleString("es-ES")} €
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {sim.annualOyeCostEur.toLocaleString("es-ES")} €/año cohorte
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
              <p className="text-[11px] font-bold text-emerald-900">Ahorro Neto Estimado</p>
              <p className="text-2xl font-black text-emerald-700 tabular-nums">
                -{sim.savingsPct}%
              </p>
              <p className="text-[10px] font-bold text-emerald-800 tabular-nums">
                {sim.annualSavingsEur.toLocaleString("es-ES")} €/año vs ref.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-4 space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground">Capacidad Humana Liberada</p>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {sim.monthlyHumanHoursSaved.toLocaleString("es-ES")} h
              </p>
              <p className="text-[10px] font-semibold text-primary tabular-nums">
                ~{sim.fteEquivalentFreed} jornadas FTE/mes
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-background p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-foreground">
                Distribución diaria del Triaje IA ({sim.dailyCallsTotal.toLocaleString("es-ES")} llamadas/día)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Valor tiempo clínico redirigido: ~{sim.monthlyHumanValueSavedEur.toLocaleString("es-ES")} €/mes
              </span>
            </div>

            <div className="h-3.5 w-full overflow-hidden rounded-full bg-secondary flex">
              <div
                style={{ width: `${sim.greenFilterRatePct}%` }}
                className="bg-success transition-all"
                title={`Filtro Verde IA: ${sim.greenFilterRatePct}%`}
              />
              <div
                style={{ width: `${100 - sim.greenFilterRatePct}%` }}
                className="bg-amber-500 transition-all"
                title={`Casos prioritarios para coordinación humana: ${100 - sim.greenFilterRatePct}%`}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded-xl bg-success/10 px-3 py-2 text-success font-bold">
                {sim.dailyAutoResolvedGreen.toLocaleString("es-ES")} llamadas/día cerradas en VERDE por IA
                <span className="block text-[10px] font-normal text-foreground/75">
                  Resumen automático a familia + serie UCLA-3/GDS-5 guardada sin tocar carga humana.
                </span>
              </div>
              <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 font-bold">
                {sim.dailyHumanPriorityCases.toLocaleString("es-ES")} alertas/día escaladas a Torre de Control SLA
                <span className="block text-[10px] font-normal text-foreground/75">
                  Priorizadas con reloj 30/60m, radar de riesgo, despacho vecinal y recurso de barrio.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Exporta esta estimación lista para dirección financiera, comité médico o licitación pública.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyProposal}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer"
              >
                {copiedProposal ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copiedProposal ? "Propuesta copiada" : "Copiar propuesta (.md)"}
              </button>
              <button
                type="button"
                onClick={handleDownloadProposal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Download className="size-3.5" />
                Descargar Dossier Piloto
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
