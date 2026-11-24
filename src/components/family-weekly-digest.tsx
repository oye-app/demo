import { useContext, useState } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAllCallLogs, type CallLogRow } from "@/lib/call-logs";

export function buildWeeklyFamilyDigestText(seniorName: string, logs: CallLogRow[]): string {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCompleted = logs.filter(
    (l) => l.status === "completada" && new Date(l.created_at).getTime() >= cutoff
  );
  const sample = recentCompleted.length > 0 ? recentCompleted : logs.filter((l) => l.status === "completada").slice(0, 7);

  if (sample.length === 0) {
    return `Resumen OYE de ${seniorName}: aún no hay llamadas completadas esta semana.`;
  }

  const pcts = sample
    .map((l) => l.global_pct ?? l.report?.global_pct ?? null)
    .filter((v): v is number => typeof v === "number");
  const avgPct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 88;
  const greenCount = sample.filter((l) => (l.nivel_alerta || l.report?.nivel_alerta || "VERDE") === "VERDE").length;
  const alertsCount = sample.length - greenCount;
  const latest = sample[0];
  const latestQuote = latest?.report?.citas_textuales?.[0];
  const latestRec = latest?.report?.recomendacion_familiar;

  const lines = [
    `💙 Resumen OYE de ${seniorName} (${sample.length} ${sample.length === 1 ? "llamada" : "llamadas"} recientes):`,
    `• Bienestar medio: ${avgPct}% (${greenCount} días en verde${alertsCount > 0 ? `, ${alertsCount} con seguimiento cercano` : ""}).`,
    latest?.report?.home_headline ? `• Última llamada: ${latest.report.home_headline}.` : "",
    latestQuote ? `• Frase destacada: «${latestQuote}»` : "",
    latestRec ? `• Sugerencia: ${latestRec}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

function FamilyWeeklyDigestWithQuery({
  seniorName,
  seniorId,
  compact = false,
}: {
  seniorName: string;
  seniorId?: string | undefined;
  compact?: boolean;
}) {
  const { data: logs = [] } = useAllCallLogs(seniorId);
  return <FamilyWeeklyDigestView seniorName={seniorName} logs={logs} compact={compact} />;
}

export function FamilyWeeklyDigest({
  seniorName,
  seniorId,
  logs,
  compact = false,
}: {
  seniorName: string;
  seniorId?: string | undefined;
  logs?: CallLogRow[] | undefined;
  compact?: boolean;
}) {
  const queryClient = useContext(QueryClientContext);
  if (logs) {
    return <FamilyWeeklyDigestView seniorName={seniorName} logs={logs} compact={compact} />;
  }
  if (!queryClient) {
    return <FamilyWeeklyDigestView seniorName={seniorName} logs={[]} compact={compact} />;
  }
  return <FamilyWeeklyDigestWithQuery seniorName={seniorName} seniorId={seniorId} compact={compact} />;
}

function FamilyWeeklyDigestView({
  seniorName,
  logs,
  compact,
}: {
  seniorName: string;
  logs: CallLogRow[];
  compact: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const completed = logs.filter((l) => l.status === "completada");
  if (completed.length === 0) return null;

  const text = buildWeeklyFamilyDigestText(seniorName, logs);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Resumen semanal copiado para compartir con tu familia");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar automáticamente");
    }
  }

  return (
    <section
      aria-label={`Parte familiar semanal de ${seniorName}`}
      className="rounded-3xl bg-card p-4 shadow-card space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Parte familiar compartible
          </p>
          <p className="text-xs text-muted-foreground">
            Envía el resumen semanal a hermanos o familiares en un toque
          </p>
        </div>
      </div>

      {!compact && (
        <pre className="whitespace-pre-wrap rounded-2xl bg-muted/60 p-3 font-sans text-xs leading-relaxed text-foreground">
          {text}
        </pre>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="tap flex items-center justify-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5 text-xs font-bold text-primary hover:bg-secondary/80"
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar resumen"}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap flex items-center justify-center gap-1.5 rounded-2xl bg-success/15 px-3 py-2.5 text-xs font-bold text-success hover:bg-success/25"
        >
          <Share2 className="size-4" />
          Enviar por WhatsApp
        </a>
      </div>
    </section>
  );
}
