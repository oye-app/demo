import { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import { toast } from "sonner";
import { buildFhirR4Bundle, buildNativeTriagePayload, type ConsoleCensusRow } from "@/lib/console";

export function FhirViewerCard({ census }: { census: ConsoleCensusRow[] }) {
  const [selectedId, setSelectedId] = useState(census[0]?.senior_id ?? "");
  const [format, setFormat] = useState<"native" | "fhir">("fhir");
  const [copied, setCopied] = useState(false);

  const row = census.find((r) => r.senior_id === selectedId) ?? census[0] ?? null;
  if (!row) return null;

  const payload = format === "fhir" ? buildFhirR4Bundle(row) : buildNativeTriagePayload(row);
  const jsonText = JSON.stringify(payload, null, 2);

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

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <Code2 className="size-4 text-primary" />
            Estándar Interoperabilidad B2B (Webhook CRM / HL7 FHIR R4)
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Inspecciona en vivo el JSON generado desde los datos reales para integrar con Sanitas, DKV, Mapfre, Tunstall o Atenzia.
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
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <pre className="max-h-72 overflow-auto rounded-2xl border bg-slate-950 p-4 font-mono text-[11px] text-slate-100">
        <code>{jsonText}</code>
      </pre>
    </section>
  );
}
