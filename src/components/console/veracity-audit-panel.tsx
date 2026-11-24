import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileSearch,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CallLogRow } from "@/lib/call-logs";
import { computeModelProvenanceBadge } from "@/lib/console";

export function VeracityAuditPanel({ logs }: { logs: CallLogRow[] }) {
  const qc = useQueryClient();
  const [selectedCallId, setSelectedCallId] = useState(logs[0]?.id ?? "");
  const [qaNote, setQaNote] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = logs.find((l) => l.id === selectedCallId) ?? logs[0] ?? null;

  if (!selected) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-xs text-muted-foreground">
        Todavía no hay llamadas registradas para auditar.
      </div>
    );
  }

  const provenance = computeModelProvenanceBadge(selected);
  const turns = Array.isArray(selected.transcript_turns) ? selected.transcript_turns : [];
  const quotes = selected.report?.citas_textuales ?? [];
  const auditMeta = selected.report?.auditoria_veracidad;
  const callValidity = selected.report?.call_validity;

  async function submitQa(status: "verified_accurate" | "false_positive" | "false_negative") {
    if (!selected) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("console_submit_call_qa", {
        _call_id: selected.id,
        _qa_status: status,
        _qa_note: qaNote.trim(),
      });
      if (error || !data) throw error ?? new Error("Failed QA");
      toast.success(
        status === "verified_accurate"
          ? "Llamada marcada como verificada correcta"
          : status === "false_positive"
          ? "Registrada corrección de falso positivo"
          : "Registrada corrección de señal omitida"
      );
      setQaNote("");
      await qc.invalidateQueries({ queryKey: ["console"] });
      await qc.invalidateQueries({ queryKey: ["call_logs"] });
    } catch {
      toast.error("No se pudo guardar la validación QA.");
    } finally {
      setBusy(false);
    }
  }

  const qaBadgeMap = {
    verified_accurate: { label: "Validado correcto", cls: "bg-success/15 text-success" },
    false_positive: { label: "Falso positivo corregido", cls: "bg-warning/20 text-foreground" },
    false_negative: { label: "Señal omitida reportada", cls: "bg-destructive/15 text-destructive" },
    pending: { label: "Pendiente validación humana", cls: "bg-secondary text-muted-foreground" },
  } as const;

  const qaStatusKey =
    selected.qa_status && selected.qa_status in qaBadgeMap
      ? (selected.qa_status as keyof typeof qaBadgeMap)
      : "pending";
  const qaInfo = qaBadgeMap[qaStatusKey];

  const provenanceCls =
    provenance.tone === "llm"
      ? "bg-primary/15 text-primary"
      : provenance.tone === "sim"
      ? "bg-purple-500/15 text-purple-700"
      : provenance.tone === "rules"
      ? "bg-amber-500/15 text-amber-800"
      : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <FileSearch className="size-4 text-primary" />
              Auditoría Clínica «Dato ↔ Evidencia Real» & Control de Calidad (QA)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Contrasta exactamente lo que habló la persona mayor con la clasificación automática y registra validación humana.
            </p>
          </div>

          <select
            aria-label="Seleccionar llamada a auditar"
            value={selected.id}
            onChange={(e) => setSelectedCallId(e.target.value)}
            className="h-9 rounded-xl border bg-background px-3 text-xs font-semibold"
          >
            {logs.slice(0, 20).map((l) => (
              <option key={l.id} value={l.id}>
                {new Date(l.created_at).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {l.nivel_alerta || l.status} ({l.global_pct ?? "—"}%)
              </option>
            ))}
          </select>
        </div>

        {/* Provenance + Validity + QA Status Pills */}
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className={`rounded-full px-3 py-1 ${provenanceCls}`}>Motor: {provenance.label}</span>
          <span className={`rounded-full px-3 py-1 ${qaInfo.cls}`}>QA: {qaInfo.label}</span>
          {callValidity && (
            <span
              className={`rounded-full px-3 py-1 ${
                callValidity === "verified_human"
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              Validez voz: {callValidity}
            </span>
          )}
          {auditMeta?.has_timestamps !== undefined && (
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              {auditMeta.user_turns_count ?? 0} turnos usuario · {auditMeta.user_words_count ?? 0} palabras
            </span>
          )}
        </div>

        {provenance.tone === "rules" && (
          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
            <strong>Modo determinista activo:</strong> Esta llamada se analizó sin LLM externo (`OPENAI_API_KEY` no configurada en Supabase). Configura `OPENAI_API_KEY` en Edge Function Secrets para combinar comprensión semántica GPT-4o + verificación por cita exacta.
          </div>
        )}

        {/* Side-by-side Transcript Verifier */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-background/70 p-4 space-y-2.5">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
              <MessageSquareText className="size-4 text-primary" />
              Transcripción Completa Turno a Turno ({turns.length})
            </p>
            {turns.length > 0 ? (
              <ol className="max-h-72 space-y-2 overflow-y-auto pr-1 text-xs">
                {turns.map((t, i) => (
                  <li
                    key={i}
                    className={`rounded-xl border p-2.5 ${
                      t.role === "user" ? "border-primary/25 bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1">
                      <span className="inline-flex items-center gap-1">
                        {t.role === "user" ? (
                          <>
                            <UserRound className="size-3 text-primary" /> Persona Mayor
                          </>
                        ) : (
                          <>
                            <Bot className="size-3" /> Agente OYE
                          </>
                        )}
                      </span>
                      {typeof t.timeSec === "number" && <span>[{t.timeSec}s]</span>}
                    </div>
                    <p className="text-foreground leading-relaxed">{t.text}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Esta llamada fue analizada antes de activar el archivado turno a turno en `call_logs.transcript_turns`.
                  Citas literales verificadas conservadas en el informe:
                </p>
                {quotes.length > 0 ? (
                  <ul className="space-y-1.5">
                    {quotes.map((q, idx) => (
                      <li key={idx} className="rounded-xl border bg-card p-2.5 italic text-foreground">
                        «{q}»
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Sin citas literales archivadas en este registro histórico.</p>
                )}
              </div>
            )}
          </div>

          {/* QA Review & Findings Verification */}
          <div className="rounded-2xl border bg-background/70 p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Validación Humana del Informe (Audit Trail)
            </p>

            <div className="rounded-xl border bg-card p-3 text-xs space-y-1">
              <p className="font-bold text-foreground">
                Resultado generado: {selected.nivel_alerta || selected.status}{" "}
                {selected.global_pct !== null ? `(${selected.global_pct}%)` : ""}
              </p>
              <p className="text-muted-foreground">{selected.report?.summary || selected.motivo || "Sin resumen"}</p>
            </div>

            {selected.qa_reviewed_at && (
              <p className="text-[11px] font-semibold text-muted-foreground">
                Última revisión por <strong>{selected.qa_reviewed_by || "Coordinación"}</strong> el{" "}
                {new Date(selected.qa_reviewed_at).toLocaleString("es-ES")}
                {selected.qa_note ? ` · «${selected.qa_note}»` : ""}
              </p>
            )}

            <label className="block text-xs">
              <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                Nota de auditoría / corrección clínica (opcional)
              </span>
              <input
                type="text"
                value={qaNote}
                onChange={(e) => setQaNote(e.target.value)}
                placeholder="Ej. El mayor dijo 'sin dolor' pero la voz grabó eco / todo correcto"
                className="h-9 w-full rounded-xl border bg-card px-3 text-xs"
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitQa("verified_accurate")}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-success px-3 py-2 text-xs font-bold text-success-foreground hover:bg-success/90 disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5" /> Correcto
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitQa("false_positive")}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-warning px-3 py-2 text-xs font-bold text-warning-foreground hover:bg-warning/90 disabled:opacity-50"
              >
                <AlertTriangle className="size-3.5" /> Falso positivo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitQa("false_negative")}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                <XCircle className="size-3.5" /> Omitió señal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
