import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Line } from "./scenarios";
import { usePersonId } from "./people";
import { useMe } from "./auth";

export type Alert = Omit<Tables<"alerts">, "transcript"> & { transcript: Line[] };

export const alertsQuery = queryOptions({ queryKey: ["alerts"], queryFn: () => fetchAlerts() });
export async function fetchAlerts(sid?: string): Promise<Alert[]> {
  const rows: Alert[] = [];
  for (let offset = 0; ; offset += 50) {
    const { data, error } = await supabase.rpc("visible_alerts", { ...(sid ? { _senior: sid } : {}), _offset: offset });
    if (error) throw error;
    const page = (data ?? []) as unknown as Alert[];
    rows.push(...page);
    if (page.length < 50) break;
  }
  return rows.sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at));
}
export function useAlerts(global = false) {
  const qc = useQueryClient();
  const sid = usePersonId();
  const { user } = useMe();
  useEffect(() => {
    const ch = supabase.channel(`alerts-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        qc.invalidateQueries({ queryKey: ["alerts"] });
        qc.invalidateQueries({ queryKey: ["people"] });
      }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);
  return useQuery({ queryKey: ["alerts", user.id, global ? "all" : sid ?? "all"], queryFn: () => fetchAlerts(global ? undefined : sid), refetchInterval: 15000 });
}

export const sameSenior = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const MOOD = {
  bien: { label: "Está bien", dot: "bg-success", chip: "bg-success text-success-foreground" },
  bajo: { label: "Ánimo bajo", dot: "bg-warning", chip: "bg-warning text-warning-foreground" },
  no_contesta: { label: "No contesta", dot: "bg-destructive", chip: "bg-destructive text-destructive-foreground" },
} as const;

export const NEED = {
  ninguna: "Nada que hacer",
  compania: "Quiere compañía",
  llamada: "Necesita que le llamen",
  visita: "Hay que ir a verle",
} as const;

export const STATUS = {
  open: "Esperando voluntario",
  accepted: "Voluntario en camino",
  arrived: "Voluntario con la persona",
  visited: "Visita hecha",
  closed: "Todo bien",
} as const;

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export const minutesWaiting = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
export const waitLabel = (m: number) => (m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 1440)} d`);
/** Priority: no answer first, then "visita", then longest wait. */
export function byPriority(x: Alert, y: Alert) {
  const w = (a: Alert) => (a.mood === "no_contesta" ? 2 : a.need === "visita" ? 1 : 0);
  return w(y) - w(x) || +new Date(x.created_at) - +new Date(y.created_at);
}
export const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "");

/** Alerts a volunteer should see: their own active visit + open alerts in their neighbourhood. */
export function forVolunteer(data: Alert[], userId: string, barrio: string) {
  const active = data.find((a) => a.volunteer_id === userId && (a.status === "accepted" || a.status === "arrived"));
  const open = data.filter((a) => a.status === "open" && (!barrio || !a.neighborhood || sameArea(a.neighborhood, barrio))).sort(byPriority);
  return { active, open };
}


/** Loose neighbourhood match: "Chamberí" matches "Asociación Vecinal Chamberí". */
export const sameArea = (a: string, b: string) => { const x = a.trim().toLowerCase(), y = b.trim().toLowerCase(); return !x || !y || x.includes(y) || y.includes(x); };

/** Safety net for unattended alerts (derived from time, no background job). */
export const ESCALATE_ONG_MIN = 30;
export const ESCALATE_FAMILY_MIN = 60;
export const RETRY_MIN = 15;
export type Escalation = { level: 0 | 1 | 2; label: string; next: string };
export function escalation(a: Pick<Alert, "status" | "mood" | "created_at">, now = Date.now()): Escalation {
  if (a.status !== "open") return { level: 0, label: "", next: "" };
  const m = Math.max(0, Math.round((now - new Date(a.created_at).getTime()) / 60000));
  const at = (min: number) => new Date(new Date(a.created_at).getTime() + min * 60000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const noAnswer = a.mood === "no_contesta";
  if (m >= ESCALATE_FAMILY_MIN) return { level: 2, label: noAnswer ? "Sin respuesta: llamar a quien tiene llave" : "Familia avisada", next: "" };
  if (m >= ESCALATE_ONG_MIN) return { level: 1, label: "Escalado a la ONG", next: `Familia a las ${at(ESCALATE_FAMILY_MIN)}` };
  if (noAnswer) return { level: 0, label: m >= RETRY_MIN ? "Volver a llamar ahora" : `OYE vuelve a llamar a las ${at(RETRY_MIN)}`, next: `ONG a las ${at(ESCALATE_ONG_MIN)}` };
  return { level: 0, label: "", next: `ONG a las ${at(ESCALATE_ONG_MIN)}` };
}

/** UCLA-3 loneliness score (3-9). 3-5 = not lonely, 6-9 = lonely. */
export const lonelyLabel = (s: number) => (s >= 6 ? "Se siente sola" : "No se siente sola");
