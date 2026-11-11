import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { personDisplayName } from "@/lib/person-presentation";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

/** Daily automatic call: OYE calls this person every chosen day at a set hour (Madrid time). */
export function AutoCall({ name, userId, seniorId }: { name: string; userId: string; seniorId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["schedules", userId, seniorId],
    queryFn: async () => (await supabase.from("call_schedules").select("*").eq("senior_id",seniorId).order("created_at")).data ?? [],
  });
  const s = data.find((x) => x.senior_id === seniorId);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["schedules", userId, seniorId] });

  async function save(patch: { active?: boolean; call_hour?: number; days?: number[] }) {
    setBusy(true);
    const result = s ? await supabase.from("call_schedules").update(patch).eq("id", s.id)
      : await supabase.from("call_schedules").insert({ senior_id: seniorId, senior_name: name, created_by: userId, ...patch });
    setBusy(false);
    if(result.error) { toast.error("No se pudo guardar la programación."); return; }
    refresh();
  }

  const on = !!s?.active;
  const hour = s?.call_hour ?? 11;
  const days = s?.days ?? [1, 2, 3, 4, 5, 6, 7];

  return (
    <section className="mt-4 rounded-2xl bg-card p-3 shadow-card">
      <div className="flex items-center gap-3">
        <CalendarClock className="size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">Llamar a {personDisplayName(name)} cada día</p>
          <p className="text-xs text-muted-foreground">{on ? `Activo · ${String(hour).padStart(2, "0")}:00 h` : "Programación de llamadas simuladas"}</p>
        </div>
        <button role="switch" aria-checked={on} aria-label="Llamada automática" disabled={busy || !name.trim()} onClick={() => save({ active: !on })}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-1 size-6 rounded-full bg-card shadow transition-all ${on ? "left-7" : "left-1"}`} />
        </button>
      </div>
      {on && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <select aria-label="Hora" value={hour} onChange={(e) => save({ call_hour: Number(e.target.value) })}
            className="h-9 rounded-lg border bg-card px-2 text-sm font-semibold">
            {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => <option key={h} value={h}>{h}:00</option>)}
          </select>
          <div className="flex flex-1 justify-between">
            {DAYS.map((d, i) => { const n = i + 1; const sel = days.includes(n); return (
              <button key={d} aria-pressed={sel} aria-label={`Día ${d}`}
                onClick={() => { const nd = sel ? days.filter((x) => x !== n) : [...days, n].sort(); if (nd.length) save({ days: nd }); }}
                className={`tap size-10 rounded-full text-sm font-bold ${sel ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}>{d}</button>
            ); })}
          </div>
        </div>
      )}
      {s?.last_error && on && <p className="mt-2 text-xs font-semibold text-destructive">Última llamada automática: {s.last_error}</p>}
    </section>
  );
}
