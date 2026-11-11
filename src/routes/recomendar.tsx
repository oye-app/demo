import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Check, Copy, MessageCircle } from "lucide-react";
import { BigButton, Screen, btn } from "@/components/oye";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  tipo: z.enum(["mayor", "voluntario"]).optional(),
  ref: z.string().max(12).optional(),
});

export const Route = createFileRoute("/recomendar")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Recomiende a un vecino mayor · OYE" },
      { name: "description", content: "¿Conoce a alguien mayor que vive solo? Recomiéndelo a OYE en un minuto, o hágase voluntario de su barrio." },
      { property: "og:title", content: "Recomiende a un vecino mayor · OYE" },
      { property: "og:description", content: "Una llamada al día para quien vive solo. Recomiéndelo en un minuto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recommend,
});

const RELATIONS = ["Mi madre o padre", "Mi abuela o abuelo", "Un vecino o vecina"] as const;

const seniorSchema = z.object({
  person_name: z.string().trim().min(2, "Escriba su nombre").max(100),
  person_age: z.number().int().min(50).max(120).nullable(),
  person_phone: z.string().trim().min(6, "Escriba un teléfono").max(30).regex(/^[0-9+\s()-]+$/, "Solo números"),
  referrer_name: z.string().trim().min(2, "Escriba su nombre").max(100),
  referrer_phone: z.string().trim().max(30).regex(/^[0-9+\s()-]*$/, "Solo números"),
});
const volunteerSchema = z.object({
  person_name: z.string().trim().min(2, "Escriba su nombre").max(100),
  person_phone: z.string().trim().min(6, "Escriba un teléfono").max(30).regex(/^[0-9+\s()-]+$/, "Solo números"),
  neighborhood: z.string().trim().min(2, "¿En qué barrio vive?").max(100),
});

function myCode() {
  let c = localStorage.getItem("oye-ref");
  if (!c) {
    c = Math.random().toString(36).slice(2, 8).toUpperCase();
    localStorage.setItem("oye-ref", c);
  }
  return c;
}

const field =
  "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function Recommend() {
  const { tipo = "mayor", ref = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/recomendar" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [relation, setRelation] = useState<string>(RELATIONS[0]);
  const [consent, setConsent] = useState(false);
  const [v, setV] = useState({ person_name: "", person_age: "", person_phone: "", referrer_name: "", referrer_phone: "", neighborhood: "" });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  useEffect(() => { setDone(false); setError(""); }, [tipo]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!consent) return setError(tipo === "mayor" ? "Confirme que la persona está de acuerdo." : "Acepte para continuar.");
    const parsed =
      tipo === "mayor"
        ? seniorSchema.safeParse({ ...v, person_age: v.person_age ? Number(v.person_age) : null })
        : volunteerSchema.safeParse(v);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Revise los datos");
    setBusy(true);
    const { error: err } = await supabase.from("referrals").insert({
      ...parsed.data,
      kind: tipo === "mayor" ? "senior" : "volunteer",
      relation: tipo === "mayor" ? relation : "",
      referrer_code: myCode(),
      via_code: ref,
      consent: true,
    });
    setBusy(false);
    if (err) return setError("No se pudo enviar. Inténtelo de nuevo.");
    setDone(true);
  }

  if (done) return <Thanks tipo={tipo} name={v.person_name.split(" ")[0] ?? ""} />;

  return (
    <Screen
      title={tipo === "mayor" ? "Recomendar" : "Ser voluntario"}
      footer={
        <div className="space-y-2">
          {error && <p role="alert" className="text-center text-sm font-semibold text-destructive">{error}</p>}
          <BigButton onClick={() => (document.getElementById("rec-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>
            {busy ? "Enviando…" : "Enviar"}
          </BigButton>
        </div>
      }
    >
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(["mayor", "voluntario"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tipo === t}
            onClick={() => navigate({ search: (p) => ({ ...p, tipo: t }) })}
            className={`h-10 rounded-xl text-sm font-bold transition ${tipo === t ? "bg-card text-primary shadow-card" : "text-secondary-foreground"}`}
          >
            {t === "mayor" ? "Recomendar a un mayor" : "Quiero ayudar"}
          </button>
        ))}
      </div>

      <form id="rec-form" onSubmit={submit} className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
        {tipo === "mayor" ? (
          <>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="¿Quién es?">
              {RELATIONS.map((r) => (
                <button type="button" key={r} role="radio" aria-checked={relation === r} onClick={() => setRelation(r)}
                  className={`tap rounded-full px-3.5 py-2 text-sm font-semibold ${relation === r ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_5.5rem] gap-2.5">
              <input className={field} placeholder="Nombre de la persona mayor" aria-label="Nombre de la persona mayor" value={v.person_name} onChange={set("person_name")} maxLength={100} />
              <input className={field} placeholder="Edad" aria-label="Edad" inputMode="numeric" value={v.person_age} onChange={set("person_age")} maxLength={3} />
            </div>
            <input className={field} placeholder="Teléfono de la persona mayor" aria-label="Teléfono de la persona mayor" inputMode="tel" value={v.person_phone} onChange={set("person_phone")} maxLength={30} />
            <p className="pt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sus datos</p>
            <input className={field} placeholder="Su nombre" aria-label="Su nombre" value={v.referrer_name} onChange={set("referrer_name")} maxLength={100} />
            <input className={field} placeholder="Su teléfono (opcional)" aria-label="Su teléfono" inputMode="tel" value={v.referrer_phone} onChange={set("referrer_phone")} maxLength={30} />
          </>
        ) : (
          <>
            <p className="text-muted-foreground">Le avisaremos cuando un vecino quiera compañía. Usted decide.</p>
            <input className={field} placeholder="Su nombre" aria-label="Su nombre" value={v.person_name} onChange={set("person_name")} maxLength={100} />
            <input className={field} placeholder="Su móvil" aria-label="Su móvil" inputMode="tel" value={v.person_phone} onChange={set("person_phone")} maxLength={30} />
            <input className={field} placeholder="Su barrio" aria-label="Su barrio" value={v.neighborhood} onChange={set("neighborhood")} maxLength={100} />
          </>
        )}
        <label className="mt-1 flex items-start gap-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          {tipo === "mayor"
            ? "La persona sabe que la recomiendo y está de acuerdo en que la ONG la llame."
            : "Acepto que la ONG me contacte. Mis datos solo se usan para OYE."}
        </label>
        {ref && <p className="text-center text-xs text-muted-foreground">Le ha invitado un vecino · código {ref}</p>}
      </form>
    </Screen>
  );
}

function Thanks({ tipo, name }: { tipo: "mayor" | "voluntario"; name: string }) {
  const [code, setCode] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const c = myCode();
    setCode(c);
    supabase.rpc("referral_count", { _code: c }).then(({ data }) => setCount(data ?? 0));
  }, []);
  const link = typeof window !== "undefined" ? `${window.location.origin}/recomendar?ref=${code}` : "";
  const msg = `Yo me he apuntado a OYE: llaman cada día a mayores que viven solos y, si algo va mal, va un vecino. ¿Conoces a alguien? ${link}`;

  return (
    <Screen title="¡Gracias!">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="grid size-20 place-items-center rounded-full bg-success text-success-foreground animate-rise"><Check className="size-10" /></span>
        <h1 className="mt-5 text-3xl font-extrabold leading-tight">
          {tipo === "mayor" ? `La ONG llamará a ${name || "su familiar"}` : "Ya es parte del barrio"}
        </h1>
        <p className="mt-2 max-w-xs text-muted-foreground">
          {tipo === "mayor" ? "En 48 h le llamarán. Es gratis." : "La ONG le llamará para conocerle."}
        </p>
        <div className="mt-6 w-full rounded-3xl bg-card p-5 shadow-card">
          <p className="font-bold">Cada vecino que invita suma</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Su cadena de vecinos: <strong className="text-primary">{count ?? "…"}</strong> {count === 1 ? "recomendación" : "recomendaciones"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"
              className={btn("success","sm")}>
              <MessageCircle className="size-5" /> WhatsApp
            </a>
            <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}
              className={btn("ghost","sm")}>
              {copied ? <Check className="size-5" /> : <Copy className="size-5" />} {copied ? "Copiado" : "Copiar enlace"}
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
