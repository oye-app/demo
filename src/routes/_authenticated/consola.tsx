import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarOff,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  HandHeart,
  KeyRound,
  MapPin,
  PauseCircle,
  Phone,
  PhoneCall,
  Pill,
  PlayCircle,
  Plus,
  Search,
  ShieldAlert,
  Smartphone,
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
import { useMe } from "@/lib/auth";
import { useAllCallLogs } from "@/lib/call-logs";
import { supabase } from "@/integrations/supabase/client";
import {
  buildConsoleCsvExport,
  classifyUrgencyTier,
  computeDistrictCoverage,
  computeSlaStatus,
  useConsoleCensus,
  useConsoleCohortSummary,
  useConsoleRealtimeSync,
  useConsoleVolunteers,
  useIsConsoleOperator,
  type ConsoleCensusRow,
  type UrgencyTier,
} from "@/lib/console";

export const Route = createFileRoute("/_authenticated/consola")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Consola de Coordinación ONG & B2B · OYE" },
      {
        name: "description",
        content:
          "Torre de control de escritorio para ONG, teleasistencia y aseguradoras: triaje por semáforo, biomarcadores, despacho vecinal e impacto clínico.",
      },
    ],
  }),
  component: ConsolePage,
});

type ConsoleTab = "triaje" | "censo" | "voluntarios" | "impacto";

function ConsolePage() {
  const { user, profile } = useMe();
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

  if (checkingAccess) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-sm font-semibold text-muted-foreground">Verificando permisos de coordinación…</p>
      </div>
    );
  }

  if (!isOperator) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 rounded-3xl border bg-card p-6 text-center shadow-card">
          <Building2 className="mx-auto size-10 text-primary" />
          <h1 className="text-2xl font-black text-foreground">Consola reservada a coordinación ONG / B2B</h1>
          <p className="text-sm text-muted-foreground">
            Tu sesión actual (<strong>{profile.full_name}</strong> · perfil <code>{profile.persona}</code>) está configurada para la vista móvil. Para explorar el centro de mando completo, entra como coordinación ONG o vuelve a tu vista móvil.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link
              to="/"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Volver a mi app
            </Link>
            <Link
              to="/bienvenida"
              search={{ paso: "acceso" }}
              className="rounded-xl border bg-secondary px-4 py-2.5 text-sm font-bold text-foreground hover:bg-secondary/80"
            >
              Cambiar a perfil ONG
            </Link>
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
    { id: "censo", label: "Censo & Escalas", icon: Users, badge: census.length },
    { id: "voluntarios", label: "Red de Voluntarios", icon: HandHeart, badge: volunteers.length },
    { id: "impacto", label: "Impacto & B2B", icon: BarChart3 },
  ];

  return (
    <div className="min-h-dvh bg-secondary/35 text-foreground">
      {/* Desktop Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-6">
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
                {org?.neighborhood || "Chamberí"} · Operador: {profile.full_name} ({user.email || "ONG"})
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
              Vista móvil
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-5 lg:flex-row md:px-6">
        {/* Left Navigation Sidebar */}
        <aside className="shrink-0 lg:w-60 space-y-4">
          <nav aria-label="Secciones de la consola" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-1">
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
                <span className="flex items-center gap-1.5 text-destructive font-semibold">
                  <span className="size-2 rounded-full bg-destructive" /> Prioridad Crítica
                </span>
                <span className="font-black">{counts.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-warning font-semibold">
                  <span className="size-2 rounded-full bg-warning" /> Preventivos
                </span>
                <span className="font-black">{counts.preventive}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-success font-semibold">
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
            <AnalyticsPanel census={census} volunteers={volunteers} summary={summary} />
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
  volunteers: ReturnType<typeof useConsoleVolunteers>["data"] extends (infer T)[] | undefined ? T[] : never;
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
      {/* Silent Green Filter Hero Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card px-4 py-3 shadow-sm">
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
                ? `${summary.filter_green_pct}% de las llamadas recientes resueltas en VERDE · Tiempo medio de despacho: ${summary.avg_dispatch_min ?? "—"} min`
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

      {/* Master-Detail Split Grid */}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]">
        {/* Left Queue */}
        <section className="flex flex-col rounded-3xl border bg-card shadow-sm overflow-hidden">
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

          <div className="max-h-[72vh] divide-y overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                No hay personas en este filtro ahora mismo.
              </p>
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

        {/* Right Detail Workspace */}
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
  volunteers: ReturnType<typeof useConsoleVolunteers>["data"] extends (infer T)[] | undefined ? T[] : never;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: logs = [] } = useAllCallLogs(senior.senior_id);
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
      toast.error("No se pudo actualizar el estado de la programación.");
    } finally {
      setPausing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Expediente Top Bar */}
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

          <div className="flex flex-wrap items-center gap-2">
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
                  <PauseCircle className="size-4 text-warning" /> Pausar llamadas (Vacaciones)
                </>
              ) : (
                <>
                  <PlayCircle className="size-4 text-success" /> Reanudar llamadas diarias
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void navigate({ to: "/llamada", search: { sid: senior.senior_id } })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <PhoneCall className="size-4" />
              Llamar ahora con OYE
            </button>
          </div>
        </div>

        {/* Clinical Care Context Ribbon */}
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background/70 p-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Pill className="size-3.5 text-primary" /> Medicación habitual
            </span>
            <p className="mt-1 font-semibold text-foreground">{senior.meds || "No registrada"}</p>
          </div>
          <div className="rounded-2xl border bg-background/70 p-3 text-xs">
            <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
              <Activity className="size-3.5 text-primary" /> Cita médica / Agenda
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
      </div>

      {/* Dispatch Panel + Latest Clinical Report */}
      <DispatchPanel senior={senior} volunteers={volunteers} />

      {latestLog ? (
        <SituationReportCard
          log={latestLog}
          showExecutiveOnly={false}
          keyContact={{ name: senior.key_contact_name, phone: senior.key_contact_phone }}
          onRetryCall={() => void navigate({ to: "/llamada", search: { sid: senior.senior_id } })}
        />
      ) : (
        <div className="rounded-3xl border bg-card p-6 text-xs text-muted-foreground">
          Todavía no hay una llamada analizada para <strong>{senior.name}</strong>. Pulsa «Llamar ahora con OYE» para lanzar su primera llamada de bienvenida.
        </div>
      )}

      {logs.length > 0 && <FamilyWeeklyDigest seniorName={senior.name} logs={logs} />}
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
        <div className="flex flex-wrap items-center gap-2 flex-1">
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
                    <td className="px-3 py-3 text-[11px] font-semibold">
                      {r.latest_adherencia || "No evaluada"}
                    </td>
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
                      {r.key_contact_name ? (
                        <span className="font-semibold">{r.key_contact_name}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
  volunteers: ReturnType<typeof useConsoleVolunteers>["data"] extends (infer T)[] | undefined ? T[] : never;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("Chamberí");
  const [busy, setBusy] = useState(false);
  const coverage = computeDistrictCoverage(census, volunteers);

  async function addVolunteer(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
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
      setBusy(false);
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
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-foreground">Red Comunitaria de Voluntarios («Voy yo»)</h2>
          <p className="text-xs text-muted-foreground">
            Voluntarios conectados desde la app móvil + directorio verificado de la asociación, con carga de visitas en curso y balance mensual.
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
        <form onSubmit={(e) => void addVolunteer(e)} className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
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
            disabled={busy || !name.trim()}
            className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Añadir a la red"}
          </button>
        </form>

        <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-2.5">
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
  );
}
