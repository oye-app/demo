import { useState } from "react";
import { FlaskConical, Loader2, Play, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

type LivePipelineTesterProps = {
  seniorName?: string;
};

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
      };
    };
  };
};

export function LivePipelineTester({ seniorName = "Carmen" }: LivePipelineTesterProps) {
  const [transcriptText, setTranscriptText] = useState(PRESETS[0]!.transcript);
  const [running, setRunning] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<SandboxResult | null>(null);

  const supabaseUrl =
    (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "https://lkbplpptjkajtyvcdier.supabase.co";
  const supabaseAnon = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

  async function runLiveAudit() {
    if (!transcriptText.trim() || running) return;
    setRunning(true);
    setErrorMsg(null);
    const t0 = Date.now();
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (supabaseAnon) {
        headers["apikey"] = supabaseAnon;
        headers["Authorization"] = `Bearer ${supabaseAnon}`;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/analyze-call`, {
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
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${txt ? `: ${txt.slice(0, 140)}` : ""}`);
      }
      const data = (await res.json()) as SandboxResult;
      setResult(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error ejecutando analyze-call");
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
              Sandbox Clínico en Vivo · analyze-call + GPT-4o
            </h4>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Audita el motor real sin alterar base de datos ni disparar alertas (`person_id: test-only-console-audit`).
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-[10px] font-bold text-indigo-800">
          <ShieldCheck className="w-3 h-3" /> Solo simulación · Sin escritura DB
        </span>
      </div>

      {/* Preset selector */}
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={running || !transcriptText.trim()}
          onClick={() => void runLiveAudit()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? "Analizando con GPT-4o..." : "Ejecutar auditoría en vivo"}
        </button>

        {latencyMs !== null && !running && (
          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
            Latencia pipeline: {(latencyMs / 1000).toFixed(2)}s
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {result && (
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
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
    </div>
  );
}
