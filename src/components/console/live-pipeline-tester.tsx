import { useState } from "react";
import { AlertCircle, Check, Copy, FlaskConical, Loader2, PhoneIncoming, Play, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";

type LivePipelineTesterProps = {
  seniorName?: string;
  /** Restricts unauthenticated public showcase views from looking up real senior phones/contacts. */
  publicSafe?: boolean;
};

type TesterMode = "analyze" | "inbound" | "midcall";

type SandboxPreset = {
  id: string;
  label: string;
  transcript: string;
};

const PRESETS: SandboxPreset[] = [
  {
    id: "soledad_recuerdo",
    label: "Soledad implícita + Recuerdo",
    transcript:
      "AGENT [1s]: Buenos días, ¿cómo ha amanecido hoy?\nUSER [5s]: Dormí bastante bien, aunque la casa se me hace muy grande desde que mis nietos volvieron a Bilbao y hoy no llamó nadie.\nAGENT [18s]: ¿Se tomó la pastilla y desayunó algo?\nUSER [22s]: Sí, café con tostada y mi pastilla. Me acordé de cuando en verano íbamos a San Sebastián a pasear por la Concha.",
  },
  {
    id: "negacion_segura",
    label: "Negación Segura (Sin Falso ROJO)",
    transcript:
      "AGENT [1s]: Hola, ¿cómo pasó la noche?\nUSER [4s]: Muy bien hija, no me duele nada, ni el pecho ni la cabeza. Hoy no me he mareado ni me he caído. Desayuné tostada con aceite y ya me tomé mi pastilla de las nueve.",
  },
  {
    id: "medicacion_mareo",
    label: "Olvido medicación + Mareo",
    transcript:
      "AGENT [1s]: Hola, ¿qué tal se encuentra esta mañana?\nUSER [4s]: Regular hija, me levanté un poco mareada al ir al baño.\nAGENT [14s]: ¿Pudo desayunar y tomar la pastilla de la tensión?\nUSER [19s]: No, todavía no me la he tomado porque se me había pasado con el mareo.",
  },
  {
    id: "buzon",
    label: "Buzón de voz (Filtro Veracidad)",
    transcript:
      "AGENT [1s]: Hola, llamo de OYE para saludarle.\nUSER [3s]: El teléfono al que llama no se encuentra disponible, deje su mensaje después de la señal.",
  },
];

type SandboxResult = {
  model?: string;
  nivel_alerta?: string;
  global_pct?: number;
  call_validity?: string;
  validity_reason?: string | null;
  motivos_clinicos?: string[];
  recuerdo_biografico_nuevo?: string | null;
  citas_textuales?: string[];
  summary?: string;
  auditoria_veracidad?: {
    cross_check_coherencia?: string;
  };
  evaluacion_escalas?: {
    soledad_ucla?: { puntuacion_estimada?: number; nivel?: string };
    animo_yesavage_gds5?: { puntuacion_estimada?: number; nivel?: string };
    autocuidado_y_salud?: {
      adherencia_medicacion?: string;
      sueno_descanso?: string;
      alimentacion_hidratacion?: string;
    };
    indicadores_vocales_cognitivos?: {
      estado?: string;
      biomarcadores?: {
        riqueza_lexica_pct?: number;
        palabras_por_respuesta?: number;
        latencia_respuesta_seg?: number | null;
        latencia_max_seg?: number | null;
        variabilidad_latencia_seg?: number | null;
        velocidad_habla_ppm?: number | null;
        indice_repeticion_tema?: number | null;
      };
    };
  };
};

type InboundResult = {
  matched_senior?: boolean;
  latency_ms?: number;
  dynamic_variables?: Record<string, string | number>;
};

type MidCallResult = {
  ok?: boolean;
  mode?: string;
  latency_ms?: number;
  category?: string;
  key_contact_name?: string | null;
  key_contact_phone?: string | null;
  agent_containment_script?: string;
};

export function LivePipelineTester({
  seniorName = "Carmen",
  publicSafe = false,
}: LivePipelineTesterProps) {
  const [mode, setMode] = useState<TesterMode>("analyze");
  const [transcriptText, setTranscriptText] = useState(PRESETS[0]!.transcript);
  const [inboundPhone, setInboundPhone] = useState("+34678617031");
  const [midCallCategory, setMidCallCategory] = useState("caida");
  const [midCallQuote, setMidCallQuote] = useState("Me he caído al levantarme de la silla");
  const [running, setRunning] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [inboundResult, setInboundResult] = useState<InboundResult | null>(null);
  const [midCallResult, setMidCallResult] = useState<MidCallResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const supabaseUrl =
    (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "https://lkbplpptjkajtyvcdier.supabase.co";
  const supabaseAnon = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

  const activeEndpointUrl =
    mode === "analyze"
      ? `${supabaseUrl}/functions/v1/analyze-call`
      : mode === "inbound"
      ? `${supabaseUrl}/functions/v1/inbound-call-context`
      : `${supabaseUrl}/functions/v1/mid-call-alert`;

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (supabaseAnon) {
      headers["apikey"] = supabaseAnon;
      headers["Authorization"] = `Bearer ${supabaseAnon}`;
    }
    return headers;
  }

  async function runLiveAudit() {
    if (running) return;
    setRunning(true);
    setErrorMsg(null);
    const t0 = Date.now();
    try {
      const headers = buildHeaders();
      if (mode === "analyze") {
        if (!transcriptText.trim()) return;
        const res = await fetch(activeEndpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            person_id: "test-only-console-audit",
            conversation_id: `test-only-sandbox-${t0}`,
            name: seniorName,
            duration_sec: 68,
            transcript: transcriptText.trim(),
          }),
        });
        setLatencyMs(Date.now() - t0);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setResult((await res.json()) as SandboxResult);
      } else if (mode === "inbound") {
        const res = await fetch(activeEndpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ caller_id: inboundPhone.trim() }),
        });
        setLatencyMs(Date.now() - t0);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setInboundResult((await res.json()) as InboundResult);
      } else {
        const res = await fetch(activeEndpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            person_id: "d0000000-0000-4000-8000-000000000001",
            category: midCallCategory,
            quote_verbatim: midCallQuote.trim(),
            dry_run: true,
          }),
        });
        setLatencyMs(Date.now() - t0);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMidCallResult((await res.json()) as MidCallResult);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error ejecutando sandbox en vivo");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-indigo-700" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
              Sandbox Clínico & Voice Tools ElevenLabs en Vivo
            </h4>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Audita los 3 motores reales en Supabase sin alterar base de datos ni disparar SMS/alertas reales.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-[10px] font-bold text-indigo-800">
          <ShieldCheck className="w-3 h-3" /> Solo simulación · Sin escritura DB
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-indigo-200 bg-white p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("analyze");
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
              mode === "analyze" ? "bg-indigo-700 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FlaskConical className="w-3 h-3" /> Post-Llamada (GPT-4o)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("inbound");
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
              mode === "inbound" ? "bg-indigo-700 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PhoneIncoming className="w-3 h-3" /> Entrante 24/7 (Caller ID)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("midcall");
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
              mode === "midcall" ? "bg-rose-700 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ShieldAlert className="w-3 h-3" /> Urgencia Intra-Llamada
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(activeEndpointUrl).then(() => {
              setCopiedUrl(true);
              setTimeout(() => setCopiedUrl(false), 1800);
            });
          }}
          title={activeEndpointUrl}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 hover:bg-slate-50"
        >
          {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          {copiedUrl ? "Webhook copiado" : activeEndpointUrl.split("/functions/v1/")[1]}
        </button>
      </div>

      {mode === "analyze" ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setTranscriptText(p.transcript);
                  setResult(null);
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-900 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            aria-label="Transcripción de prueba para auditoría clínica"
            rows={4}
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </>
      ) : publicSafe ? (
        <div className="rounded-xl border border-indigo-200 bg-white p-3.5 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-extrabold text-indigo-950">
              {mode === "inbound"
                ? "Contrato Entrante 24/7 (inbound-call-context)"
                : "Contrato Urgencia Intra-Llamada (<300 ms · mid-call-alert)"}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Protegido por RGPD / Consola
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {mode === "inbound"
              ? "Para evitar enumeración pública de teléfonos reales, la prueba en vivo de Caller ID contra la base de mayores (ficha médica, recuerdos y plan de barrio del día) está habilitada dentro de la Consola de Coordinación."
              : "Para proteger contactos de emergencia y evitar consultas anónimas a fichas reales, el simulacro dry_run con lectura de contacto clave se ejecuta dentro de la Consola autenticada."}
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-2.5 text-[10px] text-slate-100">
            {mode === "inbound"
              ? `POST /functions/v1/inbound-call-context\n{ "caller_id": "+346XXXXXXXX" }\n→ { "matched_senior": true, "latency_ms": <120, "dynamic_variables": { "recurso_barrio_hoy": "..." } }`
              : `POST /functions/v1/mid-call-alert\n{ "person_id": "<uuid>", "category": "caida", "dry_run": true }\n→ { "ok": true, "latency_ms": 210, "agent_containment_script": "Mantén la calma..." }`}
          </pre>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-semibold text-slate-500">
              El análisis GPT-4o Post-Llamada (pestaña 1) funciona 100% en vivo aquí sin tocar BD.
            </span>
            <a
              href="/consola"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-800"
            >
              Probar en Consola ONG →
            </a>
          </div>
        </div>
      ) : mode === "inbound" ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
          <input
            type="tel"
            aria-label="Teléfono entrante (Caller ID)"
            value={inboundPhone}
            onChange={(e) => setInboundPhone(e.target.value)}
            placeholder="+34678617031"
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-slate-800"
          />
          <span className="text-[11px] text-slate-500">
            Resuelve ficha, medicación, recuerdos y plan de barrio en vivo.
          </span>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
          <select
            aria-label="Categoría de urgencia simulada"
            value={midCallCategory}
            onChange={(e) => setMidCallCategory(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold"
          >
            <option value="caida">Caída en domicilio</option>
            <option value="dolor_pecho">Dolor torácico</option>
            <option value="ahogo">Falta de aire</option>
            <option value="desorientacion">Desorientación severa</option>
          </select>
          <input
            type="text"
            aria-label="Cita literal de emergencia"
            value={midCallQuote}
            onChange={(e) => setMidCallQuote(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs"
          />
        </div>
      )}

      {(!publicSafe || mode === "analyze") && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={running || (mode === "analyze" && !transcriptText.trim())}
            onClick={() => void runLiveAudit()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running
              ? "Ejecutando..."
              : mode === "analyze"
              ? "Ejecutar auditoría en vivo"
              : mode === "inbound"
              ? "Probar identificación Caller ID"
              : "Simular alerta <2s (dry_run)"}
          </button>

          {latencyMs !== null && !running && (
            <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
              Latencia pipeline: {(latencyMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {mode === "analyze" && result && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                result.nivel_alerta === "ROJO"
                  ? "bg-rose-100 text-rose-800"
                  : result.nivel_alerta === "AMARILLO"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {result.nivel_alerta || "—"}
            </span>
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              Bienestar: {typeof result.global_pct === "number" ? `${result.global_pct}%` : "—"}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {result.model || "—"}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              validez: {result.call_validity || "—"}
            </span>
          </div>

          {result.summary && <p className="text-xs text-slate-700 leading-relaxed">{result.summary}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">UCLA-3</p>
              <p className="font-bold text-slate-800 tabular-nums">
                {result.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada ?? "—"}/9
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Yesavage GDS-5</p>
              <p className="font-bold text-slate-800 tabular-nums">
                {result.evaluacion_escalas?.animo_yesavage_gds5?.puntuacion_estimada ?? "—"}/5
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Medicación</p>
              <p className="font-bold text-slate-800 truncate">
                {result.evaluacion_escalas?.autocuidado_y_salud?.adherencia_medicacion ?? "—"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Riqueza léxica</p>
              <p className="font-bold text-slate-800 tabular-nums">
                {result.evaluacion_escalas?.indicadores_vocales_cognitivos?.biomarcadores?.riqueza_lexica_pct ?? "—"}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Repetición / PPM</p>
              <p className="font-bold text-slate-800 tabular-nums">
                {result.evaluacion_escalas?.indicadores_vocales_cognitivos?.biomarcadores?.indice_repeticion_tema !==
                undefined &&
                result.evaluacion_escalas?.indicadores_vocales_cognitivos?.biomarcadores?.indice_repeticion_tema !== null
                  ? `${Math.round(
                      result.evaluacion_escalas.indicadores_vocales_cognitivos.biomarcadores.indice_repeticion_tema * 100
                    )}%`
                  : "—"}{" "}
                · {result.evaluacion_escalas?.indicadores_vocales_cognitivos?.biomarcadores?.velocidad_habla_ppm ?? "—"} ppm
              </p>
            </div>
          </div>

          {result.recuerdo_biografico_nuevo && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-[11px] text-amber-950 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Recuerdo biográfico detectado:</strong> {result.recuerdo_biografico_nuevo}
              </span>
            </div>
          )}

          {Array.isArray(result.motivos_clinicos) && result.motivos_clinicos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.motivos_clinicos.map((slug) => (
                <span
                  key={slug}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200"
                >
                  #{slug}
                </span>
              ))}
            </div>
          )}

          {Array.isArray(result.citas_textuales) && result.citas_textuales.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Citas verificadas del usuario</p>
              <ul className="space-y-1 text-[11px] text-slate-700">
                {result.citas_textuales.map((q, idx) => (
                  <li key={idx} className="italic">
                    «{q}»
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {mode === "inbound" && inboundResult?.dynamic_variables && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                inboundResult.matched_senior ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {inboundResult.matched_senior
                ? `Identificado: ${String(inboundResult.dynamic_variables["name"] || "")}`
                : "Número no registrado"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              enfoque: {String(inboundResult.dynamic_variables["clinical_focus_mode"] || "")}
            </span>
          </div>
          {inboundResult.dynamic_variables["neighborhood_plan"] && (
            <p className="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5">
              <strong>Prescripción social de hoy:</strong>{" "}
              {String(inboundResult.dynamic_variables["neighborhood_plan"])}
            </p>
          )}
          {inboundResult.dynamic_variables["pending_followups"] && (
            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              <strong>Seguimiento abierto:</strong> {String(inboundResult.dynamic_variables["pending_followups"])}
            </p>
          )}
          <p className="text-[11px] text-slate-600">
            <strong>Contacto con llave:</strong> {String(inboundResult.dynamic_variables["key_contact"] || "No asignado")}
          </p>
        </div>
      )}

      {mode === "midcall" && midCallResult && (
        <div className="rounded-xl border border-rose-200 bg-white p-3.5 space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
              {midCallResult.mode === "dry_run" ? "Simulación segura (dry_run)" : "Despacho activo"}
            </span>
            <span className="text-[11px] font-bold text-slate-700">
              Llave: {midCallResult.key_contact_name || "No registrado"}{" "}
              {midCallResult.key_contact_phone ? `(${midCallResult.key_contact_phone})` : ""}
            </span>
          </div>
          <p className="text-[11px] text-slate-700 italic bg-rose-50/50 border border-rose-100 rounded-lg px-3 py-2">
            «{midCallResult.agent_containment_script}»
          </p>
        </div>
      )}
    </div>
  );
}
