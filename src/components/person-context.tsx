import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Screen, btn } from "./oye";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { usePerson } from "@/lib/people";
import { personSection } from "@/lib/person-navigation";
import { PersonAvatar } from "./person-avatar";
import { personDisplayName } from "@/lib/person-presentation";

export function PersonGate({ children, privateData = false }: { children: ReactNode; privateData?: boolean }) {
  const { user } = useMe();
  const { person, data: people = [], isPending, error } = usePerson();
  const path = useLocation({ select: (location) => location.pathname });
  const section = personSection(path);
  const access=useQuery({queryKey:["person-access",user.id,person?.id],queryFn:async()=>{if(!person)return false;const r=await supabase.rpc("can_care",{_sid:person.id});if(r.error)throw r.error;return !!r.data;},enabled:privateData && !!person,staleTime:0});
  if(privateData && person && access.isPending) return <Screen><p role="status">Comprobando acceso…</p></Screen>;
  if(privateData && person && !access.data) return <Screen><p className="py-8">No tienes acceso a la ficha ni a las llamadas de esta persona.</p><Link to="/" className={btn()}>Volver a mis personas</Link></Screen>;
  if (isPending) return <Screen><p role="status" className="py-8 text-center text-muted-foreground">Cargando persona…</p></Screen>;
  if (!person) return <Screen {...(section === "/llamada" ? { title: "Llamada" } : section === "/historial" ? { title: "Historial" } : {})}>
    <h1 className="mt-5 text-2xl font-extrabold">{error ? "No pudimos cargar las personas" : "Elige una persona"}</h1>
    {error ? <Link to="/" className={`mt-5 ${btn()}`}>Mis personas</Link> : <ul className="mt-4 divide-y">
      {people.map((option) => <li key={option.id}><Link to={section} search={{ sid: option.id, aid: undefined }} className="tap flex min-h-20 items-center gap-3 py-4">
        <PersonAvatar id={option.id} name={option.name} />
        <span className="min-w-0 flex-1"><span className="block truncate text-lg font-bold">{personDisplayName(option.name)}</span>{option.relation && <span className="block text-sm text-muted-foreground">{option.relation}</span>}</span>
        <ChevronRight className="size-5 shrink-0 text-primary" />
      </Link></li>)}
      {!people.length && <li className="py-8 text-muted-foreground">No tienes personas disponibles.<Link to="/" className={`mt-5 ${btn()}`}>Mis personas</Link></li>}
    </ul>}
  </Screen>;
  return <Fragment key={person.id}>{children}</Fragment>;
}