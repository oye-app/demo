import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pill, CalendarDays, Cake, HeartHandshake, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BigButton, Screen, Segmented } from "@/components/oye";
import { WellbeingCard } from "@/components/wellbeing-card";
import { PersonGate } from "@/components/person-context";
import { personSearch, usePerson } from "@/lib/people";
import { useMe } from "@/lib/auth";
import { lonelyLabel, timeAgo, useAlerts } from "@/lib/alerts";
import { useAllCallLogs } from "@/lib/call-logs";
import { supabase } from "@/integrations/supabase/client";
import { personDisplayName } from "@/lib/person-presentation";

export const Route = createFileRoute("/_authenticated/persona")({
  validateSearch: personSearch,
  head: () => ({
    meta: [
      { title: "Ficha de la persona · OYE" },
      { name: "description", content: "Agenda, contacto con llave y medida de soledad de cada persona mayor." },
      { property: "og:title", content: "Ficha de la persona · OYE" },
      { property: "og:description", content: "Lo que OYE necesita saber para cuidar mejor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PersonGate privateData>
      <PersonPage />
    </PersonGate>
  ),
});

function PersonPage() {
  const { person, sid } = usePerson();
  const [tab, setTab] = useState<"agenda" | "soledad">("agenda");
  const name = person?.name ?? "";
  return (
    <Screen title="Ficha de la persona">
      <Segmented
        value={tab}
        onChange={setTab}
        items={[
          { k: "agenda", l: "Agenda y llave" },
          { k: "soledad", l: "Soledad y ánimo" },
        ]}
      />
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {name ? <WellbeingCard senior={personDisplayName(name)} seniorId={sid} /> : null}
        {!name ? (
          <p className="pt-10 text-center text-muted-foreground">Aún no hay personas. Haga una primera llamada.</p>
        ) : tab === "agenda" ? (
          <Agenda key={sid} name={name} seniorId={sid ?? ""} />
        ) : (
          <Loneliness key={sid} name={personDisplayName(name)} seniorId={sid} />
        )}
      </div>
    </Screen>
  );
}

function Agenda({ name, seniorId }: { name: string; seniorId: string }) {
  const { user } = useMe();
  const qc = useQueryClient();
  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ["care", user.id, seniorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("senior_care")
        .select("*")
        .eq("senior_id", seniorId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState({
    key_contact_name: "",
    key_contact_phone: "",
    meds: "",
    appointments: "",
    birthday: "",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const empty = { key_contact_name: "", key_contact_phone: "", meds: "", appointments: "", birthday: "" };
  const baseline = data
    ? {
        key_contact_name: data.key_contact_name,
        key_contact_phone: data.key_contact_phone,
        meds: data.meds,
        appointments: data.appointments,
        birthday: data.birthday,
      }
    : empty;
  const dirty = JSON.stringify(f) !== JSON.stringify(baseline) && !saved;
  const blocker = useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: dirty, withResolver: true });
  useEffect(() => {
    if (data)
      setF({
        key_contact_name: data.key_contact_name,
        key_contact_phone: data.key_contact_phone,
        meds: data.meds,
        appointments: data.appointments,
        birthday: data.birthday,
      });
  }, [data]);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (f.key_contact_phone && !/^[+()\d\s-]{7,24}$/.test(f.key_contact_phone)) {
      toast.error("Revise el teléfono del contacto.");
      return;
    }
    setBusy(true);
    const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim().slice(0, 300)])) as typeof f;
    const { error } = data
      ? await supabase.from("senior_care").update(clean).eq("id", data.id)
      : await supabase.from("senior_care").insert({ ...clean, senior_id: seniorId, senior_name: name, created_by: user.id });
    setBusy(false);
    if (error) {
      toast.error("No se pudo guardar. Inténtelo otra vez.");
      return;
    }
    toast.success("Guardado. OYE lo tendrá en cuenta en la próxima llamada.");
    setSaved(true);
    await qc.invalidateQueries({ queryKey: ["care", user.id, seniorId] });
    if (blocker.status === "blocked") blocker.proceed();
  }

  const field = (k: keyof typeof f, label: string, ph: string, Icon: typeof Pill, type = "text") => (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {label}
      </span>
      <input
        type={type}
        value={f[k]}
        onChange={(e) => {
          setSaved(false);
          setF({ ...f, [k]: e.target.value });
        }}
        placeholder={ph}
        className="h-12 w-full rounded-xl border bg-card px-3 text-base outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );

  if (loadError)
    return (
      <p role="alert" className="text-destructive">
        No se pudo cargar la ficha. Vuelve a intentarlo desde Inicio.
      </p>
    );
  if (isLoading) return <p className="pt-10 text-center text-muted-foreground">Cargando…</p>;

  return (
    <form onSubmit={save} className="space-y-3">
      <section className="space-y-3 rounded-3xl bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">Si {personDisplayName(name)} no contesta, ¿quién tiene llave?</p>
        {field("key_contact_name", "Contacto con llave", "Ej.: Rosa, vecina del 2.º", KeyRound)}
        {field("key_contact_phone", "Teléfono del contacto", "600 000 000", KeyRound, "tel")}
      </section>
      <section className="space-y-3 rounded-3xl bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">Lo que OYE recordará en la llamada</p>
        {field("meds", "Medicación", "Ej.: tensión por la mañana", Pill)}
        {field("appointments", "Citas", "Ej.: médico el jueves 10:00", CalendarDays)}
        {field("birthday", "Cumpleaños", "Ej.: 14 de marzo", Cake)}
      </section>
      {blocker.status === "blocked" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cambios sin guardar"
          className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-5"
        >
          <div className="w-full max-w-sm space-y-3 rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-xl font-bold">Cambios sin guardar</h2>
            <BigButton disabled={busy} onClick={() => void save()}>
              Guardar y salir
            </BigButton>
            <BigButton tone="ghost" onClick={() => blocker.proceed()}>
              Descartar
            </BigButton>
            <BigButton tone="quiet" onClick={() => blocker.reset()}>
              Seguir editando
            </BigButton>
          </div>
        </div>
      )}
      <BigButton disabled={busy}>{busy ? "Guardando…" : "Guardar"}</BigButton>
    </form>
  );
}

function Loneliness({ name, seniorId }: { name: string; seniorId?: string }) {
  const { data: callLogs = [] } = useAllCallLogs(seniorId);
  const { data: alerts = [] } = useAlerts();

  const fromLogs = callLogs
    .filter((l) => l.status === "completada")
    .map((l) => {
      const est = Number(l.report?.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada ?? 3);
      return {
        score: Number.isFinite(est) && est >= 3 ? est : 3,
        at: l.created_at,
        evidence: l.report?.evaluacion_escalas?.soledad_ucla?.evidencia_escuchada,
      };
    });

  const fromAlerts = alerts
    .filter((a) => a.loneliness_score != null)
    .flatMap((a) =>
      a.loneliness_score == null ? [] : [{ score: a.loneliness_score, at: a.created_at, evidence: a.summary }]
    );

  const scored = (fromLogs.length > 0 ? fromLogs : fromAlerts).slice(0, 8);
  const last = scored[0];
  const first = scored.length > 1 ? scored[scored.length - 1] : undefined;
  const max = Math.max(...scored.map((s) => s.score), 9);

  return (
    <div className="space-y-3">
      <section className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <HeartHandshake className="size-5 text-primary" />
          <h2 className="font-extrabold">Cómo se siente {name}</h2>
        </div>
        {last ? (
          <>
            <p className="mt-2 text-2xl font-extrabold">
              {lonelyLabel(last.score)}{" "}
              <span className="text-base font-semibold text-muted-foreground">· {last.score}/9 (UCLA-3)</span>
            </p>
            {last.evidence && <p className="mt-1 text-xs italic text-muted-foreground">{last.evidence}</p>}
            {first && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {last.score < first.score
                  ? `Ha mejorado ${first.score - last.score} puntos desde la primera llamada`
                  : last.score > first.score
                  ? "Ha empeorado: conviene más visitas"
                  : "Se mantiene estable en las últimas llamadas"}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Aún sin medir. La IA la calcula en la próxima llamada.</p>
        )}
      </section>
      {scored.length > 1 && (
        <section className="rounded-3xl bg-card p-4 shadow-card" aria-label="Evolución de la soledad">
          <p className="mb-3 text-sm font-semibold">Evolución por llamada (escala UCLA-3 · menor es mejor)</p>
          <div className="flex h-24 items-end gap-2">
            {[...scored].reverse().map((s, i) => (
              <div
                key={i}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
                title={`${s.score}/9 · ${timeAgo(s.at)}`}
              >
                <span className="text-[10px] font-bold text-muted-foreground">{s.score}/9</span>
                <span
                  className={`w-full rounded-t-md ${s.score >= 6 ? "bg-warning" : "bg-success"}`}
                  style={{ height: `${Math.max(25, (s.score / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
      <p className="flex gap-2 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          La IA la calcula de forma orientativa en cada llamada escuchando cómo habla {name}. Escala UCLA-3 (3 a 9): 3–5 sin riesgo de soledad; 6–9 requiere mayor acompañamiento.
        </span>
      </p>
    </div>
  );
}
