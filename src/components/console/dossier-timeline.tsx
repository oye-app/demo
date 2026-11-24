import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Compass, HandHeart, PhoneCall, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CallLogRow } from "@/lib/call-logs";
import {
  useCommunityResources,
  useSeniorDossier,
  type CommunityResourceRow,
  type ConsoleCensusRow,
} from "@/lib/console";

const CATEGORIES = [
  ["nota_coordinacion", "Nota coordinación"],
  ["seguimiento_telefonico", "Llamada seguimiento ONG"],
  ["activacion_llave", "Contacto con llave / Familia"],
  ["prescripcion_social", "Prescripción social barrio"],
  ["derivacion_sanitaria", "Derivación Sanidad / UAD / 112"],
] as const;

export function DossierTimelinePanel({
  senior,
  logs,
}: {
  senior: ConsoleCensusRow;
  logs: CallLogRow[];
}) {
  const qc = useQueryClient();
  const { data: dossier, isPending: loadingDossier } = useSeniorDossier(senior.senior_id);
  const { data: resources = [] } = useCommunityResources(true);

  const [category, setCategory] = useState<string>("nota_coordinacion");
  const [ring, setRing] = useState<number>(2);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveIntervention(
    payload: {
      cat: string;
      r: number;
      t: string;
      d: string;
    },
    clearForm = false
  ) {
    if (!payload.t.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("console_log_intervention", {
        _senior_id: senior.senior_id,
        _category: payload.cat,
        _ring: payload.r,
        _title: payload.t.trim(),
        _details: payload.d.trim(),
        _outcome: "completada",
        _alert_id: senior.active_alert_id,
      });
      if (error || !data) throw error ?? new Error("Failed");
      toast.success("Actuación guardada en el expediente clínico");
      if (clearForm) {
        setTitle("");
        setDetails("");
      }
      await qc.invalidateQueries({ queryKey: ["console", "dossier", senior.senior_id] });
    } catch {
      toast.error("No se pudo registrar la actuación.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void saveIntervention({ cat: category, r: ring, t: title, d: details }, true);
  }

  function handlePrescribeResource(res: CommunityResourceRow) {
    void saveIntervention({
      cat: "prescripcion_social",
      r: res.category === "servicios_sociales" ? 3 : 2,
      t: `Prescripción social: ${res.name}`,
      d: `${res.neighborhood} · ${res.schedule} · ${res.description}`,
    });
  }

  // Combine unified chronological entries (interventions + visits/alerts + calls)
  const unifiedFeed = [
    ...(dossier?.interventions ?? []).map((it) => ({
      key: `int-${it.id}`,
      at: it.created_at,
      kind: "intervention" as const,
      badge: `Anillo ${it.ring} · ${it.category.replace(/_/g, " ")}`,
      badgeTone:
        it.ring === 3
          ? "bg-destructive/15 text-destructive"
          : it.ring === 1
          ? "bg-primary/15 text-primary"
          : "bg-secondary text-secondary-foreground",
      title: it.title,
      body: it.details,
      author: it.author_name,
    })),
    ...(dossier?.alerts ?? []).map((al) => ({
      key: `alt-${al.id}`,
      at: al.visited_at || al.accepted_at || al.created_at,
      kind: "alert" as const,
      badge: `Alerta ${al.status.toUpperCase()}`,
      badgeTone:
        al.status === "visited"
          ? "bg-success/15 text-success"
          : al.status === "open"
          ? "bg-warning/20 text-foreground"
          : "bg-primary/15 text-primary",
      title: al.volunteer_name
        ? `Visita «Voy yo» (${al.volunteer_name}): ${al.visit_note || al.summary}`
        : al.summary || "Aviso comunitario",
      body: al.memory_note || "",
      author: al.volunteer_name ? `Voluntario ${al.volunteer_name}` : "Sistema OYE",
    })),
    ...logs.slice(0, 15).map((cl) => ({
      key: `call-${cl.id}`,
      at: cl.created_at,
      kind: "call" as const,
      badge: `Llamada OYE · ${cl.nivel_alerta || cl.status}`,
      badgeTone:
        cl.nivel_alerta === "ROJO"
          ? "bg-destructive/15 text-destructive"
          : cl.nivel_alerta === "AMARILLO"
          ? "bg-warning/20 text-foreground"
          : "bg-success/15 text-success",
      title: cl.report?.home_headline || `Llamada ${cl.status}`,
      body: cl.report?.summary || cl.motivo || "",
      author: cl.duracion_seg ? `Voz IA (${cl.duracion_seg}s)` : "Voz IA",
    })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const sortedResources = [...resources].sort(
    (a, b) =>
      Number(b.neighborhood.toLowerCase() === senior.neighborhood.toLowerCase()) -
      Number(a.neighborhood.toLowerCase() === senior.neighborhood.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {/* New Case Management / Ring Intervention Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
            <ClipboardCheck className="size-4 text-primary" />
            Registrar Actuación / Derivación por Anillos
          </h3>

          <div className="grid gap-2 sm:grid-cols-2">
            <select
              aria-label="Categoría de intervención"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-xl border bg-background px-2.5 text-xs font-semibold"
            >
              {CATEGORIES.map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </select>

            <select
              aria-label="Anillo de derivación"
              value={ring}
              onChange={(e) => setRing(Number(e.target.value))}
              className="h-9 rounded-xl border bg-background px-2.5 text-xs font-semibold"
            >
              <option value={1}>Anillo 1 · Familia</option>
              <option value={2}>Anillo 2 · Voluntariado / ONG</option>
              <option value={3}>Anillo 3 · Centro Salud / UAD / 112</option>
            </select>
          </div>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resumen de actuación (ej. Llamada a Lucía / Derivación a enfermera)"
            className="h-9 w-full rounded-xl border bg-background px-3 text-xs"
          />

          <textarea
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Detalle clínico, acuerdos con el mayor o instrucciones para el siguiente turno…"
            className="w-full rounded-xl border bg-background p-2.5 text-xs"
          />

          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            {busy ? "Guardando…" : "Añadir al expediente"}
          </button>
        </form>

        {/* 1-Click Neighborhood Social Prescription Catalog */}
        <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <Compass className="size-4 text-primary" />
              Prescripción Social de Barrio (Marco Soledades 2026-2030)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Recursos activos cerca de <strong>{senior.neighborhood || "Chamberí"}</strong> para prescribir con 1 clic.
            </p>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {sortedResources.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin recursos configurados para este barrio.</p>
            ) : (
              sortedResources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-start justify-between gap-2 rounded-2xl border bg-background/70 p-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">{res.name}</p>
                    <p className="text-[11px] font-semibold text-primary">
                      {res.neighborhood} · {res.schedule}
                    </p>
                    {res.description && <p className="mt-0.5 text-[11px] text-muted-foreground">{res.description}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handlePrescribeResource(res)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-secondary/80 disabled:opacity-50"
                  >
                    <Sparkles className="size-3" /> Prescribir
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Unified Chronological Timeline */}
      <section className="rounded-3xl border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-foreground">
            Bitácora Cronológica Unificada ({unifiedFeed.length} eventos)
          </h3>
          {loadingDossier && <span className="text-[11px] text-muted-foreground">Sincronizando…</span>}
        </div>

        {unifiedFeed.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay eventos registrados todavía en el historial.</p>
        ) : (
          <ol className="space-y-2.5">
            {unifiedFeed.map((ev) => (
              <li key={ev.key} className="rounded-2xl border bg-background/65 p-3.5 text-xs space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${ev.badgeTone}`}>
                    {ev.kind === "call" ? (
                      <PhoneCall className="size-3" />
                    ) : ev.kind === "alert" ? (
                      <HandHeart className="size-3" />
                    ) : (
                      <ClipboardCheck className="size-3" />
                    )}
                    {ev.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {new Date(ev.at).toLocaleString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {ev.author}
                  </span>
                </div>
                <p className="font-bold text-foreground">{ev.title}</p>
                {ev.body && <p className="text-foreground/85">{ev.body}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
