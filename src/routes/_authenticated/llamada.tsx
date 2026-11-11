import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bell, Brain, Check, HandHeart, Phone, PhoneOff, Sparkles, Users, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";
import { BigButton, Screen } from "@/components/oye";
import { PersonGate } from "@/components/person-context";
import { personSearch, usePerson } from "@/lib/people";
import { useMe } from "@/lib/auth";
import { SCENARIOS, type ScenarioKey } from "@/lib/scenarios";
import { analyzeCall, startCall, type CallAnalysis } from "@/lib/call.functions";
import { MOOD, NEED, lonelyLabel, sameSenior, timeAgo, useAlerts } from "@/lib/alerts";
import { AutoCall } from "@/components/auto-call";
import { AlertTimeline } from "@/components/alert-timeline";
import { personDisplayName } from "@/lib/person-presentation";
import { useLatestCallLog } from "@/lib/call-logs";
import { SituationReportCard } from "@/components/situation-report";

export const Route = createFileRoute("/_authenticated/llamada")({
  validateSearch: personSearch,
  head: () => ({
    meta: [
      { title: "La llamada de OYE" },
      { name: "description", content: "Escuche cómo llama OYE, cómo la IA entiende la conversación y a quién avisa." },
      { property: "og:title", content: "La llamada de OYE" },
      { property: "og:description", content: "La IA llama, entiende y avisa a vecinos y familia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PersonGate privateData><Call /></PersonGate>,
});

type SimPhase = "pick" | "ringing" | "talking" | "think" | "done" | "error";

const TALK_STEPS = ["OYE saluda y pregunta cómo está", "Escucha con atención", "Pregunta por su día y su ánimo", "Se despide hasta mañana"];

function Call() {
  const { user } = useMe();
  const { person, sid } = usePerson();
  const name = personDisplayName(person?.name ?? "");
  const [mode, setMode] = useState<"idle" | "real" | "sim">("idle");
  const [simPhase, setSimPhase] = useState<SimPhase>("pick");
  const [elapsed, setElapsed] = useState(0);
  const [talkStep, setTalkStep] = useState(0);
  const [simResult, setSimResult] = useState<CallAnalysis | null>(null);
  const [simError, setSimError] = useState("");
  const [callingReal, setCallingReal] = useState(false);

  const analyze = useServerFn(analyzeCall);
  const triggerOutbound = useServerFn(startCall);
  const linesRef = useRef(SCENARIOS.bien.lines("Carmen"));
  const { data: all = [] } = useAlerts();
  const past = all.filter((a) => a.senior_id === sid).slice(0, 3);

  // Realtime subscription to the latest call_log in Supabase
  const { data: latestLog, refetch: refetchLog } = useLatestCallLog(sid);

  // Check if a real call is actively in progress or recently completed
  const isRealActive =
    mode === "real" ||
    (latestLog && ["llamando", "urgencia_en_curso", "analizando"].includes(latestLog.status));

  // Elapsed timer while call is running
  useEffect(() => {
    let t: NodeJS.Timeout | undefined;
    if (isRealActive || simPhase === "talking" || simPhase === "ringing") {
      t = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isRealActive, simPhase]);

  // Real call trigger
  async function handleStartRealCall() {
    if (!sid) {
      toast.error("Seleccione una persona primero.");
      return;
    }
    setCallingReal(true);
    setElapsed(0);
    setMode("real");
    try {
      const res = await triggerOutbound({ data: { personId: sid } });
      if (res.ok) {
        toast.success("Llamada iniciada con éxito");
        await refetchLog();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar la llamada";
      toast.error(msg);
      setMode("idle");
    } finally {
      setCallingReal(false);
    }
  }

  // Simulated call logic
  function handleStartSimulation() {
    setMode("sim");
    const n = name.trim() || "Carmen";
    const r = Math.random();
    const key: ScenarioKey = r < 0.4 ? "bien" : r < 0.7 ? "compania" : r < 0.9 ? "bajo" : "no_contesta";
    linesRef.current = SCENARIOS[key].lines(n);
    setElapsed(0);
    setTalkStep(0);
    setSimResult(null);
    setSimError("");
    setSimPhase("ringing");
  }

  useEffect(() => {
    if (mode !== "sim") return;
    if (simPhase === "ringing") {
      const t = setTimeout(() => setSimPhase("talking"), 2200);
      return () => clearTimeout(t);
    }
    if (simPhase === "talking") {
      if (talkStep >= TALK_STEPS.length) {
        setSimPhase("think");
        analyze({ data: { seniorId: sid ?? "", seniorName: person?.name ?? "", lines: linesRef.current } })
          .then((r) => { setSimResult(r); setSimPhase("done"); })
          .catch((e: Error) => { setSimError(e.message || "No se pudo analizar."); setSimPhase("error"); });
        return;
      }
      const t = setTimeout(() => setTalkStep((s) => s + 1), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [mode, simPhase, talkStep]);

  const n = name.trim() || "Carmen";

  // Initial / Pick Screen
  if (mode === "idle" && !isRealActive) {
    return (
      <Screen
        title="Llamada de OYE"
        footer={
          <div className="space-y-2">
            <BigButton disabled={callingReal} onClick={handleStartRealCall}>
              <Phone className="size-5" /> {callingReal ? "Iniciando..." : "Llamar ahora (llamada real)"}
            </BigButton>
            <BigButton tone="quiet" onClick={handleStartSimulation}>
              Simulación de llamada
            </BigButton>
          </div>
        }
      >
        <h1 className="mt-3 text-2xl font-extrabold">Llamar a {n}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Llamada telefónica asistida por IA con análisis geriátrico en tiempo real.
        </p>

        {latestLog && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Último informe registrado
            </p>
            <SituationReportCard log={latestLog} />
          </div>
        )}

        <Memory past={past} name={n} />
        <AutoCall name={person?.name ?? ""} seniorId={sid ?? ""} userId={user.id} />
      </Screen>
    );
  }

  // Real Call Live View
  if (mode === "real" || isRealActive) {
    const isCompleted = latestLog && ["completada", "rechazada", "no_contesta", "error"].includes(latestLog.status);
    const isEmergency = latestLog?.status === "urgencia_en_curso";

    return (
      <Screen
        title={isCompleted ? `Llamada a ${n}` : `Llamando a ${n}`}
        footer={
          <div className="grid grid-cols-2 gap-2.5">
            <BigButton tone="ghost" onClick={() => { setMode("idle"); setElapsed(0); }}>
              Otra llamada
            </BigButton>
            <Link to="/" search={{ sid }} className="block">
              <BigButton>Ver en inicio</BigButton>
            </Link>
          </div>
        }
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4">
          {/* Active Call Live Banner */}
          {!isCompleted && (
            <section className="flex flex-col items-center justify-center gap-4 py-8 text-center" aria-live="polite">
              <span className="relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-cta">
                <span className="animate-ring absolute inset-0 rounded-full bg-primary" />
                <Phone className="relative size-10 animate-pulse" />
              </span>
              <div>
                <p className="text-2xl font-extrabold">
                  {latestLog?.status === "analizando"
                    ? "Analizando conversación..."
                    : isEmergency
                    ? "¡Alerta en la llamada!"
                    : `En llamada · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latestLog?.status === "analizando"
                    ? "Generando informe sociosanitario y cotejando historial"
                    : isEmergency
                    ? "Se ha detectado una situación crítica"
                    : "Llamada activa en la línea telefónica"}
                </p>
              </div>
            </section>
          )}

          {/* Render real-time situation report card */}
          {latestLog && <SituationReportCard log={latestLog} />}
        </div>
      </Screen>
    );
  }

  // Simulated Call View
  const live = simPhase === "ringing" || simPhase === "talking";
  return (
    <Screen
      title={live ? `Llamando a ${n}` : `Llamada a ${n}`}
      footer={
        simPhase === "done" || simPhase === "error" ? (
          <div className="grid grid-cols-2 gap-2.5">
            <BigButton tone="ghost" onClick={() => { setMode("idle"); setSimPhase("pick"); }}>
              Otra llamada
            </BigButton>
            <Link to="/" search={{ sid }} className="block">
              <BigButton>Ver en inicio</BigButton>
            </Link>
          </div>
        ) : undefined
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {live && (
          <section className="flex h-full flex-col items-center justify-center gap-5 text-center" aria-live="polite">
            <span className="relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-cta">
              <span className="animate-ring absolute inset-0 rounded-full bg-primary" />
              <Phone className="relative size-10 animate-pulse" />
            </span>
            <div>
              <p className="text-2xl font-extrabold">
                {simPhase === "ringing" ? "Llamando…" : `En llamada · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {simPhase === "ringing" ? `${n} está descolgando` : "La IA conversa y escucha"}
              </p>
            </div>
            {simPhase === "talking" && (
              <ul className="w-full space-y-2">
                {TALK_STEPS.map((s, i) => (
                  <li
                    key={s}
                    className={`flex items-center gap-3 rounded-2xl p-3 text-left text-sm font-semibold transition-colors ${
                      i < talkStep ? "bg-card text-muted-foreground" : i === talkStep ? "bg-primary/10 text-primary" : "text-muted-foreground/50"
                    }`}
                  >
                    {i < talkStep ? (
                      <Check className="size-4 shrink-0 text-success" />
                    ) : (
                      <span className={`size-2.5 shrink-0 rounded-full ${i === talkStep ? "animate-pulse bg-primary" : "bg-muted"}`} />
                    )}
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {simPhase === "think" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-secondary text-primary">
              <Sparkles className="size-9 animate-pulse" />
            </span>
            <p className="text-xl font-extrabold">La IA está entendiendo la llamada…</p>
            <p className="text-sm text-muted-foreground">Ánimo, señales y si hace falta avisar a alguien</p>
          </div>
        )}
        {simPhase === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-destructive/10 text-destructive">
              <PhoneOff className="size-9" />
            </span>
            <p role="alert" className="font-semibold text-destructive">{simError}</p>
          </div>
        )}
        {simPhase === "done" && simResult && <Result r={simResult} name={n} />}
      </div>
    </Screen>
  );
}

function Result({ r, name }: { r: CallAnalysis; name: string }) {
  const m = MOOD[r.mood];
  const needsHuman = r.need !== "ninguna";
  const notified = [
    { Icon: Users, label: "Aviso disponible para la familia", on: true },
    { Icon: HandHeart, label: "Vecinos voluntarios", on: needsHuman },
    { Icon: Bell, label: "ONG", on: r.mood === "no_contesta" || r.need === "visita" },
  ];
  return (
    <section className="animate-rise rounded-3xl bg-card p-5 shadow-card" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-primary uppercase">
          <Sparkles className="size-4" /> Lo que ha entendido la IA
        </p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{r.durationMin} min estimados · demo</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.chip}`}>{m.label}</span>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{NEED[r.need]}</span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{lonelyLabel(r.loneliness)} · {r.loneliness}/9</span>
      </div>
      <p className="mt-3 leading-snug">{r.summary}</p>
      {r.memory && (
        <p className="mt-3 flex gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <Brain className="size-4 shrink-0 mt-0.5" />
          <span><b>{TREND[r.trend]}</b> · {r.memory}</span>
        </p>
      )}
      {r.signals.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {r.signals.map((s) => (
            <li key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{s}</li>
          ))}
        </ul>
      )}
      <AlertTimeline a={{ status: needsHuman ? "open" : "closed", volunteer_name: "" }} />
      <ul className="mt-4 space-y-2 border-t pt-4">
        {notified.map(({ Icon, label, on }) => (
          <li key={label} className={`flex items-center gap-3 ${on ? "" : "text-muted-foreground"}`}>
            <Icon className="size-5" /> <span className="flex-1 font-semibold">{label}</span>
            {on ? <Check className="size-5 text-success" /> : <span className="text-xs">No hace falta</span>}
          </li>
        ))}
      </ul>
      {!needsHuman && <p className="mt-3 text-sm text-muted-foreground">{name} está bien. Mañana, otra llamada.</p>}
    </section>
  );
}

const TREND = { mejor: "Va mejor", igual: "Sigue igual", peor: "Va peor", nuevo: "Primera llamada" } as const;

function Memory({ past, name }: { past: ReturnType<typeof useAlerts>["data"] & object; name: string }) {
  if (!past.length) return <p className="mt-4 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">Primera llamada a {name}.</p>;
  return (
    <section className="mt-4 rounded-2xl bg-card p-3 shadow-card" aria-label={`Lo que OYE recuerda de ${name}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-primary uppercase">
        <Brain className="size-4" /> OYE recuerda
      </p>
      <ul className="mt-2 space-y-1.5">
        {past.map((a) => (
          <li key={a.id} className="flex items-start gap-2 text-sm">
            <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${MOOD[a.mood as keyof typeof MOOD]?.dot ?? "bg-muted"}`} />
            <span className="line-clamp-1 flex-1">{a.memory_note || a.summary}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
