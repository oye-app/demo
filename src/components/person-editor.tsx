import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "./ui/alert-dialog";
import { getPersonDetails, updatePerson, deletePerson } from "@/lib/person.functions";
import { personUpdateSchema } from "@/lib/person-manage";
import { personDisplayName } from "@/lib/person-presentation";

export function PersonEditor({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const read = useServerFn(getPersonDetails);
  const query = useQuery({ queryKey: ["person-edit", id], queryFn: () => read({ data: { id } }), enabled: open, staleTime: 0 });
  return <>
    <Button variant="ghost" onClick={() => setOpen(true)} className="h-11 min-w-0 justify-start px-1 font-bold" aria-label={`Editar datos de ${personDisplayName(name)}`}><span className="truncate">{personDisplayName(name)}</span><Pencil className="shrink-0 text-primary" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg">
      <DialogTitle>Datos de {personDisplayName(name)}</DialogTitle>
      <DialogDescription className="sr-only">Editar datos de la persona</DialogDescription>
      {query.isPending ? <p role="status">Cargando…</p> : query.error ? <p role="alert">No se pudieron cargar los datos.</p> : query.data ? <EditForm key={`${id}-${query.data.requested_name}`} details={query.data} close={() => setOpen(false)} /> : <p>Solo la administración puede modificar los datos de esta persona.</p>}
    </DialogContent></Dialog>
  </>;
}

function EditForm({ details, close }: { details: { id: string; requested_name: string; requested_phone: string; requested_age: number | null; relation: string }; close: () => void }) {
  const [form, setForm] = useState({ requested_name: personDisplayName(details.requested_name), requested_phone: details.requested_phone, requested_age: details.requested_age?.toString() ?? "", relation: details.relation });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const update = useServerFn(updatePerson);
  const remove = useServerFn(deletePerson);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const refresh = () => Promise.all(["people", "person-edit", "alerts", "links"].map(key => qc.invalidateQueries({ queryKey: [key] })));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const parsed = personUpdateSchema.safeParse({ ...form, id: details.id });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revise los datos"); return; }
    setBusy(true);
    try { await update({ data: parsed.data }); await refresh(); close(); toast.success("Datos actualizados correctamente"); }
    catch { setError("No se pudieron guardar los cambios."); }
    finally { setBusy(false); }
  }
  async function destroy() {
    setBusy(true); setError("");
    try { await remove({ data: { id: details.id, confirmed: true } }); setConfirm(false); close(); await navigate({ to: "/", search: {} }); await refresh(); toast.success("Persona eliminada correctamente"); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar la persona."); setConfirm(false); }
    finally { setBusy(false); }
  }
  return <>
    <form onSubmit={save} className="space-y-3">
      {([{ key: "requested_name", label: "Nombre completo", type: "text" }, { key: "requested_phone", label: "Teléfono de la persona", type: "tel" }, { key: "requested_age", label: "Edad", type: "number" }, { key: "relation", label: "Vínculo", type: "text" }] as const).map(field => <label key={field.key} className="block text-sm font-semibold">{field.label}<input required disabled={busy} type={field.type} min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? 120 : undefined} value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className="mt-1 h-12 w-full rounded-lg border bg-card px-3" /></label>)}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="h-12 w-full">{busy ? "Guardando…" : "Guardar cambios"}</Button>
      <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirm(true)} className="h-12 w-full text-destructive"><Trash2 />Eliminar persona</Button>
    </form>
    <AlertDialog open={confirm} onOpenChange={value => { if (!busy) setConfirm(value); }}><AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
      <AlertDialogTitle>¿Eliminar a {personDisplayName(details.requested_name)}?</AlertDialogTitle>
      <AlertDialogDescription>Dejará de aparecer en la lista y se detendrán sus llamadas programadas.</AlertDialogDescription>
      <div className="grid grid-cols-2 gap-3"><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={destroy}>{busy ? "Eliminando…" : "Sí, eliminar"}</Button></div>
    </AlertDialogContent></AlertDialog>
  </>;
}