import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ClipboardEdit, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ConsoleCensusRow } from "@/lib/console";

const DAYS = [
  [1, "L"],
  [2, "M"],
  [3, "X"],
  [4, "J"],
  [5, "V"],
  [6, "S"],
  [7, "D"],
] as const;

export function SeniorEditModal({
  senior,
  open,
  onClose,
}: {
  senior: ConsoleCensusRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [familyContact, setFamilyContact] = useState("");
  const [birthday, setBirthday] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyPhone, setKeyPhone] = useState("");
  const [meds, setMeds] = useState("");
  const [appointments, setAppointments] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduleActive, setScheduleActive] = useState(true);
  const [callHour, setCallHour] = useState(11);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!senior || !open) return;
    setPhone(senior.phone);
    setAge(senior.age !== null ? String(senior.age) : "");
    setNeighborhood(senior.neighborhood);
    setFamilyContact(senior.family_contact);
    setBirthday(senior.birthday);
    setKeyName(senior.key_contact_name);
    setKeyPhone(senior.key_contact_phone);
    setMeds(senior.meds);
    setAppointments(senior.appointments);
    setNotes(senior.notes);
    setScheduleActive(senior.schedule_active);
    setCallHour(senior.schedule_call_hour ?? 11);
    setDays(senior.schedule_days && senior.schedule_days.length > 0 ? senior.schedule_days : [1, 2, 3, 4, 5, 6, 7]);
  }, [senior, open]);

  if (!open || !senior) return null;

  function toggleDay(dayNum: number) {
    setDays((prev) => {
      if (prev.includes(dayNum)) {
        return prev.length > 1 ? prev.filter((d) => d !== dayNum) : prev;
      }
      return [...prev, dayNum].sort((a, b) => a - b);
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!senior) return;
    setBusy(true);
    try {
      const parsedAge = age.trim() ? Number(age) : null;
      const { data, error } = await supabase.rpc("console_update_senior_profile", {
        _senior_id: senior.senior_id,
        _phone: phone.trim(),
        _age: parsedAge && Number.isFinite(parsedAge) ? Math.round(parsedAge) : null,
        _neighborhood: neighborhood.trim() || "Chamberí",
        _family_contact: familyContact.trim(),
        _notes: notes.trim(),
        _key_contact_name: keyName.trim(),
        _key_contact_phone: keyPhone.trim(),
        _meds: meds.trim(),
        _appointments: appointments.trim(),
        _birthday: birthday.trim(),
        _schedule_active: scheduleActive,
        _schedule_call_hour: callHour,
        _schedule_days: days,
      });
      if (error || !data) throw error ?? new Error("Update failed");
      toast.success(`Expediente y co-piloto vocal de ${senior.name} guardados`);
      await qc.invalidateQueries({ queryKey: ["console"] });
      await qc.invalidateQueries({ queryKey: ["people"] });
      onClose();
    } catch {
      toast.error("No se pudieron guardar los cambios clínicos.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-9 w-full rounded-xl border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ficha de ${senior.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <form
        onSubmit={(e) => void handleSave(e)}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ClipboardEdit className="size-5 text-primary" />
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Ficha Clínica & Co-piloto IA · {senior.name}</h2>
              <p className="text-xs text-muted-foreground">
                La medicación, citas y llave que guardes aquí se inyectan automáticamente en la próxima llamada de OYE.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar edición"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Teléfono</span>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34..." />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Edad</span>
              <input
                className={inputCls}
                type="number"
                min={50}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Barrio / Distrito</span>
              <input className={inputCls} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Familiar de referencia</span>
              <input
                className={inputCls}
                value={familyContact}
                onChange={(e) => setFamilyContact(e.target.value)}
                placeholder="Ej. Lucía (+34...)"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Cumpleaños</span>
              <input
                className={inputCls}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="Ej. 14 de marzo"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Persona con llave</span>
              <input
                className={inputCls}
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Ej. Rosa (vecina del 2.º)"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-muted-foreground">Teléfono de quien tiene llave</span>
              <input
                className={inputCls}
                value={keyPhone}
                onChange={(e) => setKeyPhone(e.target.value)}
                placeholder="+34..."
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block font-bold text-muted-foreground">Medicación a verificar por voz</span>
            <input
              className={inputCls}
              value={meds}
              onChange={(e) => setMeds(e.target.value)}
              placeholder="Ej. Enalapril 10mg tras el desayuno"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-bold text-muted-foreground">Próximas citas / Recordatorios</span>
            <input
              className={inputCls}
              value={appointments}
              onChange={(e) => setAppointments(e.target.value)}
              placeholder="Ej. Centro Salud Chamberí · Jueves 10:30"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-bold text-muted-foreground">Notas sociosanitarias internas</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          {/* Schedule configurator */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-extrabold text-primary">
                <CalendarClock className="size-4" />
                Programación de Llamada Diaria (Hora Madrid)
              </span>
              <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={scheduleActive}
                  onChange={(e) => setScheduleActive(e.target.checked)}
                  className="size-4 accent-primary"
                />
                {scheduleActive ? "Activa" : "En pausa"}
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Hora:</span>
                <select
                  value={callHour}
                  onChange={(e) => setCallHour(Number(e.target.value))}
                  className="h-8 rounded-lg border bg-card px-2 font-bold"
                >
                  {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00 h
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(([num, lbl]) => {
                  const active = days.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleDay(num)}
                      className={`size-8 rounded-full text-xs font-bold transition-colors ${
                        active ? "bg-primary text-primary-foreground" : "border bg-card text-foreground"
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-secondary/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-card px-4 py-2 text-xs font-bold hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Guardar ficha y programación"}
          </button>
        </div>
      </form>
    </div>
  );
}
