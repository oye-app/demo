import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  FileCode2,
  Lock,
  MoonStar,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { LivePipelineTester } from "@/components/console/live-pipeline-tester";
import { CohortRoiSimulator } from "@/components/enterprise/cohort-roi-simulator";
import {
  COMPETITOR_BENCHMARK_MATRIX,
  PILOT_BLUEPRINT_PHASES,
  buildEnterpriseSampleFhirBundle,
} from "@/lib/enterprise-demo";

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    badge: "analyze-call · GPT-4o",
    title: "Cero alucinaciones clínicas verificadas",
    description:
      "Cada cita textual y recuerdo biográfico extraído se verifica contra el texto literal de la llamada. Guardia clínico ante negaciones para evitar falsos ROJO.",
  },
  {
    icon: Zap,
    badge: "mid-call-alert · < 300 ms",
    title: "Escalado en vivo antes de colgar",
    description:
      "Si el mayor expresa caída, ahogo o dolor torácico durante la llamada, la herramienta registra el incidente al instante y guía a la IA en contención.",
  },
  {
    icon: MoonStar,
    badge: "inbound + sla-watchdog",
    title: "Entrante 24/7 + Horario Silencio Madrid",
    description:
      "Si el mayor llama en cualquier momento, OYE lo reconoce por Caller ID. Además, bloquea reintentos automáticos entre 22:00 y 07:59 (Europe/Madrid).",
  },
  {
    icon: FileCode2,
    badge: "HL7 FHIR R4 + HMAC-SHA256",
    title: "Interoperabilidad EHR y seguridad bancaria",
    description:
      "Bundles FHIR R4 con códigos LOINC (106418-7 UCLA-3 y 48545-8 GDS-5), webhooks firmados HMAC-SHA256 y protección anti-SSRF.",
  },
];

const SECURITY_CONTROLS = [
  "Aislamiento Multi-Tenant con PostgreSQL Row Level Security (is_console_operator)",
  "Bloqueo anti-SSRF en webhooks salientes (rechazo IPv4/IPv6 privadas, loopback y CGNAT)",
  "Separación estricta entre simulaciones de Sandbox (test-only / dry_run) y expedientes reales",
  "5 biomarcadores acústico-temporales longitudinales por voz telefónica sin hardware en casa",
];

export function EnterprisePortal() {
  const [copiedFhir, setCopiedFhir] = useState(false);

  const sampleFhir = useMemo(() => buildEnterpriseSampleFhirBundle(), []);
  const formattedFhirJson = useMemo(() => JSON.stringify(sampleFhir, null, 2), [sampleFhir]);

  function copySampleFhir() {
    void navigator.clipboard.writeText(formattedFhirJson).then(() => {
      setCopiedFhir(true);
      setTimeout(() => setCopiedFhir(false), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-[1380px] space-y-10 px-4 py-8 md:px-8">
      {/* Executive Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-sm md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_420px] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                <Building2 className="size-3.5" />
                OYE Enterprise · Aseguradoras · Teleasistencia · AAPP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="size-3.5" />0 € Hardware · Compatible Fijo Analógico
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-[42px] lg:leading-[1.12]">
              Acompañamiento clínico diario por voz IA y despacho vecinal verificable para toda tu cohorte senior
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              OYE llama cada día desde voz telefónica natural —sin tablets, relojes ni micrófonos en el dormitorio— filtra automáticamente en verde las llamadas estables, extrae biomarcadores vocales longitudinales y eleva únicamente casos críticos y preventivos a una Torre de Control SLA con cierre humano.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/consola"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Sparkles className="size-4" />
                Abrir Consola Operativa en Vivo
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#sandbox-clinico"
                className="inline-flex items-center gap-2 rounded-2xl border bg-background px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              >
                <Activity className="size-4 text-primary" />
                Probar Sandbox Clínico GPT-4o
              </a>
              <a
                href="#simulador-roi"
                className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-primary hover:underline"
              >
                Simular ahorro en cohorte ↓
              </a>
            </div>
          </div>

          {/* Technical Verification Quick Card */}
          <aside className="rounded-2xl border border-primary/20 bg-secondary/35 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                Ficha Técnica Verificada
              </span>
              <span className="rounded-full bg-card px-2.5 py-0.5 text-[10px] font-bold text-foreground border">
                Arquitectura Activa
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border bg-card p-3">
                <dt className="text-[11px] font-semibold text-muted-foreground">Hardware en casa</dt>
                <dd className="mt-0.5 text-lg font-black text-foreground">0 €</dd>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <dt className="text-[11px] font-semibold text-muted-foreground">Escalado urgente</dt>
                <dd className="mt-0.5 text-lg font-black text-primary">&lt; 300 ms</dd>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <dt className="text-[11px] font-semibold text-muted-foreground">Horario silencio</dt>
                <dd className="mt-0.5 text-lg font-black text-foreground">22–08 h</dd>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <dt className="text-[11px] font-semibold text-muted-foreground">Estándar clínico</dt>
                <dd className="mt-0.5 text-lg font-black text-foreground">FHIR R4</dd>
              </div>
            </dl>

            <div className="rounded-xl border bg-card p-3 text-[11px] text-muted-foreground space-y-1.5">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <PhoneCall className="size-3.5 text-primary" />
                Acceso inmediato para equipos evaluadores
              </p>
              <p>
                Entra en <strong>/consola</strong> y pulsa <em>&ldquo;Entrar como Coordinación ONG (Ana Torres)&rdquo;</em> para auditar triaje SLA, despacho vecinal y FHIR R4 en tiempo real.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* 4 Engineering & Clinical Trust Pillars */}
      <section aria-label="Pilares técnicos de confianza" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article key={pillar.title} className="rounded-2xl border bg-card p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                  {pillar.badge}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-foreground">{pillar.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{pillar.description}</p>
            </article>
          );
        })}
      </section>

      {/* Interactive ROI & Cohort Economics Simulator */}
      <CohortRoiSimulator />

      {/* Live Clinical Sandbox + Structural HL7 FHIR R4 Preview */}
      <section
        id="sandbox-clinico"
        aria-labelledby="sandbox-heading"
        className="rounded-3xl border bg-card p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[11px] font-extrabold text-indigo-800">
              <ShieldAlert className="size-3.5" />
              Auditoría Técnica Directa sin Registro
            </span>
            <h2 id="sandbox-heading" className="text-2xl font-black tracking-tight text-foreground">
              Prueba el motor clínico GPT-4o en vivo e inspecciona nuestro Bundle HL7 FHIR R4
            </h2>
            <p className="text-xs text-muted-foreground">
              Edita cualquier transcripción o usa los casos de negación clínica y deterioro oculto para comprobar en tiempo real la extracción de biomarcadores y citas verificadas.
            </p>
          </div>
          <a
            href="/consola"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/8 px-3.5 py-2 text-xs font-extrabold text-primary hover:bg-primary/15"
          >
            Abrir Consola Completa →
          </a>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <LivePipelineTester publicSafe seniorName="Carmen" />

          {/* Structural FHIR + Security Guardrails */}
          <div className="flex flex-col justify-between rounded-2xl border bg-secondary/20 p-4 space-y-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Code2 className="size-4 text-primary" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Bundle HL7 FHIR R4 (Ejemplo Estructural)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={copySampleFhir}
                  className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-secondary cursor-pointer"
                >
                  {copiedFhir ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  {copiedFhir ? "JSON copiado" : "Copiar JSON"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Incluye observaciones codificadas <code>LOINC 106418-7</code> (UCLA-3) y <code>48545-8</code> (GDS-5) listas para historia clínica electrónica o webhook HMAC.
              </p>
              <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">
                {formattedFhirJson}
              </pre>
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                <Lock className="size-3.5 text-primary" />
                Controles CISO / RGPD en Producción
              </p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                {SECURITY_CONTROLS.map((ctrl) => (
                  <li key={ctrl} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                    <span>{ctrl}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Matrix */}
      <section
        id="comparativa"
        aria-labelledby="comparativa-heading"
        className="rounded-3xl border bg-card p-6 shadow-sm space-y-4"
      >
        <div className="space-y-1 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold text-primary">
            Comparativa de Mercado 2026
          </span>
          <h2 id="comparativa-heading" className="text-2xl font-black tracking-tight text-foreground">
            Por qué OYE supera a teleasistencia clásica, wearables, tablets y monitorización pasiva
          </h2>
          <p className="text-xs text-muted-foreground">
            Combinación única: accesibilidad telefónica 100% universal (0 € hardware), IA conversacional auditable con biomarcadores, escalado urgente en milisegundos y cierre humano vecinal con SLA.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[860px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b bg-secondary/45">
                <th className="p-3.5 font-extrabold text-foreground">Criterio Crítico B2B</th>
                <th className="bg-primary/10 p-3.5 font-black text-primary">OYE Platform</th>
                <th className="p-3.5 font-bold text-muted-foreground">Tucuvi</th>
                <th className="p-3.5 font-bold text-muted-foreground">ElliQ</th>
                <th className="p-3.5 font-bold text-muted-foreground">Sensi.ai</th>
                <th className="p-3.5 font-bold text-muted-foreground">Durcal</th>
                <th className="p-3.5 font-bold text-muted-foreground">Telecross</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {COMPETITOR_BENCHMARK_MATRIX.map((row) => (
                <tr key={row.criterion} className="hover:bg-secondary/20">
                  <td className="p-3.5 font-bold text-foreground">{row.criterion}</td>
                  <td className="bg-primary/6 p-3.5 font-extrabold text-primary">{row.oye}</td>
                  <td className="p-3.5 text-muted-foreground">{row.tucuvi}</td>
                  <td className="p-3.5 text-muted-foreground">{row.elliq}</td>
                  <td className="p-3.5 text-muted-foreground">{row.sensi}</td>
                  <td className="p-3.5 text-muted-foreground">{row.durcal}</td>
                  <td className="p-3.5 text-muted-foreground">{row.telecross}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 30-Day Pilot Blueprint */}
      <section
        id="piloto-30d"
        aria-labelledby="piloto-heading"
        className="rounded-3xl border bg-card p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-extrabold text-foreground">
              <CalendarCheck2 className="size-3.5 text-primary" />
              Despliegue Controlado en 4 Semanas
            </span>
            <h2 id="piloto-heading" className="text-2xl font-black tracking-tight text-foreground">
              Hoja de ruta estándar para piloto corporativo o municipal de 30 días
            </h2>
          </div>

          <a
            href="/consola"
            className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-xs font-extrabold text-background hover:opacity-90"
          >
            Evaluar Consola Desktop ahora
            <ArrowRight className="size-4" />
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILOT_BLUEPRINT_PHASES.map((phase) => (
            <div key={phase.week} className="rounded-2xl border bg-background p-4 space-y-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                  {phase.week}
                </span>
                <h3 className="mt-0.5 text-sm font-black text-foreground">{phase.title}</h3>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {phase.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
