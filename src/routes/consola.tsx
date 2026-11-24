import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  ClipboardEdit,
  Clock,
  Compass,
  Download,
  FileSpreadsheet,
  HandHeart,
  KeyRound,
  LogOut,
  MapPin,
  PauseCircle,
  Phone,
  PhoneCall,
  Pill,
  PlayCircle,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { OyeLogo } from "@/components/oye";
import { PersonAvatar } from "@/components/person-avatar";
import { SituationReportCard } from "@/components/situation-report";
import { FamilyWeeklyDigest } from "@/components/family-weekly-digest";
import { B2BModeSelector } from "@/components/b2b-meeting-panel";
import { DispatchPanel } from "@/components/console/dispatch-panel";
import { BatchImportModal } from "@/components/console/batch-import-modal";
import { AnalyticsPanel } from "@/components/console/analytics-panel";
import { SeniorEditModal } from "@/components/console/senior-edit-modal";
import { ClinicalTrajectoryChart } from "@/components/console/clinical-trajectory-chart";
import { DossierTimelinePanel } from "@/components/console/dossier-timeline";
import { DailyAgendaPanel } from "@/components/console/daily-agenda-panel";
import { FhirViewerCard } from "@/components/console/fhir-viewer-card";
import { meQuery } from "@/lib/auth";
import { demoAccess } from "@/lib/demo.functions";
import { useAllCallLogs } from "@/lib/call-logs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import {
  buildConsoleCsvExport,
  classifyUrgencyTier,
  computeDistrictCoverage,
  computeSlaStatus,
  computeTodayScheduleCoverage,
  useCommunityResources,
  useConsoleCensus,
  useConsoleCohortSummary,
  useConsoleRealtimeSync,
  useConsoleVolunteers,
  useIsConsoleOperator,
  type ConsoleCensusRow,
  type ConsoleVolunteerRow,
  type UrgencyTier,
} from "@/lib/console";

export const Route = createFileRoute("/consola")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Consola de Coordinación ONG & B2B · OYE" },
      {
        name: "description",
        content:
          "Centro de mando desktop para ONG, teleasistencia y aseguradoras: acceso directo, triaje por semáforo, biomarcadores, FHIR R4 y despacho vecinal.",
      },
    ],
  }),
  component: ConsoleRoute,
});

type ConsoleTab = "triaje" | "agenda" | "censo" | "voluntarios" | "impacto";
type DetailTab = "resumen" | "curva" | "bitacora";

function ConsoleRoute() {
  const qc = useQueryClient();
  const { data: me, isPending: loadingMe } = useQuery(meQuery);
  const demo = useServerFn(demoAccess);
  const [switchingDemo, setSwitchingDemo] = useState(false);

  async function enterOngDemo() {
    setSwitchingDemo(true);
    try {
      const creds = await demo({ data: { persona: "ong" } }).catch(() => ({
        email: "ong@demo.oye.app",
        password: "oye-demo-2026",
      }));
      const res = await supabase.auth.signInWithPassword(creds);
      if (res.error) throw res.error;
      await qc.invalidateQueries();
      toast.success("Sesión iniciada en Consola ONG (Ana Torres)");
    } catch {
      toast.error("No se pudo abrir la demo ONG. Inténtalo de nuevo.");
    } finally {
      setSwitchingDemo(false);
    }
  }

  if (loadingMe) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-sm font-semibold text-muted-foreground">Cargando Consola de Coordinación…</p>
      </div>
    );
  }

  if (!me?.user) {
    return <ConsoleSignInScreen busyDemo={switchingDemo} onDemoOng={() => void enterOngDemo()} />;
  }

  return (
    <ConsoleWorkspace
      user={{ id: me.user.id, email: me.user.email }}
      profile={me.profile}
      busyDemo={switchingDemo}
      onDemoOng={() => void enterOngDemo()}
    />
  );
}

function ConsoleSignInScreen({
  busyDemo,
  onDemoOng,
}: {
  busyDemo: boolean;
  onDemoOng: () => void;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/consola` },
          });
    setBusy(false);
    if (res.error) {
      setMsg({
        ok: false,
        text: mode === "in" ? "Correo o contraseña incorrectos." : "No se pudo crear la cuenta.",
      });
      return;
    }
    if (mode === "up" && !res.data.session) {
      setMsg({
        ok: true,
        text: "Hemos enviado un correo de confirmación. Ábrelo y recarga /consola.",
      });
      return;
    }
    await qc.invalidateQueries();
  }

  async function socialGoogle() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/consola`,
    });
    if (r.error) setMsg({ ok: false, text: "No se pudo iniciar con Google." });
  }

  return (
    <div className="min-h-dvh bg-secondary/35 text-foreground flex flex-col">
      <header className="border-b bg-card px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-primary">
              <OyeLogo />
            </span>
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary sm:inline-block">
              Consola Web ONG · Teleasistencia · Aseguradoras
            </span>
          </div>
          <Link
            to="/bienvenida"
            className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-bold hover:bg-secondary"
          >
            <Smartphone className="size-3.5" /> App Móvil Familia / Voluntario
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 py-10 lg:grid-cols-[1.15fr_430px]">
        {/* Enterprise Pitch Column */}
        <section className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
              <Building2 className="size-3.5" />
              Centro de Mando Desktop 360°
            </span>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Controla cientos de mayores en un solo panel clínico y vecinal
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Diseñado para coordinadoras de ONG, ayuntamientos, operadores de teleasistencia y equipos médicos de aseguradoras: filtra automáticamente los días verdes, prioriza los casos críticos con reloj SLA y despacha voluntarios en un clic.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [
                ShieldCheck,
                "Filtro Silencioso + Triaje SLA",
                "Separa el ~85% de llamadas verdes para centrar tus horas humanas en alertas ROJO, AMARILLO y «No contesta».",
              ],
              [
                Activity,
                "Escalas UCLA-3, GDS-5 y Biomarcadores",
                "Gráfica longitudinal por mayor con riqueza léxica, latencia vocal y alertas de deterioro silencioso.",
              ],
              [
                HandHeart,
                "Despacho Inteligente & Radar Barrio",
                "Ranking automático de voluntarios libres cercanos y detección de barrios descubiertos.",
              ],
              [
                Compass,
                "FHIR R4, CSV Masivo y Prescripción Social",
                "Importa 500 mayores desde Excel, prescribe recursos de barrio y exporta Bundles HL7 FHIR R4.",
              ],
            ].map(([Icon, title, desc]) => {
              const IconComp = Icon as typeof ShieldCheck;
              return (
                <div key={title as string} className="rounded-2xl border bg-card p-4 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-primary">
                    <IconComp className="size-4 shrink-0" />
                    <span>{title as string}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Auth Card */}
        <section className="rounded-3xl border bg-card p-6 shadow-xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">Acceso a Consola de Coordinación</h2>
            <p className="text-xs text-muted-foreground">
              Entra con tu cuenta corporativa/ONG o abre el entorno demo en 1 clic.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-primary flex items-center gap-1.5">
                <Sparkles className="size-4" /> Acceso directo Demo Comercial
              </span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                Sin registro
              </span>
            </div>
            <button
              type="button"
              disabled={busyDemo}
              onClick={onDemoOng}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {busyDemo ? "Abriendo consola ONG…" : "Entrar como Coordinación ONG (Ana Torres)"}
            </button>
          </div>

          <div className="relative py-1 text-center text-[11px] font-semibold text-muted-foreground">
            <span className="bg-card px-2">o con tu cuenta de organización</span>
          </div>

          <button
            type="button"
            onClick={() => void socialGoogle()}
            className="w-full rounded-xl border bg-background py-2.5 text-xs font-bold text-foreground hover:bg-secondary"
          >
            Continuar con Google Workspace
          </button>

          <form onSubmit={(e) => void submit(e)} className="space-y-3 text-xs">
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Correo corporativo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinacion@entidad.org"
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full rounded-xl border bg-background px-3 text-xs"
              />
            </label>

            {msg && (
              <p
                role="alert"
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  msg.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}
              >
                {msg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-foreground py-2.5 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Verificando…" : mode === "in" ? "Iniciar sesión en Consola" : "Solicitar alta de cuenta"}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="font-bold text-primary hover:underline"
            >
              {mode === "in" ? "¿Nueva entidad? Crear cuenta" : "Ya tengo cuenta"}
            </button>
            <Link to="/admin" className="font-semibold text-muted-foreground hover:text-foreground">
              Acceso Admin Legacy
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ConsoleWorkspace({
  user,
  profile,
  busyDemo,
  onDemoOng,
}: {
  user: { id: string; email: string };
  profile: { full_name: string; persona: string } | null;
  busyDemo: boolean;
  onDemoOng: () => void;
}) {
  const qc = useQueryClient();
  const { data: isOperator, isPending: checkingAccess } = useIsConsoleOperator();
  const { data: census = [], isPending: loadingCensus } = useConsoleCensus(!!isOperator);
  const { data: volunteers = [] } = useConsoleVolunteers(!!isOperator);
  const { data: summary = null } = useConsoleCohortSummary(!!isOperator);
  const { data: org } = useQuery({
    queryKey: ["console", "org"],
    enabled: !!isOperator,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, neighborhood, sector")
        .order("legacy_id", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useConsoleRealtimeSync(!!isOperator);

  const [tab, setTab] = useState<ConsoleTab>("triaje");
  const [selectedId, setSelectedId] = useState<string>("");
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (census.length === 0) return;
    if (!selectedId || !census.some((r) => r.senior_id === selectedId)) {
      setSelectedId(census[0]!.senior_id);
    }
  }, [census, selectedId]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await qc.invalidateQueries();
    toast.success("Sesión cerrada");
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-sm font-semibold text-muted-foreground">Verificando permisos de coordinación…</p>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/30 p-6">
        <div className="max-w-md space-y-4 rounded-3xl border bg-card p-6 text-center shadow-card">
          <Building2 className="mx-auto size-10 text-primary" />
          <h1 className="text-2xl font-black text-foreground">Consola reservada a coordinación ONG / B2B</h1>
          <p className="text-sm text-muted-foreground">
            Sesión actual: <strong>{profile?.full_name || user.email}</strong> (perfil{" "}
            <code>{profile?.persona || "sin perfil"}</code>). Puedes volver a tu vista móvil o entrar directamente en el modo Demo ONG.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={busyDemo}
              onClick={onDemoOng}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busyDemo ? "Abriendo Demo ONG…" : "Cambiar a Demo ONG ahora"}
            </button>
            <Link
              to="/"
              className="rounded-xl border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground hover:bg-secondary/80"
            >
              Volver a app móvil
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const counts = census.reduce(
    (acc, row) => {
      const { tier } = classifyUrgencyTier(row);
      acc[tier] += 1;
      if (!row.schedule_active) acc.paused += 1;
      return acc;
    },
    { critical: 0, preventive: 0, green: 0, pending: 0, paused: 0 }
  );

  const todayAgenda = computeTodayScheduleCoverage(census);
  const selected = census.find((r) => r.senior_id === selectedId) ?? census[0] ?? null;

  function handleExportCsv() {
    const csv = buildConsoleCsvExport(census);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oye-censo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const navItems: { id: ConsoleTab; label: string; icon: typeof ShieldAlert; badge?: number }[] = [
    {
      id: "triaje",
      label: "Torre de Control",
      icon: ShieldAlert,
      badge: counts.critical + counts.preventive,
    },
    {
      id: "agenda",
      label: "Agenda Hoy",
      icon: CalendarClock,
      badge: todayAgenda.overdueCount + todayAgenda.pendingCount,
    },
    { id: "censo", label: "Censo & Escalas", icon: Users, badge: census.length },
    { id: "voluntarios", label: "Voluntarios & Barrio", icon: HandHeart, badge: volunteers.length },
    { id: "impacto", label: "Impacto & FHIR", icon: BarChart3 },
  ];

  return (
    <div className="min-h-dvh bg-secondary/35 text-foreground">
      {/* Desktop Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b bg-card/95 px-4 py-3 backdrop-blur print:hidden md:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/consola" className="text-primary">
              <OyeLogo />
            </Link>
            <div className="hidden border-l pl-4 sm:block">
              <p className="text-sm font-extrabold leading-tight text-foreground">
                {org?.name || "Consola de Coordinación Territorial"}
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {org?.neighborhood || "Chamberí"} · {profile?.full_name || user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15"
            >
              <FileSpreadsheet className="size-3.5" />
              Importar CSV
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={census.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <Download className="size-3.5" />
              Exportar CSV
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
            >
              <Smartphone className="size-3.5" />
              App móvil
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Cerrar sesión de consola"
              className="inline-flex items-center gap-1 rounded-xl border bg-background px-2.5 py-2 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-5 lg:flex-row md:px-6">
        {/* Left Navigation Sidebar */}
        <aside className="shrink-0 space-y-4 print:hidden lg:w-60">
          <nav aria-label="Secciones de la consola" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-left text-xs font-bold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Compact Live Cohort Telemetry Card */}
          <div className="hidden rounded-2xl border bg-card p-4 shadow-sm lg:block space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pulso en directo</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-destructive">
                  <span className="size-2 rounded-full bg-destructive" /> Prioridad Crítica
                </span>
                <span className="font-black">{counts.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-warning">
                  <span className="size-2 rounded-full bg-warning" /> Preventivos
                </span>
                <span className="font-black">{counts.preventive}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-success">
                  <span className="size-2 rounded-full bg-success" /> Filtrado Verde IA
                </span>
                <span className="font-black">{counts.green}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-muted-foreground">Filtro Verde (30d)</span>
                <span className="font-extrabold text-primary">
                  {summary?.filter_green_pct !== null && summary?.filter_green_pct !== undefined
                    ? `${summary.filter_green_pct}%`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Llamadas en pausa</span>
                <span className="font-bold">{counts.paused}</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <B2BModeSelector />
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1">
          {loadingCensus ? (
            <div className="rounded-3xl border bg-card p-12 text-center text-sm text-muted-foreground shadow-sm">
              Cargando censo longitudinal en tiempo real…
            </div>
          ) : tab === "triaje" ? (
            <TriageCommandView
              census={census}
              volunteers={volunteers}
              selected={selected}
              onSelect={setSelectedId}
              summary={summary}
            />
          ) : tab === "agenda" ? (
            <DailyAgendaPanel
              census={census}
              onInspect={(id) => {
                setSelectedId(id);
                setTab("triaje");
              }}
            />
          ) : tab === "censo" ? (
            <CensusTableView
              census={census}
              onInspect={(id) => {
                setSelectedId(id);
                setTab("triaje");
              }}
              onOpenImport={() => setImportOpen(true)}
            />
          ) : tab === "voluntarios" ? (
            <VolunteersNetworkView census={census} volunteers={volunteers} />
          ) : (
            <div className="space-y-6">
              <AnalyticsPanel census={census} volunteers={volunteers} summary={summary} />
              <FhirViewerCard census={census} />
            </div>
          )}
        </main>
      </div>

      <BatchImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function TriageCommandView({
  census,
  volunteers,
  selected,
  onSelect,
  summary,
}: {
  census: ConsoleCensusRow[];
  volunteers: ConsoleVolunteerRow[];
  selected: ConsoleCensusRow | null;
  onSelect: (id: string) => void;
  summary: ReturnType<typeof useConsoleCohortSummary>["data"] extends infer S ? S | null : null;
}) {
  const [queueFilter, setQueueFilter] = useState<"all" | "urgent" | "green">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return census.filter((row) => {
      const { tier } = classifyUrgencyTier(row);
      if (queueFilter === "urgent" && tier !== "critical" && tier !== "preventive") return false;
      if (queueFilter === "green" && tier !== "green") return false;
      if (q) {
        const hay = `${row.name} ${row.neighborhood} ${row.meds} ${row.key_contact_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [census, queueFilter, search]);

  const greenCount = census.filter((r) => classifyUrgencyTier(r).tier === "green").length;
  const urgentCount = census.filter((r) => {
    const t = classifyUrgencyTier(r).tier;
    return t === "critical" || t === "preventive";
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card px-4 py-3 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-foreground">
              Filtro IA Activo: {urgentCount} {urgentCount === 1 ? "caso prioritario" : "casos prioritarios"} · {greenCount}{" "}
              en verde sin sobrecarga
            </p>
            <p className="text-xs text-muted-foreground">
              {summary?.filter_green_pct !== null && summary?.filter_green_pct !== undefined
                ? `${summary.filter_green_pct}% de llamadas recientes en VERDE · Despacho medio: ${summary.avg_dispatch_min ?? "—"} min`
                : "Los casos críticos y sin respuesta suben automáticamente arriba de la cola."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", `Todos (${census.length})`],
              ["urgent", `Prioritarios (${urgentCount})`],
              ["green", `En verde (${greenCount})`],
            ] as const
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setQueueFilter(k)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                queueFilter === k ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[350px_1fr] xl:grid-cols-[390px_1fr]">
        {/* Left Queue */}
        <section className="flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm print:hidden">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar mayor, barrio, medicación…"
                aria-label="Buscar en cola de triaje"
                className="h-9 w-full rounded-xl border bg-background pr-3 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="max-h-[74vh] divide-y overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">No hay personas en este filtro.</p>
            ) : (
              filtered.map((row) => {
                const { tier, label } = classifyUrgencyTier(row);
                const sla = computeSlaStatus(row.active_alert_created_at, row.active_alert_mood);
                const isSelected = selected?.senior_id === row.senior_id;
                const badgeTone =
                  tier === "critical"
                    ? "bg-destructive text-destructive-foreground"
                    : tier === "preventive"
                    ? "bg-warning text-warning-foreground"
                    : tier === "green"
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground";

                return (
                  <button
                    key={row.senior_id}
                    type="button"
                    onClick={() => onSelect(row.senior_id)}
                    className={`w-full p-3.5 text-left transition-colors ${
                      isSelected ? "bg-primary/8 ring-1 ring-inset ring-primary/30" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <PersonAvatar id={row.senior_id} name={row.name} small />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-foreground">
                            {row.name}
                            {row.age ? `, ${row.age}` : ""}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {row.neighborhood || "Chamberí"} · {!row.schedule_active ? "En pausa" : "Llamada diaria"}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeTone}`}>
                        {label}
                      </span>
                    </div>

                    {(row.latest_headline || row.active_alert_summary) && (
                      <p className="mt-2 line-clamp-2 text-xs text-foreground/85">
                        {row.active_alert_summary || row.latest_headline}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                      {row.active_alert_id && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${
                            sla.level === "critical_60"
                              ? "bg-destructive/15 text-destructive"
                              : sla.level === "warning_30"
                              ? "bg-warning/15 text-warning"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          <Clock className="size-3" /> Espera {sla.label}
                        </span>
                      )}
                      {row.active_alert_volunteer_name && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-primary">
                          Vol: {row.active_alert_volunteer_name}
                        </span>
                      )}
                      {row.latest_ucla_score !== null && <span>UCLA: {row.latest_ucla_score}/6</span>}
                      {row.latest_yesavage_score !== null && <span>GDS-5: {row.latest_yesavage_score}/5</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right Full 360 Dossier Workspace */}
        <section className="min-w-0 space-y-4">
          {selected ? (
            <SeniorCommandDetail senior={selected} volunteers={volunteers} />
          ) : (
            <div className="rounded-3xl border bg-card p-10 text-center text-sm text-muted-foreground">
              Selecciona una persona del censo para abrir su expediente clínico en vivo.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SeniorCommandDetail({
  senior,
  volunteers,
}: {
  senior: ConsoleCensusRow;
  volunteers: ConsoleVolunteerRow[];
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: logs = [] } = useAllCallLogs(senior.senior_id);
  const [detailTab, setDetailTab] = useState<DetailTab>("resumen");
  const [editOpen, setEditOpen] = useState(false);
  const [pausing, setPausing] = useState(false);

  const latestLog = logs[0] ?? null;
  const sla = computeSlaStatus(senior.active_alert_created_at, senior.active_alert_mood);

  async function toggleSchedulePause() {
    setPausing(true);
    try {
      const nextPaused = senior.schedule_active;
      const { data, error } = await supabase.rpc("console_toggle_schedule_pause", {
        _senior_id: senior.senior_id,
        _paused: nextPaused,
        _call_hour: senior.schedule_call_hour ?? 11,
      });
      if (error || !data) throw error ?? new Error("Update failed");
      toast.success(
        nextPaused
          ? `Llamada diaria de ${senior.name} pausada (sin falsas alarmas)`
          : `Llamada diaria reactivada para ${senior.name}`
      );
      await qc.invalidateQueries({ queryKey: ["console"] });
    } catch {
      toast.error("No se pudo actualizar la programación.");
    } finally {
      setPausing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <PersonAvatar id={senior.senior_id} name={senior.name} />
            <div>
              <h2 className="text-2xl font-black text-foreground">
                {senior.name}
                {senior.age ? `, ${senior.age} años` : ""}
              </h2>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {senior.neighborhood || "Chamberí"}
                </span>
                {senior.birthday && <span>· Cumpleaños: {senior.birthday}</span>}
                {senior.phone && (
                  <a href={`tel:${senior.phone}`} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
                    <Phone className="size-3.5" /> {senior.phone}
                  </a>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-bold hover:bg-secondary"
            >
              <ClipboardEdit className="size-4 text-primary" />
              Editar ficha & pauta
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-bold hover:bg-secondary"
            >
              <Printer className="size-4 text-muted-foreground" />
              Imprimir / PDF
            </button>

            <button
              type="button"
              disabled={pausing}
              onClick={() => void toggleSchedulePause()}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                senior.schedule_active
                  ? "border-border bg-secondary/70 text-foreground hover:bg-secondary"
                  : "border-warning/40 bg-warning/15 text-foreground"
              }`}
            >
              {senior.schedule_active ? (
                <>
                  <PauseCircle className="size-4 text-warning" /> Pausar
                </>
              ) : (
                <>
                  <PlayCircle className="size-4 text-success" /> Reanudar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void navigate({ to: "/llamada", search: { sid: senior.senior_id } })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <PhoneCall className="size-4" />
              Llamar con OYE
            </button>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background/70 p-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Pill className="size-3.5 text-primary" /> Medicación (co-piloto IA)
            </span>
            <p className="mt-1 font-semibold text-foreground">{senior.meds || "No registrada"}</p>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Activity className="size-3.5 text-primary" /> Citas & Agenda
            </span>
            <p className="mt-1 font-semibold text-foreground">{senior.appointments || "Sin citas próximas"}</p>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <KeyRound className="size-3.5 text-primary" /> Persona con llave
            </span>
            <p className="mt-1 font-semibold text-foreground">
              {senior.key_contact_name || "No asignada"}
              {senior.key_contact_phone && (
                <>
                  {" · "}
                  <a href={`tel:${senior.key_contact_phone}`} className="font-bold text-primary underline">
                    {senior.key_contact_phone}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        {senior.active_alert_id && sla.protocolHint && (
          <div
            role="status"
            className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold ${
              sla.level === "critical_60"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : sla.level === "warning_30"
                ? "border-warning/40 bg-warning/15 text-foreground"
                : "border-primary/25 bg-primary/5 text-primary"
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              SLA Aviso activo ({sla.label}): {sla.protocolHint}
            </span>
            {senior.key_contact_phone && (
              <a
                href={`tel:${senior.key_contact_phone}`}
                className="rounded-lg bg-card px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-xs hover:underline"
              >
                Llamar a {senior.key_contact_name || "llave"} ahora
              </a>
            )}
          </div>
        )}

        {/* Dossier View Tabs */}
        <div className="flex flex-wrap gap-1.5 border-t pt-3 print:hidden">
          {(
            [
              ["resumen", "Resumen, Informe & Despacho"],
              ["curva", `Curva Clínica & Memoria (${logs.filter((l) => l.status === "completada").length})`],
              ["bitacora", "Bitácora & Prescripción Social"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDetailTab(id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                detailTab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {detailTab === "resumen" ? (
        <div className="space-y-4">
          <div className="print:hidden">
            <DispatchPanel senior={senior} volunteers={volunteers} />
          </div>
          {latestLog ? (
            <SituationReportCard
              log={latestLog}
              showExecutiveOnly={false}
              keyContact={{ name: senior.key_contact_name, phone: senior.key_contact_phone }}
              onRetryCall={() => void navigate({ to: "/llamada", search: { sid: senior.senior_id } })}
            />
          ) : (
            <div className="rounded-3xl border bg-card p-6 text-xs text-muted-foreground">
              Todavía no hay una llamada analizada para <strong>{senior.name}</strong>.
            </div>
          )}
          {logs.length > 0 && <FamilyWeeklyDigest seniorName={senior.name} logs={logs} />}
        </div>
      ) : detailTab === "curva" ? (
        <ClinicalTrajectoryChart seniorName={senior.name} logs={logs} />
      ) : (
        <DossierTimelinePanel senior={senior} logs={logs} />
      )}

      <SeniorEditModal senior={senior} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function CensusTableView({
  census,
  onInspect,
  onOpenImport,
}: {
  census: ConsoleCensusRow[];
  onInspect: (seniorId: string) => void;
  onOpenImport: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | UrgencyTier | "paused">("all");
  const [barrioFilter, setBarrioFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const neighborhoods = useMemo(
    () => [...new Set(census.map((r) => r.neighborhood.trim() || "Sin barrio"))].sort((a, b) => a.localeCompare(b, "es")),
    [census]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return census.filter((r) => {
      const { tier } = classifyUrgencyTier(r);
      if (tierFilter === "paused" && r.schedule_active) return false;
      if (tierFilter !== "all" && tierFilter !== "paused" && tier !== tierFilter) return false;
      if (barrioFilter !== "all" && (r.neighborhood.trim() || "Sin barrio") !== barrioFilter) return false;
      if (q) {
        const hay = `${r.name} ${r.neighborhood} ${r.phone} ${r.meds} ${r.key_contact_name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [census, search, tierFilter, barrioFilter]);

  async function togglePause(row: ConsoleCensusRow) {
    setBusyId(row.senior_id);
    try {
      const { data, error } = await supabase.rpc("console_toggle_schedule_pause", {
        _senior_id: row.senior_id,
        _paused: row.schedule_active,
        _call_hour: row.schedule_call_hour ?? 11,
      });
      if (error || !data) throw error ?? new Error("Failed");
      toast.success(row.schedule_active ? `${row.name} en pausa` : `${row.name} reactivado`);
      await qc.invalidateQueries({ queryKey: ["console"] });
    } catch {
      toast.error("No se pudo cambiar la programación.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, barrio, teléfono o medicación…"
              aria-label="Buscar en censo"
              className="h-9 w-full rounded-xl border bg-background pr-3 pl-9 text-xs"
            />
          </div>

          <select
            aria-label="Filtrar por estado"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
            className="h-9 rounded-xl border bg-background px-3 text-xs font-semibold"
          >
            <option value="all">Todos los estados ({census.length})</option>
            <option value="critical">Críticos / No contesta</option>
            <option value="preventive">Preventivos / Amarillo</option>
            <option value="green">Verde estable</option>
            <option value="pending">Sin llamada reciente</option>
            <option value="paused">En pausa / Vacaciones</option>
          </select>

          <select
            aria-label="Filtrar por barrio"
            value={barrioFilter}
            onChange={(e) => setBarrioFilter(e.target.value)}
            className="h-9 rounded-xl border bg-background px-3 text-xs font-semibold"
          >
            <option value="all">Todos los barrios</option>
            {neighborhoods.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" /> Alta masiva CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-secondary/70 text-[11px] font-bold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Persona mayor</th>
              <th className="px-3 py-3">Barrio</th>
              <th className="px-3 py-3">Semáforo & Triaje</th>
              <th className="px-3 py-3">UCLA · GDS-5 · Léxico</th>
              <th className="px-3 py-3">Adherencia</th>
              <th className="px-3 py-3">Llamada diaria</th>
              <th className="px-3 py-3">Llave</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Sin resultados con los filtros actuales.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const { tier, label } = classifyUrgencyTier(r);
                const chipTone =
                  tier === "critical"
                    ? "bg-destructive text-destructive-foreground"
                    : tier === "preventive"
                    ? "bg-warning text-warning-foreground"
                    : tier === "green"
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground";
                return (
                  <tr key={r.senior_id} className="hover:bg-secondary/35">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">
                        {r.name}
                        {r.age ? `, ${r.age}` : ""}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">{r.phone || "Sin teléfono"}</p>
                    </td>
                    <td className="px-3 py-3 font-semibold">{r.neighborhood || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${chipTone}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] font-semibold">
                      UCLA: {r.latest_ucla_score ?? "—"} · GDS-5: {r.latest_yesavage_score ?? "—"} ·{" "}
                      {r.latest_riqueza_lexica !== null ? `${r.latest_riqueza_lexica}% léx.` : "—"}
                    </td>
                    <td className="px-3 py-3 text-[11px] font-semibold">{r.latest_adherencia || "No evaluada"}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={busyId === r.senior_id}
                        onClick={() => void togglePause(r)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          r.schedule_active
                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                            : "bg-warning/20 text-foreground hover:bg-warning/30"
                        }`}
                      >
                        {r.schedule_active ? (
                          <>Activa {r.schedule_call_hour ?? 11}:00</>
                        ) : (
                          <>
                            <CalendarOff className="size-3" /> En pausa
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[11px]">
                      {r.key_contact_name ? <span className="font-semibold">{r.key_contact_name}</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onInspect(r.senior_id)}
                        className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-primary hover:bg-secondary/80"
                      >
                        Abrir ficha
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VolunteersNetworkView({
  census,
  volunteers,
}: {
  census: ConsoleCensusRow[];
  volunteers: ConsoleVolunteerRow[];
}) {
  const qc = useQueryClient();
  const { data: resources = [] } = useCommunityResources(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("Chamberí");
  const [busyVol, setBusyVol] = useState(false);

  const [resName, setResName] = useState("");
  const [resSchedule, setResSchedule] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [busyRes, setBusyRes] = useState(false);

  const coverage = computeDistrictCoverage(census, volunteers);

  async function addVolunteer(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusyVol(true);
    try {
      const { data, error } = await supabase.rpc("console_upsert_volunteer", {
        _name: name.trim(),
        _phone: phone.trim(),
        _neighborhood: neighborhood.trim() || "Chamberí",
        _available: true,
      });
      if (error || !data) throw error ?? new Error("Failed");
      toast.success(`Voluntario ${name.trim()} añadido a la red`);
      setName("");
      setPhone("");
      await qc.invalidateQueries({ queryKey: ["console", "volunteers"] });
    } catch {
      toast.error("No se pudo guardar el voluntario.");
    } finally {
      setBusyVol(false);
    }
  }

  async function addResource(e: FormEvent) {
    e.preventDefault();
    if (!resName.trim()) return;
    setBusyRes(true);
    try {
      const { data, error } = await supabase.rpc("console_upsert_community_resource", {
        _name: resName.trim(),
        _category: "centro_mayores",
        _neighborhood: neighborhood.trim() || "Chamberí",
        _schedule: resSchedule.trim(),
        _contact: "",
        _description: resDesc.trim(),
      });
      if (error || !data) throw error ?? new Error("Failed");
      toast.success(`Recurso «${resName.trim()}» añadido al catálogo del barrio`);
      setResName("");
      setResSchedule("");
      setResDesc("");
      await qc.invalidateQueries({ queryKey: ["console", "community-resources"] });
    } catch {
      toast.error("No se pudo añadir el recurso de barrio.");
    } finally {
      setBusyRes(false);
    }
  }

  async function toggleAvailability(id: string, current: boolean, vName: string) {
    try {
      const { error } = await supabase.rpc("console_upsert_volunteer", {
        _id: id,
        _available: !current,
      });
      if (error) throw error;
      toast.success(`${vName}: ${!current ? "Disponible" : "En pausa"}`);
      await qc.invalidateQueries({ queryKey: ["console", "volunteers"] });
    } catch {
      toast.error("No se pudo cambiar la disponibilidad.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-foreground">Red Comunitaria de Voluntarios («Voy yo»)</h2>
            <p className="text-xs text-muted-foreground">
              Voluntarios con app activa + directorio verificado de la asociación, visitas en curso y balance mensual.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-secondary/70 text-[11px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Voluntario</th>
                  <th className="px-3 py-2.5">Barrio</th>
                  <th className="px-3 py-2.5">Canal</th>
                  <th className="px-3 py-2.5">En curso</th>
                  <th className="px-3 py-2.5">Visitas (30d)</th>
                  <th className="px-4 py-2.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Todavía no hay voluntarios registrados.
                    </td>
                  </tr>
                ) : (
                  volunteers.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-foreground">{v.name}</p>
                        {v.phone && (
                          <a href={`tel:${v.phone}`} className="font-mono text-[11px] text-primary hover:underline">
                            {v.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold">{v.neighborhood || "Chamberí"}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">
                          {v.source === "profile" ? "App «Voy yo»" : "Directorio ONG"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold">{v.active_visits}</td>
                      <td className="px-3 py-2.5 font-bold text-primary">{v.completed_30d}</td>
                      <td className="px-4 py-2.5 text-right">
                        {v.source === "directory" ? (
                          <button
                            type="button"
                            onClick={() => void toggleAvailability(v.id, v.available, v.name)}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              v.available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {v.available ? "Disponible" : "En pausa"}
                          </button>
                        ) : (
                          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success">
                            Activo app
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <form onSubmit={(e) => void addVolunteer(e)} className="space-y-3 rounded-3xl border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <Plus className="size-4 text-primary" /> Alta rápida de voluntario
            </h3>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
              aria-label="Nombre del voluntario"
              className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono (+34...)"
              aria-label="Teléfono del voluntario"
              className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
            />
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Barrio / Distrito"
              aria-label="Barrio del voluntario"
              className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
            />
            <button
              type="submit"
              disabled={busyVol || !name.trim()}
              className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busyVol ? "Guardando…" : "Añadir a la red"}
            </button>
          </form>

          <section className="space-y-2.5 rounded-3xl border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-foreground">Desiertos de Cobertura</h3>
            {coverage.map((c) => (
              <div key={c.neighborhood} className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
                <div>
                  <p className="font-bold">{c.neighborhood}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.seniorsCount} mayores · {c.volunteersAvailable} voluntarios
                  </p>
                </div>
                {c.coverageGap ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    <AlertTriangle className="size-3" /> {c.ratioLabel}
                  </span>
                ) : (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                    {c.ratioLabel}
                  </span>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Neighborhood Social Prescription Catalog Management */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3 rounded-3xl border bg-card p-5 shadow-sm">
          <div>
            <h3 className="flex items-center gap-1.5 text-base font-black text-foreground">
              <Compass className="size-4 text-primary" />
              Catálogo de Prescripción Social del Barrio ({resources.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Recursos comunitarios listos para prescribir desde cualquier expediente en 1 clic.
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {resources.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-background/70 p-3.5 text-xs space-y-1">
                <p className="font-bold text-foreground">{r.name}</p>
                <p className="font-semibold text-primary">
                  {r.neighborhood} · {r.schedule}
                </p>
                {r.description && <p className="text-muted-foreground">{r.description}</p>}
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={(e) => void addResource(e)} className="space-y-3 rounded-3xl border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Plus className="size-4 text-primary" /> Añadir recurso del barrio
          </h3>
          <input
            type="text"
            required
            value={resName}
            onChange={(e) => setResName(e.target.value)}
            placeholder="Ej. Centro Cultural Vallehermoso"
            className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
          />
          <input
            type="text"
            value={resSchedule}
            onChange={(e) => setResSchedule(e.target.value)}
            placeholder="Horario (ej. Martes 17:00 h)"
            className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
          />
          <textarea
            rows={2}
            value={resDesc}
            onChange={(e) => setResDesc(e.target.value)}
            placeholder="Actividad o contacto de referencia…"
            className="w-full rounded-xl border bg-background p-2.5 text-xs"
          />
          <button
            type="submit"
            disabled={busyRes || !resName.trim()}
            className="w-full rounded-xl bg-secondary py-2 text-xs font-bold text-primary hover:bg-secondary/80 disabled:opacity-50"
          >
            {busyRes ? "Guardando…" : "Añadir al catálogo social"}
          </button>
        </form>
      </div>
    </div>
  );
}
