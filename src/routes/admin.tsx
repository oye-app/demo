import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { BarChart3, HandHeart, Inbox, LogOut, Plus, Settings, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { activityStats } from "@/lib/stats";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { BigButton, OyeLogo, btn } from "@/components/oye";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administración · OYE" },
      { name: "description", content: "Actualice los datos de las personas, los voluntarios y la organización." },
      { property: "og:title", content: "Administración · OYE" },
      { property: "og:description", content: "Panel de administración de OYE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const input =
  "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Admin() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase
      .rpc("has_role", { _user_id: session.user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-4">
      <Toaster position="top-center" />
      <header className="flex h-12 items-center justify-between">
        <Link to="/" className="text-primary"><OyeLogo /></Link>
        {session && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="tap flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="size-4" /> Salir
          </button>
        )}
      </header>
      <main className="flex flex-1 flex-col">
        {session === undefined ? null : !session ? (
          <SignIn />
        ) : isAdmin === null ? null : !isAdmin ? (
          <Center title="Sin permiso" text="Su cuenta no es administradora. Pida acceso a la persona responsable." />
        ) : (
          <Editor />
        )}
      </main>
    </div>
  );
}

function Center({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) { toast.error("No se pudo entrar. Revise el correo y la contraseña."); return; }
    if (mode === "up" && !data.session) toast.success("Le hemos enviado un correo para confirmar la cuenta.");
  }

  async function social(provider: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/admin` });
    if (r.error) toast.error("No se pudo entrar.");
  }

  return (
    <Center title="Administración" text="Entre para actualizar personas, voluntarios y organización.">
      <div className="mt-8 w-full max-w-sm space-y-3 text-left">
        <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>
          Continue with Lovable
        </button>
        <BigButton tone="ghost" onClick={() => social("google")}>Continuar con Google</BigButton>
        <div className="py-1 text-center text-sm text-muted-foreground">o con su correo</div>
        <form onSubmit={submit} className="space-y-3">
          <input className={input} type="email" required placeholder="Correo" aria-label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Contraseña" aria-label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          <BigButton disabled={busy}>{mode === "in" ? "Entrar" : "Crear cuenta"}</BigButton>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className={btn("quiet","sm")}>
          {mode === "in" ? "¿Primera vez? Crear cuenta" : "Ya tengo cuenta"}
        </button>
      </div>
    </Center>
  );
}

type Tab = "resumen" | "recomendaciones" | "personas" | "voluntarios" | "organizacion";

function Editor() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [pending, setPending] = useState(0);
  const refreshPending = () =>
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "pending").then(({ count }) => setPending(count ?? 0));
  useEffect(() => { refreshPending(); }, [tab]);
  const tabs: [Tab, string, typeof BarChart3][] = [
    ["resumen", "Resumen", BarChart3],
    ["recomendaciones", "Nuevos", Inbox],
    ["personas", "Personas", Users],
    ["voluntarios", "Voluntarios", HandHeart],
    ["organizacion", "Ajustes", Settings],
  ];
  return (
    <>
      <nav aria-label="Administración" role="tablist" className="sticky top-0 z-10 mt-2 grid grid-cols-5 gap-1 rounded-2xl bg-secondary p-1">
        {tabs.map(([k, l, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.7rem] font-bold transition ${tab === k ? "bg-card text-primary shadow-card" : "text-secondary-foreground"}`}
          >
            <Icon className="size-5" />
            {l}
            {k === "recomendaciones" && pending > 0 && (
              <span className="absolute top-1 right-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[0.65rem] text-destructive-foreground">{pending}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-5 flex-1 pb-6">
        {tab === "resumen" && <Summary go={setTab} />}
        {tab === "recomendaciones" && <Referrals onChange={refreshPending} />}
        {tab === "personas" && <><LinkRequests /><ListEditor kind="seniors" /></>}
        {tab === "voluntarios" && <ListEditor kind="volunteers" />}
        {tab === "organizacion" && <><CoordinatorAccess /><OrgEditor /></>}
      </div>
    </>
  );
}

type Mood = "bien" | "bajo" | "no_contesta";
const MOODS: { key: Mood; label: string; dot: string; chip: string }[] = [
  { key: "bien", label: "Bien", dot: "bg-success", chip: "bg-success text-success-foreground" },
  { key: "bajo", label: "Ánimo bajo", dot: "bg-warning", chip: "bg-warning text-warning-foreground" },
  { key: "no_contesta", label: "No contesta", dot: "bg-destructive", chip: "bg-destructive text-destructive-foreground" },
];
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function Summary({ go }: { go: (t: Tab) => void }) {
  const [data, setData] = useState<{
    seniors: { id: string; name: string; active: boolean }[];
    volunteers: number;
    checks: { senior_id: string; mood: Mood; created_at: string }[];
    refs: { status: string; kind: string; referrer_name: string; referrer_code: string; via_code: string }[];
    alerts: { status: string; created_at: string }[];
  } | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - 6 * 864e5); since.setHours(0, 0, 0, 0);
    Promise.all([
      supabase.from("seniors").select("id, name, active"),
      supabase.from("volunteers").select("id", { count: "exact", head: true }).eq("available", true),
      supabase.from("check_ins").select("senior_id, mood, created_at").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
      supabase.from("referrals").select("status, kind, referrer_name, referrer_code, via_code"),
      supabase.from("alerts").select("status, created_at").order("created_at", { ascending: false }).limit(1000),
    ]).then(([s, v, c, r, al]) =>
      setData({ seniors: s.data ?? [], volunteers: v.count ?? 0, checks: (c.data ?? []) as never, refs: r.data ?? [], alerts: al.data ?? [] }),
    );
  }, []);

  if (!data) return <p className="py-10 text-center text-muted-foreground">Cargando…</p>;

  const active = data.seniors.filter((s) => s.active);
  const today = startOfToday().getTime();
  const latestToday = new Map<string, Mood>();
  for (const c of data.checks) if (new Date(c.created_at).getTime() >= today && !latestToday.has(c.senior_id)) latestToday.set(c.senior_id, c.mood);
  const attention = active.filter((s) => { const m = latestToday.get(s.id); return m === "bajo" || m === "no_contesta"; });
  const notCalled = active.filter((s) => !latestToday.has(s.id)).length;
  const pending = data.refs.filter((r) => r.status === "pending").length;
  const accepted = data.refs.filter((r) => r.status === "accepted").length;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = startOfToday(); d.setDate(d.getDate() - (6 - i));
    const end = d.getTime() + 864e5;
    const dayChecks = data.checks.filter((c) => { const t = new Date(c.created_at).getTime(); return t >= d.getTime() && t < end; });
    return { label: d.toLocaleDateString("es-ES", { weekday: "narrow" }), counts: MOODS.map((m) => dayChecks.filter((c) => c.mood === m.key).length) };
  });
  const max = Math.max(1, ...days.map((d) => d.counts.reduce((a, b) => a + b, 0)));

  const byCode = new Map<string, { name: string; n: number }>();
  for (const r of data.refs) if (r.referrer_code) { const e = byCode.get(r.referrer_code) ?? { name: "", n: 0 }; if (r.referrer_name) e.name = r.referrer_name; byCode.set(r.referrer_code, e); }
  for (const r of data.refs) { const code = r.via_code || r.referrer_code; if (!code) continue; const e = byCode.get(code) ?? { name: "", n: 0 }; e.n++; byCode.set(code, e); }
  const top = [...byCode.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3);

  const stats: [string, string | number, Tab][] = [
    ["Personas acompañadas", active.length, "personas"],
    ["Voluntarios disponibles", data.volunteers, "voluntarios"],
    ["Recomendaciones nuevas", pending, "recomendaciones"],
    ["Sin llamar hoy", notCalled, "personas"],
  ];

  const act = activityStats(data.alerts, data.refs, today);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-card p-5 shadow-card" aria-label="Actividad">
        <h2 className="font-bold">Actividad</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[["Llamadas", act.calls, `${act.callsToday} hoy`], ["Visitas hechas", act.visits, `${act.visitsToday} hoy`], ["Recomendaciones", act.refs, `${act.refsAccepted} dadas de alta`]].map(([l, n, sub]) => (
            <div key={l as string} className="rounded-2xl bg-secondary p-3">
              <p className="text-2xl font-extrabold text-primary">{n}</p>
              <p className="text-xs font-semibold">{l}</p>
              <p className="text-[0.65rem] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-4 text-sm font-bold text-muted-foreground">Pendiente</h3>
        <ul className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[["Sin atender", act.open, true], ["En camino", act.onTheWay, false], ["Recomend. por revisar", act.refsPending, false]].map(([l, n, hot]) => (
            <li key={l as string} className="rounded-2xl border p-3">
              <p className={`text-2xl font-extrabold ${hot && (n as number) > 0 ? "text-destructive" : "text-foreground"}`}>{n as number}</p>
              <p className="text-xs text-muted-foreground">{l as string}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map(([l, n, t]) => (
          <button key={l} onClick={() => go(t)} className="tap rounded-2xl bg-card p-4 text-left shadow-card hover:bg-secondary">
            <p className="text-3xl font-extrabold text-primary">{n}</p>
            <p className="text-sm text-muted-foreground">{l}</p>
          </button>
        ))}
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="font-bold">Necesitan atención hoy</h2>
        {attention.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nadie, por ahora. ¡Buen día!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {attention.map((s) => { const m = MOODS.find((x) => x.key === latestToday.get(s.id))!; return (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span className="font-semibold">{s.name}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.chip}`}>{m.label}</span>
              </li>
            ); })}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">Cómo están · 7 días</h2>
          <span className="flex gap-3 text-xs text-muted-foreground">
            {MOODS.map((m) => <span key={m.key} className="flex items-center gap-1"><span className={`size-2 rounded-full ${m.dot}`} />{m.label}</span>)}
          </span>
        </div>
        <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label="Estado de ánimo de los últimos 7 días">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 flex-col-reverse overflow-hidden rounded-lg bg-muted">
                {d.counts.map((c, j) => <div key={j} className={MOODS[j]!.dot} style={{ height: `${(c / max) * 100}%` }} />)}
              </div>
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="font-bold">Vecinos que más recomiendan</h2>
        <p className="text-sm text-muted-foreground">{accepted} recomendaciones ya acompañadas</p>
        {top.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Aún no hay recomendaciones.</p> : (
          <ol className="mt-3 space-y-2">
            {top.map(([code, e], i) => (
              <li key={code} className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-secondary text-sm font-bold text-primary">{i + 1}</span>
                <span className="flex-1 font-semibold">{e.name || `Vecino ${code}`}</span>
                <span className="text-sm text-muted-foreground">{e.n}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

type Ref = { id: string; kind: string; relation: string; person_name: string; person_age: number | null; person_phone: string; neighborhood: string; referrer_name: string; referrer_phone: string; status: string; created_at: string };

function Referrals({ onChange }: { onChange: () => void }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Ref[]>([]);
  const [show, setShow] = useState<"pending" | "all">("pending");
  async function load() {
    let q = supabase.from("referrals").select("*").order("created_at", { ascending: false });
    if (show === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    setRows((data ?? []) as Ref[]);
  }
  useEffect(() => { load(); }, [show]);

  async function accept(r: Ref) {
    const ins =
      r.kind === "senior"
        ? await supabase.from("seniors").insert({ name: r.person_name, age: r.person_age, phone: r.person_phone, family_contact: [r.referrer_name, r.referrer_phone].filter(Boolean).join(" · "), notes: r.relation ? `Recomendado: ${r.relation}` : "" })
        : await supabase.from("volunteers").insert({ name: r.person_name, phone: r.person_phone, neighborhood: r.neighborhood });
    if (ins.error) { toast.error("No se pudo dar de alta."); return; }
    await supabase.from("referrals").update({ status: "accepted" }).eq("id", r.id);
    toast.success(r.kind === "senior" ? `${r.person_name} ya recibe llamadas` : `${r.person_name} ya es voluntario`);
    qc.invalidateQueries({ queryKey: ["public-data"] });
    load(); onChange();
  }
  async function dismiss(r: Ref) {
    await supabase.from("referrals").update({ status: "dismissed" }).eq("id", r.id);
    load(); onChange();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["pending", "all"] as const).map((s) => (
          <button key={s} onClick={() => setShow(s)} className={`tap h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${show === s ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}>
            {s === "pending" ? "Por revisar" : "Todas"}
          </button>
        ))}
      </div>
      {rows.length === 0 && <p className="py-10 text-center text-muted-foreground">No hay recomendaciones por revisar.</p>}
      {rows.map((r) => (
        <article key={r.id} className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">{r.kind === "senior" ? "Persona mayor" : "Voluntario"}</p>
              <h3 className="text-xl font-extrabold">{r.person_name}{r.person_age ? `, ${r.person_age}` : ""}</h3>
              <p className="text-sm text-muted-foreground">
                {r.person_phone}{r.neighborhood ? ` · ${r.neighborhood}` : ""}
              </p>
              {r.kind === "senior" && r.referrer_name && (
                <p className="mt-1 text-sm">Lo recomienda <strong>{r.referrer_name}</strong>{r.relation ? ` (${r.relation.toLowerCase()})` : ""}{r.referrer_phone ? ` · ${r.referrer_phone}` : ""}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
          </div>
          {r.status === "pending" ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => accept(r)} className={btn("primary","sm")}>Dar de alta</button>
              <button onClick={() => dismiss(r)} className={btn("ghost","sm")}>Descartar</button>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-muted-foreground">{r.status === "accepted" ? "Dado de alta" : "Descartado"}</p>
          )}
        </article>
      ))}
    </div>
  );
}

type Field = { key: string; label: string; type?: "number" | "check" | "textarea" };
const fields: Record<"seniors" | "volunteers", Field[]> = {
  seniors: [
    { key: "name", label: "Nombre y apellido" },
    { key: "age", label: "Edad", type: "number" },
    { key: "phone", label: "Teléfono" },
    { key: "address", label: "Dirección" },
    { key: "neighborhood", label: "Barrio" },
    { key: "family_contact", label: "Contacto de la familia" },
    { key: "notes", label: "Notas", type: "textarea" },
    { key: "active", label: "Recibe llamadas", type: "check" },
  ],
  volunteers: [
    { key: "name", label: "Nombre y apellido" },
    { key: "phone", label: "Teléfono" },
    { key: "neighborhood", label: "Barrio" },
    { key: "available", label: "Disponible", type: "check" },
  ],
};

type Row = { id: string; name: string; age?: number | null; phone?: string; [k: string]: unknown };

function ListEditor({ kind }: { kind: "seniors" | "volunteers" }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [moods, setMoods] = useState<Record<string, Mood>>({});

  async function load() {
    const { data } = await supabase.from(kind).select("*").order("created_at");
    setRows((data ?? []) as Row[]);
    if (kind === "seniors") {
      const { data: c } = await supabase.from("check_ins").select("senior_id, mood").gte("created_at", startOfToday().toISOString()).order("created_at");
      const m: Record<string, Mood> = {};
      for (const x of c ?? []) m[x.senior_id] = x.mood as Mood;
      setMoods(m);
    }
  }

  async function logMood(id: string, mood: Mood) {
    setMoods((m) => ({ ...m, [id]: mood }));
    const { error } = await supabase.from("check_ins").insert({ senior_id: id, mood });
    if (error) toast.error("No se pudo registrar.");
  }
  useEffect(() => { load(); setEditing(null); }, [kind]);

  async function save(values: Record<string, unknown>) {
    const { error } =
      editing === "new"
        ? await supabase.from(kind).insert(values as never)
        : await supabase.from(kind).update(values as never).eq("id", (editing as Row).id);
    if (error) { toast.error("No se pudo guardar. Revise los datos."); return; }
    toast.success("Guardado");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["public-data"] });
    load();
  }

  async function remove(row: Row) {
    if (!confirm(`¿Borrar a ${row.name}?`)) return;
    const { error } = await supabase.from(kind).delete().eq("id", row.id);
    if (error) { toast.error("No se pudo borrar."); return; }
    toast.success("Borrado");
    qc.invalidateQueries({ queryKey: ["public-data"] });
    load();
  }

  if (editing) {
    return <RowForm fields={fields[kind]} initial={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSave={save} />;
  }

  const activeKey = kind === "seniors" ? "active" : "available";
  return (
    <div className="space-y-3">
      {kind === "seniors" && <p className="text-sm text-muted-foreground">Toque un color para anotar su ánimo de hoy.</p>}
      <BigButton onClick={() => setEditing("new")}>
        <Plus className="size-5" /> {kind === "seniors" ? "Añadir persona" : "Añadir voluntario"}
      </BigButton>
      {rows.length === 0 && <p className="py-8 text-center text-muted-foreground">Todavía no hay nadie.</p>}
      <ul className="divide-y rounded-3xl bg-card shadow-card">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 px-4 py-3">
            <button onClick={() => setEditing(r)} className="min-w-0 flex-1 text-left">
              <span className="block truncate font-bold">{r.name}{r.age ? `, ${r.age}` : ""}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {r[activeKey] ? (kind === "seniors" ? "Recibe llamadas" : "Disponible") : "En pausa"}
                {r.phone ? ` · ${r.phone}` : ""}
              </span>
            </button>
            {kind === "seniors" && (
              <div className="flex gap-1" role="group" aria-label={`Cómo está ${r.name} hoy`}>
                {MOODS.map((m) => (
                  <button key={m.key} onClick={() => logMood(r.id, m.key)} aria-label={m.label} aria-pressed={moods[r.id] === m.key} title={m.label}
                    className={`grid size-9 place-items-center rounded-full transition ${moods[r.id] === m.key ? m.chip : "bg-muted"}`}>
                    <span className={`size-3 rounded-full ${moods[r.id] === m.key ? "bg-card" : m.dot}`} />
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => remove(r)} aria-label={`Borrar a ${r.name}`} className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive">
              <Trash2 className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowForm({ fields, initial, onCancel, onSave }: { fields: Field[]; initial: Row | null; onCancel: () => void; onSave: (v: Record<string, unknown>) => void }) {
  const [v, setV] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? (f.type === "check" ? true : "")])),
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    const out = { ...v };
    for (const f of fields) if (f.type === "number") out[f.key] = out[f.key] === "" ? null : Number(out[f.key]);
    onSave(out);
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-extrabold">{initial ? `Editar ${initial.name}` : "Nuevo"}</h2>
      {fields.map((f) =>
        f.type === "check" ? (
          <label key={f.key} className="flex h-12 items-center gap-3 font-semibold">
            <input type="checkbox" className="size-6 accent-primary" checked={!!v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.checked })} />
            {f.label}
          </label>
        ) : (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-semibold text-muted-foreground">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea className={`${input} h-24 py-3`} value={String(v[f.key] ?? "")} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
            ) : (
              <input
                className={input}
                type={f.type === "number" ? "number" : "text"}
                required={f.key === "name"}
                min={f.type === "number" ? 0 : undefined}
                max={f.type === "number" ? 120 : undefined}
                maxLength={200}
                value={String(v[f.key] ?? "")}
                onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
              />
            )}
          </label>
        ),
      )}
      <div className="flex gap-3 pt-2">
        <BigButton tone="ghost" onClick={onCancel}>Cancelar</BigButton>
        <BigButton>Guardar</BigButton>
      </div>
    </form>
  );
}

function OrgEditor() {
  const qc = useQueryClient();
  const [v, setV] = useState({ name: "", neighborhood: "", phone: "", email: "" });
  useEffect(() => {
    supabase.from("organization").select("name, neighborhood, phone, email").eq("id", 1).maybeSingle()
      .then(({ data }) => data && setV(data));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("organization").upsert({ id: 1, ...v });
    if (error) { toast.error("No se pudo guardar."); return; }
    toast.success("Guardado");
    qc.invalidateQueries({ queryKey: ["public-data"] });
  }
  const f: [keyof typeof v, string, string][] = [
    ["name", "Nombre de la organización", "text"],
    ["neighborhood", "Barrio", "text"],
    ["phone", "Teléfono", "tel"],
    ["email", "Correo", "email"],
  ];
  return (
    <form onSubmit={submit} className="space-y-4">
      {f.map(([k, l, t]) => (
        <label key={k} className="block">
          <span className="mb-1 block text-sm font-semibold text-muted-foreground">{l}</span>
          <input className={input} type={t} required={k === "name"} maxLength={200} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
        </label>
      ))}
      <BigButton>Guardar</BigButton>
    </form>
  );
}


function LinkRequests() {
  const qc=useQueryClient();
  const [rows,setRows]=useState<{id:string;user_id:string;requested_name:string;relation:string;requested_phone:string|null;requested_age:number|null}[]>([]);
  const [people,setPeople]=useState<{id:string;name:string}[]>([]);
  const [profiles,setProfiles]=useState<{id:string;full_name:string}[]>([]);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  async function load(){ const [r,p,u]=await Promise.all([supabase.from("person_links").select("*").eq("status","pending"),supabase.from("seniors").select("id,name").eq("is_demo",false).eq("active",true),supabase.from("profiles").select("id,full_name")]);setRows(r.data??[]);setPeople(p.data??[]);setProfiles(u.data??[]); }
  useEffect(()=>{void load();},[]);
  async function review(id:string,approve:boolean){setBusy(true);const {data,error}=await supabase.rpc("review_person_link",{_id:id,_senior:selected[id]??"00000000-0000-0000-0000-000000000000",_approve:approve});setBusy(false);if(error||!data){toast.error("No se pudo revisar el vínculo.");return;}toast.success(approve?"Vínculo aprobado":"Solicitud rechazada");void qc.invalidateQueries({queryKey:["people"]});void load();}
  return <section className="mb-5 space-y-3"><h2 className="text-xl font-extrabold">Vínculos por verificar</h2>{!rows.length&&<p className="text-sm text-muted-foreground">Sin solicitudes pendientes.</p>}{rows.map(r=><article key={r.id} className="space-y-3 rounded-2xl border bg-card p-4"><p className="font-bold">{r.requested_name} · {r.relation}</p>{(r.requested_phone || r.requested_age !== null) && <p className="text-sm text-muted-foreground">{[r.requested_age !== null ? `${r.requested_age} años` : "", r.requested_phone].filter(Boolean).join(" · ")}</p>}<p className="text-sm text-muted-foreground">Solicita: {profiles.find(p=>p.id===r.user_id)?.full_name??"Cuenta registrada"}</p><label className="block text-sm font-semibold">Persona verificada<select aria-label={`Persona para ${r.requested_name}`} value={selected[r.id]??""} onChange={e=>setSelected({...selected,[r.id]:e.target.value})} className={`${input} mt-1`}><option value="">Seleccionar persona</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><BigButton size="sm" disabled={busy||!selected[r.id]} onClick={()=>review(r.id,true)}>Aprobar vínculo</BigButton><BigButton size="sm" tone="ghost" disabled={busy} onClick={()=>review(r.id,false)}>Rechazar</BigButton></div></article>)}</section>;
}
function CoordinatorAccess(){
  const [profiles,setProfiles]=useState<{id:string;full_name:string}[]>([]);
  const [approved,setApproved]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  async function load(){const [p,c]=await Promise.all([supabase.from("profiles").select("id,full_name").eq("persona","ong"),supabase.from("coordinators").select("user_id")]);setProfiles(p.data??[]);setApproved((c.data??[]).map(x=>x.user_id));}
  useEffect(()=>{void load();},[]);
  async function toggle(id:string){setBusy(true);const r=approved.includes(id)?await supabase.from("coordinators").delete().eq("user_id",id):await supabase.from("coordinators").insert({user_id:id});setBusy(false);if(r.error){toast.error("No se pudo cambiar el acceso.");return;}void load();}
  return <section className="mb-5 space-y-3"><h2 className="text-xl font-extrabold">Acceso de coordinación</h2>{profiles.map(p=><div key={p.id} className="flex items-center gap-3"><span className="min-w-0 flex-1 font-semibold">{p.full_name}</span><div><BigButton size="sm" tone="ghost" disabled={busy} onClick={()=>toggle(p.id)}>{approved.includes(p.id)?"Revocar":"Autorizar"}</BigButton></div></div>)}</section>;
}
