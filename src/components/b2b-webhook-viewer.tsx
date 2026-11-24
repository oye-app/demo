import { useState } from "react";
import { Check, ChevronDown, Code2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { CallLogRow } from "@/lib/call-logs";

export function B2BWebhookViewer({ log, defaultOpen = false }: { log: CallLogRow; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  if (log.status !== "completada") return null;

  const report = log.report;
  const alertLevel = report?.nivel_alerta || log.nivel_alerta || "VERDE";
  const globalPct = report?.global_pct ?? report?.scores?.global_pct ?? log.global_pct ?? 88;
  const score10 = report?.score_bienestar_global ?? Number((globalPct / 10).toFixed(1));

  const payload = {
    event: "oye.triage.completed",
    schema_version: report?.schema_version || "1.0",
    timestamp: report?.timestamp_evaluacion || log.created_at,
    person_id: log.person_id,
    conversation_id: log.conversation_id,
    duracion_seg: log.duracion_seg,
    nivel_alerta: alertLevel,
    score_bienestar_global: score10,
    global_pct: globalPct,
    evaluacion_escalas: report?.evaluacion_escalas ?? null,
    citas_textuales: report?.citas_textuales ?? [],
    prescripcion_y_derivacion_humana: report?.prescripcion_y_derivacion_humana ?? null,
    ...(report?.tendencia_longitudinal ? { tendencia_longitudinal: report.tendencia_longitudinal } : {}),
  };

  const jsonString = JSON.stringify(payload, null, 2);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("Payload JSON copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar automáticamente");
    }
  }

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-left text-[11px] font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Code2 className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">Ver Payload API / Webhook B2B (Integración Teleasistencia & Salud)</span>
        </span>
        <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-2xl border border-border bg-slate-950 p-3.5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                200 OK
              </span>
              <span className="text-slate-400">Listo para CRM / Teleasistencia / FHIR</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-100 hover:bg-slate-700"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar JSON"}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto rounded-xl bg-slate-900/90 p-3 text-[11px] leading-relaxed text-sky-100">
            <code>{jsonString}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
