import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BigButton, Chip } from "@/components/oye";
import type { Alert } from "@/lib/alerts";

const NOTES = ["Está bien", "Hemos charlado", "Hemos dado un paseo", "Necesita volver a ver a alguien"];

/** The volunteer's next step for an alert: Voy yo → He llegado → Visita hecha. */
export function VisitActions({ a, userId, busyElsewhere = false }: { a: Alert; userId: string; busyElsewhere?: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const mine = a.volunteer_id === userId;

  async function run(fn: "accept_alert" | "arrive_alert" | "release_alert" | "complete_alert") {
    setBusy(true); setMsg("");
    const { data } = fn === "complete_alert"
      ? await supabase.rpc(fn, { _id: a.id, _note: note })
      : await supabase.rpc(fn, { _id: a.id });
    setBusy(false);
    if (!data) setMsg(fn === "accept_alert" ? "Otro vecino ya va, o ya tiene una visita en curso." : "No se pudo guardar. Inténtelo otra vez.");
    await qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  if (a.status === "open") {
    if (busyElsewhere) return <p className="text-center text-sm text-muted-foreground">Termine su visita en curso para aceptar otra.</p>;
    return <><BigButton onClick={() => run("accept_alert")} disabled={busy}>Voy yo</BigButton>{msg && <p className="mt-2 text-center text-sm text-muted-foreground">{msg}</p>}</>;
  }
  if (!mine) return null;
  if (a.status === "accepted") {
    return (
      <div className="space-y-2">
        <BigButton onClick={() => run("arrive_alert")} disabled={busy}>He llegado</BigButton>
        <BigButton tone="quiet" size="sm" onClick={() => run("release_alert")} disabled={busy}>No puedo ir, que vaya otro</BigButton>
        {msg && <p className="text-center text-sm text-destructive">{msg}</p>}
      </div>
    );
  }
  if (a.status === "arrived") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">¿Cómo ha ido? (lo verá la familia)</p>
        <div className="flex flex-wrap gap-2">
          {NOTES.map((n) => (
            <Chip key={n} selected={note === n} onClick={() => setNote(note === n ? "" : n)}>{n}</Chip>
          ))}
        </div>
        <BigButton tone="success" onClick={() => run("complete_alert")} disabled={busy}>Visita hecha</BigButton>
        {msg && <p className="text-center text-sm text-destructive">{msg}</p>}
      </div>
    );
  }
  return null;
}
