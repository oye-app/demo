import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Building2, HandHeart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { BigButton, OyeLogo, btn } from "@/components/oye";
import { useServerFn } from "@tanstack/react-start";
import { demoAccess } from "@/lib/demo.functions";
import { meQuery, PERSONAS, type Persona } from "@/lib/auth";
import img1 from "@/assets/onb-1.jpg";
import img2 from "@/assets/onb-2.jpg";
import img3 from "@/assets/onb-3.jpg";

const search = z.object({ paso: z.enum(["intro", "acceso", "perfil"]).optional() });

export const Route = createFileRoute("/bienvenida")({
  ssr: false,
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Bienvenido a OYE" },
      { name: "description", content: "La IA llama cada día a mayores que viven solos. El humano acude. Entre y díganos quién es." },
      { property: "og:title", content: "Bienvenido a OYE" },
      { property: "og:description", content: "La IA llama. El humano acude." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const SLIDES = [
  { title: "OYE llama cada día", text: "Una llamada amable a quien vive solo. Solo tiene que contestar.", img: img1, alt: "Una mujer mayor sonríe hablando por teléfono en su cocina", pos: "50% 25%" },
  { title: "Un vecino acude", text: "Si nota soledad o tristeza, avisa a un voluntario cercano.", img: img2, alt: "Una vecina visita a un hombre mayor en la puerta de su casa", pos: "50% 30%" },
  { title: "Usted, tranquilo", text: "La familia recibe un resumen de cada llamada en el móvil.", img: img3, alt: "Una mujer sonríe al leer un mensaje en su móvil", pos: "50% 30%" },
];

const field =
  "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Welcome() {
  const { paso = "intro" } = Route.useSearch();
  const navigate = useNavigate({ from: "/bienvenida" });
  const go = (p: "intro" | "acceso" | "perfil") => navigate({ search: { paso: p }, replace: true });
  const qc = useQueryClient();

  // Route the visitor to the right step from their session state.
  useEffect(() => {
    const check = async () => {
      const me = await qc.fetchQuery({ ...meQuery, staleTime: 0 });
      if (me.user && me.profile && paso !== "perfil") navigate({ to: "/" });
      else if (me.user && paso !== "perfil") go("perfil");
    };
    check();
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") { qc.invalidateQueries({ queryKey: ["me"] }); check(); }
    });
    return () => data.subscription.unsubscribe();
  }, [paso]);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-5 pt-4 pb-6">
      <header className="flex h-12 shrink-0 items-center justify-between">
        <OyeLogo className="text-primary" />
        {paso === "intro" && <button onClick={() => go("acceso")} className="tap h-11 rounded-2xl px-4 text-base font-bold text-muted-foreground hover:bg-muted">Saltar</button>}
      </header>
      {paso === "intro" && <Intro onDone={() => go("acceso")} />}
      {paso === "acceso" && <Access />}
      {paso === "perfil" && <ProfileForm onDone={async () => { await qc.invalidateQueries({ queryKey: ["me"] }); navigate({ to: "/" }); }} />}
    </div>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i]!;
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-3xl bg-secondary">
        {SLIDES.map((x, k) => (
          <img key={k} src={x.img} alt={x.alt} width={832} height={1024} style={{ objectPosition: x.pos }}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${k === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      <div key={i} className="animate-rise pt-6">
        <p className="text-sm font-bold text-primary">{i + 1} de {SLIDES.length}</p>
        <h1 className="mt-1 text-4xl leading-tight font-extrabold">{s.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{s.text}</p>
      </div>
      <div className="flex items-center justify-between pt-6">
        <div className="flex gap-2" role="tablist" aria-label="Pasos">
          {SLIDES.map((_, k) => (
            <button key={k} role="tab" aria-selected={k === i} aria-label={`Paso ${k + 1}`} onClick={() => setI(k)}
              className={`h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-primary" : "w-2.5 bg-border"}`} />
          ))}
        </div>
        <div className="w-40">
          <BigButton onClick={() => (i < SLIDES.length - 1 ? setI(i + 1) : onDone())}>{i < SLIDES.length - 1 ? "Siguiente" : "Empezar"}</BigButton>
        </div>
      </div>
    </main>
  );
}

function Access() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/bienvenida` } });
    setBusy(false);
    if (r.error) return setMsg({ ok: false, text: mode === "in" ? "Correo o contraseña incorrectos." : "No se pudo crear la cuenta. ¿Ya tiene una?" });
    if (mode === "up" && !r.data.session) setMsg({ ok: true, text: "Le hemos enviado un correo. Ábralo para confirmar su cuenta y vuelva aquí." });
  }
  const demo = useServerFn(demoAccess);
  async function quick(persona: Persona) {
    setBusy(true); setMsg(null);
    try {
      const c = await demo({ data: { persona } });
      const r = await supabase.auth.signInWithPassword(c);
      if (r.error) throw r.error;
    } catch { setMsg({ ok: false, text: "No se pudo abrir la demo. Inténtelo otra vez." }); }
    setBusy(false);
  }
  async function social(p: "google") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: `${window.location.origin}/bienvenida` });
    if (r.error) setMsg({ ok: false, text: "No se pudo entrar. Inténtelo otra vez." });
  }

  return (
    <main className="flex flex-1 flex-col justify-center">
      <h1 className="text-3xl font-extrabold">{mode === "up" ? "Cree su cuenta" : "Bienvenido de nuevo"}</h1>
      <p className="mt-1 text-muted-foreground">Tarda menos de un minuto.</p>
      <div className="mt-5 rounded-2xl bg-secondary p-3">
        <p className="text-sm font-bold text-secondary-foreground">Probar ya, sin registro</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.keys(PERSONAS) as Persona[]).map((k) => { const I = ICONS[k]; return (
            <button key={k} disabled={busy} onClick={() => quick(k)} className="tap flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-sm font-bold shadow-card disabled:opacity-60">
              <I className="size-6 text-primary" />{k === "familia" ? "Familia" : k === "voluntario" ? "Voluntario" : "ONG"}
            </button>
          ); })}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <BigButton tone="ghost" onClick={() => social("google")}>Continuar con Google</BigButton>
        <div className="py-1 text-center text-sm text-muted-foreground">o con su correo</div>
        <form onSubmit={submit} className="space-y-3">
          <input className={field} type="email" required autoComplete="email" placeholder="Correo" aria-label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Contraseña (mín. 6)" aria-label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          {msg && <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
          <BigButton disabled={busy}>{busy ? "Un momento…" : mode === "up" ? "Crear cuenta" : "Entrar"}</BigButton>
        </form>
        <button onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(null); }} className={btn("quiet","sm")}>
          {mode === "up" ? "Ya tengo cuenta" : "Soy nuevo: crear cuenta"}
        </button>
      </div>
    </main>
  );
}

const ICONS: Record<Persona, typeof Users> = { familia: Users, voluntario: HandHeart, ong: Building2 };
const RELATIONS = ["Madre", "Padre", "Abuela", "Abuelo", "Vecino/a"];

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Escriba su nombre").max(100),
  phone: z.string().trim().max(30).regex(/^[0-9+\s()-]*$/, "Teléfono: solo números"),
  neighborhood: z.string().trim().max(100),
  senior_name: z.string().trim().max(100),
});

function ProfileForm({ onDone }: { onDone: () => void }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [v, setV] = useState({ full_name: "", phone: "", neighborhood: "", senior_name: "" });
  const [relation, setRelation] = useState("Madre");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: u }) => {
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (!data) {
        const meta = u.user.user_metadata as { full_name?: string; name?: string };
        setV((x) => ({ ...x, full_name: meta.full_name ?? meta.name ?? "" }));
        return;
      }
      setPersona(data.persona as Persona);
      setV({ full_name: data.full_name, phone: data.phone, neighborhood: data.neighborhood, senior_name: data.senior_name });
      if (data.senior_relation) setRelation(data.senior_relation);
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const p = profileSchema.safeParse(v);
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Revise los datos");
    if (persona === "familia" && p.data.senior_name.length < 2) return setErr("¿Cómo se llama su familiar?");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !persona) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: u.user.id, persona, ...p.data,
      senior_relation: persona === "familia" ? relation : "",
      senior_name: persona === "familia" ? p.data.senior_name : "",
    });
    setBusy(false);
    if (error) return setErr("No se pudo guardar. Inténtelo otra vez.");
    if(persona==="familia") { const {data:existing}=await supabase.from("person_links").select("id").eq("user_id",u.user.id).eq("requested_name",p.data.senior_name).limit(1); if(!existing?.length){const {error:requestError}=await supabase.from("person_links").insert({user_id:u.user.id,requested_name:p.data.senior_name,relation});if(requestError)return setErr("Perfil guardado. Solicite el vínculo desde Inicio.");} }
    onDone();
  }

  if (!persona) {
    return (
      <main className="flex flex-1 flex-col justify-center">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Paso final</p>
        <h1 className="mt-1 text-3xl font-extrabold">¿Quién es usted?</h1>
        <p className="mt-1 text-muted-foreground">Así le mostramos solo lo que necesita.</p>
        <div className="mt-6 space-y-3">
          {(Object.keys(PERSONAS) as Persona[]).map((k) => { const I = ICONS[k]; return (
            <button key={k} onClick={() => setPersona(k)} className="tap flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-card hover:bg-secondary">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><I className="size-6" /></span>
              <span><span className="block text-lg font-bold">{PERSONAS[k].label}</span><span className="block text-sm text-muted-foreground">{PERSONAS[k].hint}</span></span>
            </button>
          ); })}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <button onClick={() => setPersona(null)} className="tap h-11 self-start rounded-2xl px-3 text-base font-bold text-primary hover:bg-secondary">← Cambiar</button>
      <h1 className="text-3xl font-extrabold">Encantados</h1>
      <p className="mt-1 text-muted-foreground">{PERSONAS[persona].label}. Cuéntenos un poco más.</p>
      <form onSubmit={submit} className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <input className={field} placeholder="Su nombre" aria-label="Su nombre" maxLength={100} value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} />
        <input className={field} placeholder="Su móvil (para avisos)" aria-label="Su móvil" inputMode="tel" maxLength={30} value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
        <input className={field} placeholder={persona === "ong" ? "Nombre de la ONG o barrio" : "Su barrio"} aria-label="Barrio" maxLength={100} value={v.neighborhood} onChange={(e) => setV({ ...v, neighborhood: e.target.value })} />
        {persona === "familia" && (
          <>
            <p className="pt-2 text-sm font-semibold text-muted-foreground">¿A quién acompaña OYE?</p>
            <div className="flex flex-wrap gap-2">
              {RELATIONS.map((r) => (
                <button type="button" key={r} onClick={() => setRelation(r)} aria-pressed={relation === r}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${relation === r ? "bg-primary text-primary-foreground" : "bg-card shadow-card"}`}>{r}</button>
              ))}
            </div>
            <input className={field} placeholder="Su nombre (p. ej. Carmen)" aria-label="Nombre de su familiar" maxLength={100} value={v.senior_name} onChange={(e) => setV({ ...v, senior_name: e.target.value })} />
          </>
        )}
        <div className="mt-auto space-y-2 pt-3">
          {err && <p role="alert" className="text-center text-sm font-semibold text-destructive">{err}</p>}
          <BigButton disabled={busy}>{busy ? "Guardando…" : "Entrar en OYE"}</BigButton>
        </div>
      </form>
    </main>
  );
}
