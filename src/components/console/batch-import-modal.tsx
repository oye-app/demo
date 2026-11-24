import { useMemo, useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseSeniorCsv, SAMPLE_BARRIO_CSV } from "@/lib/console";

export function BatchImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(() => (raw.trim() ? parseSeniorCsv(raw) : { rows: [], warnings: [] }), [raw]);

  if (!open) return null;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRaw(text);
  }

  async function handleImport() {
    if (parsed.rows.length === 0) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("console_batch_upsert_seniors", {
        _rows: parsed.rows as never,
      });
      if (error) throw error;
      const summary = data?.[0];
      toast.success(
        `Importación completada: ${summary?.inserted_count ?? parsed.rows.length} altas · ${summary?.updated_count ?? 0} actualizadas`
      );
      await qc.invalidateQueries({ queryKey: ["console"] });
      await qc.invalidateQueries({ queryKey: ["people"] });
      setRaw("");
      onClose();
    } catch {
      toast.error("No se pudo completar la carga en lote. Verifica los datos e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar censo CSV por lote"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="size-5 text-primary" />
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Alta Masiva de Personas Mayores (CSV / Excel)</h2>
              <p className="text-xs text-muted-foreground">
                Carga 50–500 mayores con su medicación, citas y vecino con llave en segundos. Admite `;` o `,`.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar importador"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15">
              <Upload className="size-3.5" />
              Subir archivo .CSV
              <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => void handleFile(e)} />
            </label>
            <button
              type="button"
              onClick={() => setRaw(SAMPLE_BARRIO_CSV)}
              className="rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
            >
              Cargar plantilla de barrio (3 mayores ejemplo)
            </button>
            {raw && (
              <button
                type="button"
                onClick={() => setRaw("")}
                className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
              >
                Limpiar
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">
              Pega aquí filas desde Excel o CSV (`nombre;edad;telefono;barrio;familia;llave;telefono_llave;medicacion;citas`)
            </label>
            <textarea
              rows={6}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={SAMPLE_BARRIO_CSV}
              className="w-full rounded-2xl border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {parsed.warnings.length > 0 && (
            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
              <p className="mb-1 flex items-center gap-1.5 font-bold text-warning">
                <AlertCircle className="size-4" /> Avisos de validación ({parsed.warnings.length})
              </p>
              <ul className="list-disc space-y-0.5 pl-4">
                {parsed.warnings.slice(0, 6).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed.rows.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-success">
                <CheckCircle2 className="size-4" /> Vista previa: {parsed.rows.length} personas listas para importar
              </p>
              <div className="max-h-52 overflow-auto rounded-2xl border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-secondary text-[11px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Edad</th>
                      <th className="px-3 py-2">Teléfono</th>
                      <th className="px-3 py-2">Barrio</th>
                      <th className="px-3 py-2">Llave</th>
                      <th className="px-3 py-2">Medicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsed.rows.slice(0, 20).map((r, i) => (
                      <tr key={`${r.name}-${i}`} className="bg-card">
                        <td className="px-3 py-1.5 font-bold">{r.name}</td>
                        <td className="px-3 py-1.5">{r.age ?? "—"}</td>
                        <td className="px-3 py-1.5 font-mono">{r.phone || "—"}</td>
                        <td className="px-3 py-1.5">{r.neighborhood}</td>
                        <td className="px-3 py-1.5">{r.key_contact_name || "—"}</td>
                        <td className="max-w-44 truncate px-3 py-1.5">{r.meds || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-secondary/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || parsed.rows.length === 0}
            onClick={() => void handleImport()}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Importando…" : `Importar ${parsed.rows.length} personas`}
          </button>
        </div>
      </div>
    </div>
  );
}
