import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sameArea, type Alert } from "@/lib/alerts";
import { usePeople } from "@/lib/people";
import { fetchAlerts } from "@/lib/alerts";
import { useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/auth";
import { personDisplayName } from "@/lib/person-presentation";

/** Decide whether this person should hear about an alert change, and what to say. Pure for testing. */
export function notificationFor(p: Pick<Profile, "persona" | "senior_name" | "neighborhood">, userId: string, a: Alert, isNew: boolean, authorizedIds: string[] = []): string | null {
  const name = personDisplayName(a.senior_name);
  if (p.persona === "familia") {
    if (!a.senior_id || !authorizedIds.includes(a.senior_id)) return null;
    if (isNew) return a.status === "closed" ? `OYE ha llamado a ${name}: está bien.` : `OYE ha llamado a ${name}. Estamos avisando a un vecino.`;
    if (a.status === "accepted") return `${a.volunteer_name} va de camino a ver a ${name}.`;
    if (a.status === "arrived") return `${a.volunteer_name} ya está con ${name}.`;
    if (a.status === "visited") return `Visita hecha: ${a.volunteer_name} ha estado con ${name}.`;
    return null;
  }
  if (p.persona === "voluntario") {
    const near = !p.neighborhood || !a.neighborhood || sameArea(a.neighborhood, p.neighborhood);
    if (a.status === "open" && near && (isNew || !a.volunteer_id)) return `${name} necesita compañía cerca de usted.`;
    return null;
  }
  // ONG: new alerts that need a human
  if (isNew && a.status === "open") return `Nuevo aviso: ${name}${a.mood === "no_contesta" ? " no contesta" : " necesita compañía"}.`;
  return null;
}

export function AlertNotifier({ profile, userId }: { profile: Profile; userId: string }) {
  const { data: people = [] } = usePeople();
  const ids = useRef<string[]>([]); ids.current = people.map((p)=>p.id);
  const qc = useQueryClient();
  const ref = useRef(profile);
  ref.current = profile;
  useEffect(() => {
    let previous = new Map<string,string>();
    let initialized = false;
    let stopped = false;
    const poll = async () => {
      try {
        const alerts = await fetchAlerts();
        if(stopped) return;
        for(const a of alerts) {
          const old = previous.get(a.id);
          if(initialized && old !== a.status && !(a.volunteer_id===userId && old)) {
            const text = notificationFor(ref.current,userId,a,!old,ids.current);
            if(text) toast(text, {action: {label:"Abrir",onClick:()=> { if(a.senior_id) window.location.assign(`/?sid=${encodeURIComponent(a.senior_id)}${ref.current.persona==="voluntario" ? `&aid=${encodeURIComponent(a.id)}` : ""}`); }}});
          }
        }
        previous = new Map(alerts.map((a)=>[a.id,a.status])); initialized=true;
        void qc.invalidateQueries({queryKey:["alerts"]});
        void qc.invalidateQueries({queryKey:["people"]});
      } catch { /* retry on next tick */ }
    };
    void poll();
    const timer = setInterval(poll,15000);
    const ch = supabase
      .channel(`alerts-notify-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const a = payload.new as Alert;
        const old = payload.old as Partial<Alert>;
        if (payload.eventType === "UPDATE" && old.status === a.status) return;
        if (a.volunteer_id === userId && payload.eventType === "UPDATE") return; // own actions
        const text = notificationFor(ref.current, userId, a, payload.eventType === "INSERT",ids.current);
        if (!text) return;
        previous.set(a.id,a.status);
        toast(text);
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
          try { new Notification("OYE", { body: text, tag: a.id }); } catch { /* some browsers need SW */ }
        }
      })
      .subscribe();
    return () => { stopped=true; clearInterval(timer); void supabase.removeChannel(ch); };
  }, [userId,qc]);
  return null;
}
