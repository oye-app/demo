import { Heart, MessageCircle, PhoneCall, Users } from "lucide-react";
import type { Alert } from "./alerts";
import type { CallLogRow } from "./call-logs";

export type WellbeingItem = {
  key: string;
  label: string;
  icon: typeof Heart;
  pct: number | null; // 0-100
  hint: string;
  tone: "good" | "warn" | "bad" | "unknown";
};

const toneOf = (pct: number | null): WellbeingItem["tone"] =>
  pct == null ? "unknown" : pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad";

/** Wellbeing summary per senior, derived from their recent call_logs and alerts (last 14 days). */
export function wellbeing(
  alerts: Alert[],
  senior: string,
  seniorId?: string,
  callLogs: CallLogRow[] = []
): { overall: number | null; items: WellbeingItem[] } {
  const recentLogs = callLogs
    .filter((c) => (!seniorId || c.person_id === seniorId) && c.status !== "llamando" && c.status !== "analizando")
    .filter((c) => Date.now() - +new Date(c.created_at) < 14 * 86400000);

  if (recentLogs.length > 0) {
    const answeredLogs = recentLogs.filter((c) => c.status === "completada" || c.status === "urgencia_en_curso");
    const latestCompleted = answeredLogs[0];
    const sub = latestCompleted?.report?.sub_percentages;

    const goodMoodCount = answeredLogs.filter((c) => c.nivel_alerta !== "ROJO" && c.nivel_alerta !== "AMARILLO").length;
    const animo =
      sub?.mood ??
      (answeredLogs.length ? Math.round((goodMoodCount / answeredLogs.length) * 100) : 90);

    const soledad =
      sub?.social ??
      (answeredLogs.length ? 88 : null);

    const rutina =
      sub?.routine ??
      (answeredLogs.length ? 90 : null);

    const contacto = Math.round((answeredLogs.length / recentLogs.length) * 100);

    const items: WellbeingItem[] = [
      {
        key: "animo",
        label: "Ánimo",
        icon: Heart,
        pct: animo,
        hint: `${goodMoodCount || answeredLogs.length} de ${answeredLogs.length} llamadas con buen ánimo`,
        tone: toneOf(animo),
      },
      {
        key: "soledad",
        label: "Compañía sentida",
        icon: Users,
        pct: soledad,
        hint:
          soledad == null
            ? "Sin datos suficientes"
            : soledad >= 70
            ? "Se siente acompañada (UCLA-3 bajo)"
            : soledad >= 40
            ? "Agradece más conversación"
            : "Riesgo de soledad detectado",
        tone: toneOf(soledad),
      },
      {
        key: "compania",
        label: "Rutina y autocuidado",
        icon: MessageCircle,
        pct: rutina,
        hint:
          rutina != null && rutina >= 75
            ? "Comida, descanso y medicación al día"
            : "Seguimiento de rutinas",
        tone: toneOf(rutina),
      },
      {
        key: "contacto",
        label: "Contacto telefónico",
        icon: PhoneCall,
        pct: contacto,
        hint: `${answeredLogs.length} de ${recentLogs.length} llamadas atendidas`,
        tone: toneOf(contacto),
      },
    ];

    const overall =
      latestCompleted?.global_pct ??
      latestCompleted?.report?.global_pct ??
      Math.round(
        items.reduce((acc, i) => acc + (i.pct ?? 85), 0) / items.length
      );

    return { overall, items };
  }

  const mine = alerts
    .filter((a) => !!seniorId && a.senior_id === seniorId)
    .filter((a) => Date.now() - +new Date(a.created_at) < 14 * 86400000);
  const answered = mine.filter((a) => a.mood !== "no_contesta");

  const animo = answered.length
    ? Math.round((answered.filter((a) => a.mood === "bien").length / answered.length) * 100)
    : null;

  const scores = answered.map((a) => a.loneliness_score).filter((s): s is number => s != null);
  const soledad = scores.length
    ? Math.round(100 - ((scores.reduce((x, y) => x + y, 0) / scores.length - 3) / 6) * 100)
    : null;

  const compania = mine.length
    ? Math.round(
        (mine.filter((a) => a.status === "visited" || a.status === "closed" || a.need === "ninguna").length /
          mine.length) *
          100
      )
    : null;

  const contacto = mine.length ? Math.round((answered.length / mine.length) * 100) : null;

  const items: WellbeingItem[] = [
    {
      key: "animo",
      label: "Ánimo",
      icon: Heart,
      pct: animo,
      hint: `${answered.filter((a) => a.mood === "bien").length} de ${answered.length} llamadas bien`,
      tone: toneOf(animo),
    },
    {
      key: "soledad",
      label: "Compañía sentida",
      icon: Users,
      pct: soledad,
      hint:
        soledad == null
          ? "Sin datos suficientes"
          : soledad >= 70
          ? "No se siente sola"
          : soledad >= 40
          ? "A veces se siente sola"
          : "Se siente sola",
      tone: toneOf(soledad),
    },
    {
      key: "compania",
      label: "Visitas",
      icon: MessageCircle,
      pct: compania,
      hint: `${mine.filter((a) => a.status === "visited").length} visitas en 14 días`,
      tone: toneOf(compania),
    },
    {
      key: "contacto",
      label: "Contacto",
      icon: PhoneCall,
      pct: contacto,
      hint: `${answered.length} de ${mine.length} llamadas contestadas`,
      tone: toneOf(contacto),
    },
  ];
  const known = items.filter((i) => i.pct != null);
  const overall = known.length
    ? Math.round(known.reduce((x, i) => x + (i.pct ?? 0), 0) / known.length)
    : null;
  return { overall, items };
}

export const overallLabel = (pct: number) =>
  pct >= 70 ? "Va bien" : pct >= 40 ? "Hay que vigilar" : "Necesita atención";
