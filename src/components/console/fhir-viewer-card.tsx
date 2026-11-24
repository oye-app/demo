import { useEffect, useState } from "react";
import { Check, Code2, Copy, Download, KeyRound, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildFhirR4Bundle,
  buildNativeTriagePayload,
  signPayloadHmacSha256,
  validateWebhookTargetUrl,
  type ConsoleCensusRow,
} from "@/lib/console";

export function FhirViewerCard({ census }: { census: ConsoleCensusRow[] }) {
  const [selectedId, setSelectedId] = useState(census[0]?.senior_id ?? "");
  const [format, setFormat] = useState<"native" | "fhir">("fhir");
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("oye-b2b-sandbox-key");
  const [signature, setSignature] = useState<string>("");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    ok: boolean;
    status: number;
    latencyMs: number;
    preview?: string;
    error?: string;
  } | null>(null);

  const row = census.find((r) => r.senior_id === selectedId) ?? census[0] ?? null;
  const payload = row ? (format === "fhir" ? buildFhirR4Bundle(row) : buildNativeTriagePayload(row)) : null;
  const jsonText = payload ? JSON.stringify(payload, null, 2) : "";
  const compactPayloadText = payload ? JSON.stringify(payload) : "";

  useEffect(() => {
    let active = true;
    if (!compactPayloadText || !webhookSecret.trim()) {
      setSignature("");
      return;
    }
    void signPayloadHmacSha256(compactPayloadText, webhookSecret.trim())
      .then((sig) => {
        if (active) setSignature(sig);
      })
      .catch(() => {
        if (active) setSignature("");
      });
    return () => {
      active = false;
    };
  }, [compactPayloadText, webhookSecret]);

  if (!row || !payload) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      toast.success(format === "fhir" ? "Bundle FHIR R4 copiado" : "Webhook JSON OYE copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el JSON");
    }
  }

  function handleDownload() {
    if (!row) return;
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "senior";
    a.href = url;
    a.download = format === "fhir" ? `oye-${slug}.fhir.json` : `oye-${slug}-webhook.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDispatchWebhook() {
    const urlCheck = validateWebhookTargetUrl(webhookUrl);
    if (!urlCheck.ok) {
      toast.error(urlCheck.reason);
      return;
    }
    setDispatching(true);
    setDispatchResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error("Debes iniciar sesión como operador para enviar webhooks B2B");
        return;
      }

      const res = await fetch("/api/console/webhook-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetUrl: urlCheck.url.toString(),
          payload,
          secret: webhookSecret.trim() || "oye-b2b-sandbox-key",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const errText = String(data["error"] || `HTTP ${res.status}`);
        setDispatchResult({
          ok: false,
          status: res.status,
          latencyMs: Number(data["latencyMs"] ?? 0),
          error: errText,
        });
        toast.error(errText);
        return;
      }

      const ok = Boolean(data["ok"]);
      setDispatchResult({
        ok,
        status: Number(data["status"] ?? 200),
        latencyMs: Number(data["latencyMs"] ?? 0),
        preview: String(data["responsePreview"] || ""),
      });
      toast.success(`Webhook enviado · HTTP ${String(data["status"] ?? 200)}`);
    } catch {
      toast.error("Error enviando test firmado de webhook");
    } finally {
      setDispatching(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Code2 className="size-4 text-primary" />
            Estándar Interoperabilidad B2B (Webhook CRM / HL7 FHIR R4)
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Inspecciona, descarga o prueba con firma criptográfica HMAC-SHA256 el JSON real para Sanitas, DKV, Mapfre, Tunstall o Atenzia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Persona para payload B2B"
            value={row.senior_id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-8 rounded-xl border bg-background px-2.5 text-xs font-semibold"
          >
            {census.map((c) => (
              <option key={c.senior_id} value={c.senior_id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl border bg-secondary p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFormat("fhir")}
              className={`rounded-lg px-2.5 py-1 ${format === "fhir" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}
            >
              FHIR R4 Bundle
            </button>
            <button
              type="button"
              onClick={() => setFormat("native")}
              className={`rounded-lg px-2.5 py-1 ${format === "native" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}
            >
              Webhook OYE JSON
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 rounded-xl border bg-background px-3 py-1.5 text-xs font-bold hover:bg-secondary"
          >
            <Download className="size-3.5" />
            {format === "fhir" ? ".fhir.json" : ".json"}
          </button>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {/* HMAC-SHA256 signature & Live B2B Dispatch Tester */}
      <div className="rounded-2xl border bg-secondary/35 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Firma Webhook HMAC-SHA256 (`X-OYE-Signature`)
          </span>
          {signature && (
            <code className="max-w-full truncate rounded-lg bg-background px-2 py-0.5 font-mono text-[10px] text-slate-700 border">
              {signature}
            </code>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://crm.aseguradora.es/api/oye-webhook"
            aria-label="Endpoint HTTPS B2B de destino"
            className="h-8 rounded-xl border bg-card px-2.5 text-xs"
          />
          <div className="relative flex items-center">
            <KeyRound className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              aria-label="Secreto compartido HMAC-SHA256"
              placeholder="Secreto HMAC"
              className="h-8 w-full rounded-xl border bg-card pl-8 pr-2.5 text-xs font-mono"
            />
          </div>
          <button
            type="button"
            disabled={dispatching || !webhookUrl.trim()}
            onClick={() => void handleDispatchWebhook()}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {dispatching ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Enviar test firmado
          </button>
        </div>

        {dispatchResult && (
          <div
            className={`rounded-xl border px-3 py-2 text-[11px] ${
              dispatchResult.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <span className="font-bold">
              HTTP {dispatchResult.status} · {dispatchResult.latencyMs}ms
            </span>
            {dispatchResult.error && <span className="ml-2">{dispatchResult.error}</span>}
            {dispatchResult.preview && (
              <p className="mt-1 truncate font-mono text-[10px] opacity-80">{dispatchResult.preview}</p>
            )}
          </div>
        )}
      </div>

      <pre className="max-h-72 overflow-auto rounded-2xl border bg-slate-950 p-4 font-mono text-[11px] text-slate-100">
        <code>{jsonText}</code>
      </pre>
    </section>
  );
}
