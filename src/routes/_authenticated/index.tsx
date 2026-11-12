import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  ClipboardList,
  Phone,
  Settings2,
  Plus,
  Users,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { Screen, Segmented, BigButton, btn } from "@/components/oye";
import { AlertCard } from "@/components/alert-card";
import { WellbeingCard } from "@/components/wellbeing-card";
import { PersonGate } from "@/components/person-context";
import { personSearch, usePerson, usePeople } from "@/lib/people";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/lib/auth";
import { MOOD, forVolunteer, minutesWaiting, useAlerts, waitLabel, type Alert } from "@/lib/alerts";
import { VisitActions } from "@/components/visit-actions";
import { PersonAvatar } from "@/components/person-avatar";
import { personDisplayName } from "@/lib/person-presentation";
import { personRequestSchema } from "@/lib/person-request";
import { addPerson } from "@/lib/person.functions";
import { useAllCallLogs, useLatestCallLog } from "@/lib/call-logs";
import { SituationReportCard } from "@/components/situation-report";

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: personSearch,
  head: () => ({
    meta: [
      { title: "OYE · La IA llama. El humano acude." },
      {
        name: "description",
        content:
          "OYE llama cada día a las personas mayores que viven solas. Si algo va mal, avisa a un vecino y a la familia.",
      },
      { property: "og:title", content: "OYE · La IA llama. El humano acude." },
      { property: "og:description", content: "Una llamada al día para mayores que viven solos. Sin app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { profile } = useMe();
  const { sid, person } = usePerson();
  if (sid)
    return (
      <PersonGate>
        <Screen>
          {profile.persona === "voluntario" ? (
            <SelectedVisit />
          ) : (
            person && <FamilyHome senior={personDisplayName(person.name)} relation={person.relation} />
          )}
        </Screen>
      </PersonGate>
    );
  return (
    <Screen>
      <p className="pt-1 text-sm text-muted-foreground">Hola, {profile.full_name.split(" ")[0]}</p>
      {profile.persona === "ong" ? <NgoHome /> : <PeopleSelector />}
    </Screen>
  );
}

function PeopleSelector() {
  const { profile, user } = useMe();
  const navigate = useNavigate();
  const add = useServerFn(addPerson);
  const { data: membership, isPending: checkingDemo } = useQuery({
    queryKey: ["demo-membership", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("demo_members").select("kind").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const immediate = membership?.kind === "familia" || membership?.kind === "ong";
  const { data: people = [], isPending, error } = usePeople();
  const { data: alerts = [] } = useAlerts(true);
  const { data: allCallLogs = [] } = useAllCallLogs();
  const qc = useQueryClient();
  const [tab, setTab] = useState("open");
  const [lastId, setLastId] = useState("");
  useEffect(() => {
    setLastId(sessionStorage.getItem(`oye-person-${user.id}`) ?? "");
  }, [user.id]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [requestError, setRequestError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: requests = [] } = useQuery({
    queryKey: ["links", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("person_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      return data ?? [];
    },
  });
  const volunteer = profile.persona === "voluntario";
  const visits = alerts.filter((a) => a.volunteer_id === user.id);
  const opportunities = alerts
    .filter((a) => a.status === "open")
    .sort(
      (a, b) =>
        Number(b.mood === "no_contesta") - Number(a.mood === "no_contesta") ||
        +new Date(a.created_at) - +new Date(b.created_at)
    );
  const list = volunteer
    ? tab === "open"
      ? opportunities
      : visits
    : [...people].sort((a, b) => {
        const urgent = (id: string) =>
          allCallLogs.some((c) => c.person_id === id && c.status === "urgencia_en_curso") ||
          alerts.some((x) => x.senior_id === id && x.status === "open")
            ? 1
            : 0;
        return urgent(b.id) - urgent(a.id) || a.name.localeCompare(b.name);
      });

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setRequestError("");
    const parsed = personRequestSchema.safeParse({
      requested_name: name,
      relation,
      requested_phone: phone,
      requested_age: age,
    });
    if (!parsed.success) {
      setRequestError(parsed.error.issues[0]?.message ?? "Revise los datos");
      return;
    }
    setBusy(true);
    try {
      if (immediate) {
        const result = await add({ data: parsed.data });
        await qc.invalidateQueries({ queryKey: ["people", user.id] });
        toast.success("Persona añadida correctamente");
        await navigate({ to: "/", search: { sid: result.id } });
      } else {
        const { error } = await supabase.from("person_links").insert({ user_id: user.id, ...parsed.data });
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["links"] });
        toast.success("Solicitud enviada para revisión");
      }
      setAdding(false);
      setName("");
      setRelation("");
      setPhone("");
      setAge("");
    } catch {
      toast.error(immediate ? "No se pudo añadir la persona." : "No se pudo enviar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="mt-1 text-3xl font-extrabold">{volunteer ? "Personas" : "Mis personas"}</h1>
      {volunteer && (
        <div className="mt-3">
          <Segmented
            value={tab}
            onChange={setTab}
            items={[
              { k: "open", l: "Avisos para ti", n: opportunities.length },
              { k: "mine", l: "Mis visitas", n: visits.length },
            ]}
          />
        </div>
      )}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-3">
        {isPending && (
          <p role="status" className="py-8 text-center text-muted-foreground">
            Cargando…
          </p>
        )}
        {error && (
          <p role="alert" className="py-8 text-center text-destructive">
            No se pudieron cargar las personas.
          </p>
        )}
        <ul className="divide-y">
          {list.map((item) => {
            const isAlert = "senior_id" in item;
            const id = isAlert ? item.senior_id : item.id;
            if (!id) return null;
            const label = personDisplayName(isAlert ? item.senior_name : item.name);
            const latestCall = allCallLogs.find((c) => c.person_id === id);
            const latestAlert = isAlert ? item : alerts.find((a) => a.senior_id === id);

            let state = "Sin llamadas";
            if (!isAlert && latestCall) {
              if (latestCall.status === "llamando") state = "Llamando ahora…";
              else if (latestCall.status === "analizando") state = "Analizando llamada…";
              else if (latestCall.status === "urgencia_en_curso") state = "🚨 Urgencia en curso";
              else if (latestCall.status === "completada") {
                const pct = latestCall.global_pct ?? latestCall.report?.global_pct;
                state =
                  latestCall.nivel_alerta === "ROJO"
                    ? "Atención prioritaria"
                    : latestCall.nivel_alerta === "AMARILLO"
                    ? "Agradece compañía"
                    : pct
                    ? `Está bien · ${pct}% Bienestar`
                    : "Está bien";
              } else if (latestCall.status === "no_contesta") state = "Hoy no ha contestado";
              else if (latestCall.status === "rechazada") state = "Hoy pospuso la llamada";
            } else if (latestAlert) {
              state =
                latestAlert.status === "visited"
                  ? "Acompañada"
                  : latestAlert.status === "accepted"
                  ? "En camino"
                  : latestAlert.status === "arrived"
                  ? "De visita"
                  : latestAlert.status === "open"
                  ? "Necesita atención"
                  : "Está bien";
            }

            return (
              <li key={item.id}>
                <Link
                  to="/"
                  search={{ sid: id, aid: isAlert ? item.id : undefined }}
                  onClick={() => sessionStorage.setItem(`oye-person-${user.id}`, id)}
                  className={`tap flex min-h-24 items-center gap-3 py-4 ${lastId === id ? "bg-secondary/30" : ""}`}
                >
                  <PersonAvatar id={id} name={label} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold">{label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {!isAlert && item.relation ? `${item.relation} · ` : ""}
                      {state}
                    </span>
                    {isAlert && (
                      <span className="block text-xs text-muted-foreground">
                        {item.neighborhood} · {waitLabel(minutesWaiting(item.created_at))}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-primary" />
                </Link>
              </li>
            );
          })}
        </ul>
        {!isPending && !error && !list.length && (
          <div className="py-10 text-center">
            <Users className="mx-auto mb-3 size-9 text-primary" />
            <p className="font-bold">
              {volunteer ? "No hay avisos en esta vista" : "Aún no tienes personas vinculadas"}
            </p>
          </div>
        )}
        {!volunteer &&
          !immediate &&
          requests.map((r) => (
            <p key={r.id} className="mt-2 rounded-xl bg-muted p-3 text-sm">
              <b>{r.requested_name}</b> · Pendiente de aprobación
            </p>
          ))}
        {adding && (
          <form onSubmit={request} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">
              Nombre completo
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border bg-card px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Teléfono de la persona
              <input
                type="tel"
                autoComplete="tel"
                required
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border bg-card px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Edad
              <input
                type="number"
                inputMode="numeric"
                required
                min={0}
                max={120}
                step={1}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border bg-card px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Vínculo
              <input
                required
                maxLength={60}
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border bg-card px-3"
              />
            </label>
            {requestError && (
              <p role="alert" className="text-sm text-destructive">
                {requestError}
              </p>
            )}
            <BigButton disabled={busy || checkingDemo}>
              {busy ? "Guardando…" : immediate ? "Guardar" : "Enviar solicitud"}
            </BigButton>
            <BigButton tone="quiet" disabled={busy} onClick={() => setAdding(false)}>
              Cancelar
            </BigButton>
          </form>
        )}
      </div>
      {!volunteer && !adding && (
        <BigButton tone="ghost" disabled={checkingDemo} onClick={() => setAdding(true)}>
          <Plus className="size-5" />
          Añadir persona
        </BigButton>
      )}
    </>
  );
}

function SelectedVisit() {
  const { user } = useMe();
  const { data = [] } = useAlerts();
  const { aid } = Route.useSearch();
  const { data: all = [] } = useAlerts(true);
  const active = all.find((a) => a.volunteer_id === user.id && ["accepted", "arrived"].includes(a.status));
  const alert = data.find((a) => a.id === aid);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {alert ? (
        <AlertCard
          a={alert}
          showTranscript={false}
          actions={<VisitActions a={alert} userId={user.id} busyElsewhere={!!active && active.id !== alert.id} />}
        />
      ) : (
        <p className="py-8 text-center text-muted-foreground">Este aviso ya no está disponible.</p>
      )}
    </div>
  );
}

function CallCta({ label = "Llamar ahora" }: { label?: string }) {
  const { sid } = usePerson();
  return (
    <Link
      to="/llamada"
      search={{ sid }}
      className="tap flex items-center gap-4 rounded-3xl bg-primary p-4 text-primary-foreground shadow-cta"
    >
      <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary">
        <span className="animate-ring absolute inset-0 rounded-full bg-primary-foreground" />
        <Phone className="relative size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold">{label}</span>
        <span className="block text-sm text-primary-foreground/80">Llamada telefónica real · Análisis con IA</span>
      </span>
    </Link>
  );
}

function FamilyHome({ senior, relation }: { senior: string; relation: string }) {
  const { data = [] } = useAlerts();
  const { sid } = usePerson();
  const { data: latestLog } = useLatestCallLog(sid);
  const [showFullScales, setShowFullScales] = useState(false);

  const mine = data.filter((a) => a.senior_id === sid);
  const last = mine[0];

  let title = "Aún no hay llamadas";
  let tone = "bg-muted";
  let statusSubtitle = "";

  if (latestLog) {
    switch (latestLog.status) {
      case "llamando":
        title = `Llamando a ${senior}...`;
        tone = "bg-primary animate-pulse";
        statusSubtitle = "Marcando el teléfono...";
        break;
      case "analizando":
        title = `Analizando la llamada de ${senior}...`;
        tone = "bg-primary animate-pulse";
        statusSubtitle = "Procesando informe con IA...";
        break;
      case "urgencia_en_curso":
        title = `🚨 Urgencia en curso con ${senior}`;
        tone = "bg-destructive animate-ping";
        statusSubtitle = "Alerta crítica detectada durante la llamada";
        break;
      case "completada":
        title = latestLog.report?.home_headline || `${senior} está bien`;
        tone =
          latestLog.nivel_alerta === "ROJO"
            ? "bg-destructive"
            : latestLog.nivel_alerta === "AMARILLO"
            ? "bg-warning"
            : "bg-success";
        statusSubtitle = latestLog.report?.summary || "";
        break;
      case "rechazada":
        title = `Hoy no ha querido hablar`;
        tone = "bg-warning";
        statusSubtitle = "La persona declinó hablar en este momento";
        break;
      case "no_contesta":
        title = `Hoy no ha contestado`;
        tone = "bg-destructive";
        statusSubtitle = latestLog.motivo ? `Motivo: ${latestLog.motivo}` : "Sin respuesta o buzón de voz";
        break;
      case "error":
        title = `No se pudo analizar la llamada`;
        tone = "bg-destructive";
        break;
    }
  } else if (last) {
    title =
      last.status === "visited"
        ? `${senior} está acompañada`
        : last.status === "accepted"
        ? `${last.volunteer_name} va de camino`
        : last.status === "arrived"
        ? `${last.volunteer_name} está con ${senior}`
        : last.status === "open"
        ? last.mood === "no_contesta"
          ? `${senior} no contesta`
          : `${senior} necesita a alguien`
        : `${senior} está bien`;
    tone =
      last.status === "open"
        ? MOOD[last.mood as keyof typeof MOOD]?.dot ?? "bg-warning"
        : last.status === "closed" || last.status === "visited"
        ? "bg-success"
        : "bg-primary";
  }

  const isUrgent = latestLog?.status === "urgencia_en_curso";

  return (
    <div className="space-y-3 pb-3">
      <h1 className="sr-only">Resumen de {senior}</h1>

      {isUrgent && (
        <section className="animate-pulse rounded-3xl border-2 border-destructive bg-destructive/15 p-4 shadow-card">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-7 shrink-0 text-destructive" />
            <div>
              <h2 className="text-lg font-black text-destructive">🚨 Alerta crítica: Urgencia en curso</h2>
              <p className="mt-1 text-xs font-semibold text-foreground">
                Se ha alertado al contacto de confianza y activado el protocolo de cercanía. Contacte inmediatamente con{" "}
                {senior}.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Primary CTA at top for immediate access */}
      <CallCta label={`Llamar a ${senior} ahora`} />

      {/* Render full SituationReportCard when a call log is available */}
      {latestLog ? (
        <div className="space-y-2">
          <SituationReportCard log={latestLog} showExecutiveOnly={!showFullScales} />
          {latestLog.status === "completada" && (
            <button
              type="button"
              onClick={() => setShowFullScales((v) => !v)}
              className="tap flex w-full items-center justify-center gap-1.5 rounded-2xl bg-secondary/80 py-2.5 text-xs font-bold text-primary hover:bg-secondary"
            >
              <span>
                {showFullScales
                  ? "Ocultar escalas geriátricas detalladas (UCLA-3, Yesavage, Autocuidado)"
                  : "Ver escalas geriátricas detalladas (UCLA-3, Yesavage, Autocuidado)"}
              </span>
              <ChevronDown className={`size-4 transition-transform ${showFullScales ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      ) : (
        <section aria-live="polite" className="rounded-3xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className={`size-4 shrink-0 rounded-full ${tone}`} />
            <h2 className="text-xl font-extrabold leading-tight">{title}</h2>
          </div>
          {statusSubtitle && <p className="mt-1.5 text-sm text-foreground/90">{statusSubtitle}</p>}
          {last && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {new Date(last.created_at).toLocaleString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>
      )}

      <WellbeingCard senior={senior} seniorId={sid} compact />

      <Link to="/persona" search={{ sid }} className="tap flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
          <ClipboardList className="size-5 text-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-primary">
            Ficha de {senior} {relation ? `(${relation})` : ""}
          </span>
          <span className="block text-xs text-muted-foreground">Contacto con llave, medicación, citas y evolución de soledad</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>
    </div>
  );
}

const waited = (a: Alert) => Math.round((Date.now() - new Date(a.created_at).getTime()) / 60000);
const URGENT_MIN = 30;

function NgoHome() {
  const [choosing, setChoosing] = useState(false);
  const { data: people = [] } = usePeople();
  const { data = [] } = useAlerts();
  const { user } = useMe();
  const [tab, setTab] = useState<"open" | "accepted" | "visited">("open");
  const today = data.filter((a) => new Date(a.created_at).toDateString() === new Date().toDateString());
  const open = data
    .filter((a) => a.status === "open")
    .sort(
      (x, y) =>
        Number(y.mood === "no_contesta") - Number(x.mood === "no_contesta") ||
        +new Date(x.created_at) - +new Date(y.created_at)
    );
  const accepted = data.filter((a) => a.status === "accepted" || a.status === "arrived");
  const visited = today.filter((a) => a.status === "visited");
  const active = data.find((a) => a.volunteer_id === user.id && (a.status === "accepted" || a.status === "arrived"));
  const urgent = open.filter((a) => waited(a) >= URGENT_MIN || a.mood === "no_contesta").length;
  const tabs = [
    { k: "open" as const, l: "Sin atender", n: open.length },
    { k: "accepted" as const, l: "En camino", n: accepted.length },
    { k: "visited" as const, l: "Hechas hoy", n: visited.length },
  ];
  const list = tab === "open" ? open : tab === "accepted" ? accepted : visited;
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Panel de avisos</h1>
        <div className="flex gap-2">
          <BigButton size="sm" tone="ghost" onClick={() => setChoosing(!choosing)}>
            <Users className="size-5" />
            Personas
          </BigButton>
          <Link
            to="/admin"
            aria-label="Administrar datos"
            className="grid size-11 place-items-center rounded-full bg-secondary text-primary"
          >
            <Settings2 className="size-5" />
          </Link>
        </div>
      </div>
      {choosing && (
        <div className="mt-3 max-h-48 overflow-y-auto">
          {people.map((p) => (
            <Link
              key={p.id}
              to="/"
              search={{ sid: p.id }}
              className="tap flex min-h-12 items-center gap-3 border-b py-2 font-semibold"
            >
              <PersonAvatar id={p.id} name={p.name} small />
              <span className="min-w-0 flex-1 truncate">{personDisplayName(p.name)}</span>
              <ChevronRight className="size-5" />
            </Link>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{today.length} llamadas hoy</p>
      {urgent > 0 && (
        <p role="alert" className="mt-3 rounded-2xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">
          {urgent} {urgent === 1 ? "aviso urgente" : "avisos urgentes"}: nadie ha acudido aún. Asigne a alguien o vaya
          usted.
        </p>
      )}
      <div className="mt-3">
        <Segmented value={tab} onChange={setTab} items={tabs.map((t) => ({ ...t, alert: t.k === "open" }))} />
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {list.map((a) => (
          <div key={a.id}>
            {a.status === "open" && (
              <p
                className={`mb-1 px-2 text-xs font-bold ${
                  waited(a) >= URGENT_MIN || a.mood === "no_contesta" ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                Esperando {waited(a) < 60 ? `${waited(a)} min` : `${Math.round(waited(a) / 60)} h`}
                {a.mood === "no_contesta" ? " · No contesta: la ONG debe ir" : ""}
              </p>
            )}
            <Link
              to="/"
              search={{ sid: a.senior_id ?? undefined }}
              className="tap mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary"
            >
              Ver persona
              <ChevronRight className="size-4" />
            </Link>
            <AlertCard
              a={a}
              showTranscript={false}
              actions={<VisitActions a={a} userId={user.id} busyElsewhere={!!active} />}
            />
          </div>
        ))}
        {!list.length && (
          <div className="space-y-3 pt-4 text-center">
            <p className="text-muted-foreground">
              {tab === "open"
                ? "Ningún aviso sin atender. ¡Buen trabajo!"
                : tab === "accepted"
                ? "Nadie en camino ahora."
                : "Aún no hay visitas hoy."}
            </p>
            {tab === "open" && (
              <BigButton tone="ghost" onClick={() => setChoosing(true)}>
                Elegir persona para llamar
              </BigButton>
            )}
          </div>
        )}
      </div>
    </>
  );
}
