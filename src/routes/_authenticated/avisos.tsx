import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen } from "@/components/oye";
import { AlertCard } from "@/components/alert-card";
import { VisitActions } from "@/components/visit-actions";
import { useMe } from "@/lib/auth";
import { forVolunteer, minutesWaiting, useAlerts, waitLabel } from "@/lib/alerts";
import { personDisplayName } from "@/lib/person-presentation";
import { PersonAvatar } from "@/components/person-avatar";

export const Route = createFileRoute("/_authenticated/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos de mi barrio · OYE" },
      { name: "description", content: "Los vecinos que necesitan compañía cerca de usted, por orden de espera." },
      { property: "og:title", content: "Avisos de mi barrio · OYE" },
      { property: "og:description", content: "Quién necesita compañía ahora, en tiempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Avisos,
});

function useTick(ms = 30_000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((x) => x + 1), ms); return () => clearInterval(t); }, [ms]);
}

function Avisos() {
  const {user}=useMe();
  const {data=[],isLoading,error}=useAlerts(true);
  const active=data.find(a=>a.volunteer_id===user.id && ["accepted","arrived"].includes(a.status));
  const open=data.filter(a=>a.status==="open");
  return <Screen title="Avisos para ti"><div className="min-h-0 flex-1 overflow-y-auto">{active&&<Link to="/" search={{sid:active.senior_id??undefined,aid:active.id}} className="tap mb-4 flex min-h-16 items-center gap-3 rounded-xl bg-secondary p-3 font-bold text-primary"><PersonAvatar id={active.senior_id} name={active.senior_name} small />Visita en curso · {personDisplayName(active.senior_name)}</Link>}{open.map(a=><Link key={a.id} to="/" search={{sid:a.senior_id??undefined,aid:a.id}} className="tap flex min-h-24 items-center gap-3 border-b py-3"><PersonAvatar id={a.senior_id} name={a.senior_name} /><span className="min-w-0 flex-1"><span className="block text-lg font-bold">{personDisplayName(a.senior_name)}</span><span className="block text-sm text-muted-foreground">{a.neighborhood} · Espera {waitLabel(minutesWaiting(a.created_at))}</span></span></Link>)}{error&&<p role="alert">No se pudieron cargar los avisos.</p>}{!isLoading&&!open.length&&<p className="py-8 text-center text-muted-foreground">No hay avisos nuevos.</p>}</div></Screen>;
}
