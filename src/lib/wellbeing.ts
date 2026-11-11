import { Heart, MessageCircle, PhoneCall, Users } from "lucide-react";
import type { Alert } from "./alerts";

export type WellbeingItem = {
  key: string;
  label: string;
  icon: typeof Heart;
  pct: number | null; // 0-100
  hint: string;
  tone: "good" | "warn" | "bad" | "unknown";
};

const toneOf = (pct: number | null): WellbeingItem["tone"] => (pct == null ? "unknown" : pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad");

/** Wellbeing summary per senior, derived from their recent calls (last 14 days). */
export function wellbeing(alerts: Alert[], senior: string, seniorId?: string): { overall: number | null; items: WellbeingItem[] } {
  const mine = alerts
    .filter((a) => !!seniorId && a.senior_id === seniorId)
    .filter((a) => Date.now() - +new Date(a.created_at) < 14 * 86400000);
  const answered = mine.filter((a) => a.mood !== "no_contesta");

  // Ánimo: share of answered calls with mood "bien"
  const animo = answered.length ? Math.round((answered.filter((a) => a.mood === "bien").length / answered.length) * 100) : null;

  // Soledad: inverse of avg loneliness score (3-9 → 100-0)
  const scores = answered.map((a) => a.loneliness_score).filter((s): s is number => s != null);
  const soledad = scores.length ? Math.round(100 - ((scores.reduce((x, y) => x + y, 0) / scores.length - 3) / 6) * 100) : null;

  // Compañía: calls that ended in a visit or needed nothing
  const compania = mine.length
    ? Math.round((mine.filter((a) => a.status === "visited" || a.status === "closed" || a.need === "ninguna").length / mine.length) * 100)
    : null;

  // Contacto: answered vs total calls
  const contacto = mine.length ? Math.round((answered.length / mine.length) * 100) : null;

  const items: WellbeingItem[] = [
    { key: "animo", label: "Ánimo", icon: Heart, pct: animo, hint: `${answered.filter((a) => a.mood === "bien").length} de ${answered.length} llamadas bien`, tone: toneOf(animo) },
    { key: "soledad", label: "Compañía sentida", icon: Users, pct: soledad, hint: soledad == null ? "Sin datos suficientes" : soledad >= 70 ? "No se siente sola" : soledad >= 40 ? "A veces se siente sola" : "Se siente sola", tone: toneOf(soledad) },
    { key: "compania", label: "Visitas", icon: MessageCircle, pct: compania, hint: `${mine.filter((a) => a.status === "visited").length} visitas en 14 días`, tone: toneOf(compania) },
    { key: "contacto", label: "Contacto", icon: PhoneCall, pct: contacto, hint: `${answered.length} de ${mine.length} llamadas contestadas`, tone: toneOf(contacto) },
  ];
  const known = items.filter((i) => i.pct != null);
  const overall = known.length ? Math.round(known.reduce((x, i) => x + (i.pct ?? 0), 0) / known.length) : null;
  return { overall, items };
}

export const overallLabel = (pct: number) => (pct >= 70 ? "Va bien" : pct >= 40 ? "Hay que vigilar" : "Necesita atención");
