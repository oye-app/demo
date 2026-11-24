import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HandHeart, MapPin, Phone, RotateCcw, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  rankVolunteersForSenior,
  type ConsoleCensusRow,
  type ConsoleVolunteerRow,
} from "@/lib/console";

export function DispatchPanel({
  senior,
  volunteers,
  onDispatched,
}: {
  senior: ConsoleCensusRow;
  volunteers: ConsoleVolunteerRow[];
  onDispatched?: (() => void) | undefined;
}) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);

  if (!senior.active_alert_id) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        Sin aviso vecinal activo ahora mismo para <strong>{senior.name}</strong>. Cuando la llamada diaria o el protocolo «No contesta» abra una incidencia, podrás asignarla desde aquí.
      </div>
    );
  }

  const ranked = rankVolunteersForSenior(volunteers, senior.neighborhood);
  const alertId = senior.active_alert_id;
  const isAssigned = senior.active_alert_status === "accepted" || senior.active_alert_status === "arrived";

  async function assign(vol: ConsoleVolunteerRow) {
    setBusyId(vol.id);
    try {
      const { data, error } = await supabase.rpc("console_dispatch_volunteer", {
        _alert_id: alertId,
        _volunteer_id: vol.id,
        _volunteer_name: vol.name,
        _dispatch_note: note.trim(),
      });
      if (error || !data) throw error ?? new Error("Dispatch rejected");
      toast.success(`Visita asignada a ${vol.name}`);
      setNote("");
      await qc.invalidateQueries({ queryKey: ["console"] });
      await qc.invalidateQueries({ queryKey: ["alerts"] });
      onDispatched?.();
    } catch {
      toast.error("No se pudo asignar el aviso. Comprueba que siga abierto.");
    } finally {
      setBusyId(null);
    }
  }

  async function reopen() {
    setReopening(true);
    try {
      const { data, error } = await supabase.rpc("console_reopen_alert", { _alert_id: alertId });
      if (error || !data) throw error ?? new Error("Reopen rejected");
      toast.success("Aviso reabierto en cola comunitaria");
      await qc.invalidateQueries({ queryKey: ["console"] });
      await qc.invalidateQueries({ queryKey: ["alerts"] });
      onDispatched?.();
    } catch {
      toast.error("No se pudo reabrir el aviso.");
    } finally {
      setReopening(false);
    }
  }

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <HandHeart className="size-4 text-primary" />
            Despacho Inteligente de Voluntariado
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Ordenado por cercanía a <strong>{senior.neighborhood || "Chamberí"}</strong>, disponibilidad y carga activa.
          </p>
        </div>
        {isAssigned && (
          <button
            type="button"
            disabled={reopening}
            onClick={() => void reopen()}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            {reopening ? "Reabriendo…" : "Liberar aviso"}
          </button>
        )}
      </div>

      {isAssigned && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs">
          <span className="font-bold text-primary">
            Asignado actualmente a {senior.active_alert_volunteer_name || "voluntario"}
          </span>{" "}
          · Estado: <strong className="uppercase">{senior.active_alert_status}</strong>
        </div>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
          Nota operativa para el voluntario (opcional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Llave en portería / 2.º B · confirmar toma de Enalapril"
          className="h-9 w-full rounded-xl border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {ranked.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay voluntarios dados de alta todavía. Añádelos desde la pestaña «Red de Voluntarios».
        </p>
      ) : (
        <ul className="space-y-2">
          {ranked.slice(0, 6).map((v, idx) => (
            <li
              key={v.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                idx === 0 && v.available ? "border-primary/35 bg-primary/5" : "bg-background/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-foreground">{v.name}</span>
                  {idx === 0 && v.available && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      <Sparkles className="size-2.5" /> Recomendado
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      v.sameNeighborhood && v.available
                        ? "bg-success/15 text-success"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {v.matchTag}
                  </span>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="size-3" /> {v.neighborhood || "Sin barrio"}
                  </span>
                  <span>· {v.completed_30d} visitas (30d)</span>
                  {v.phone && (
                    <a
                      href={`tel:${v.phone}`}
                      className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                    >
                      <Phone className="size-3" /> {v.phone}
                    </a>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={!v.available || busyId !== null || senior.active_alert_status === "arrived"}
                onClick={() => void assign(v)}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="size-3" />
                {busyId === v.id ? "Asignando…" : isAssigned ? "Reasignar" : "Asignar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
