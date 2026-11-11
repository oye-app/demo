import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Persona = "familia" | "voluntario" | "ong";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { user: null, profile: null as Profile | null };
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    return { user: { id: u.user.id, email: u.user.email ?? "" }, profile };
  },
  staleTime: 60_000,
});

export function useMe() {
  const { data } = useSuspenseQuery(meQuery);
  return data as { user: { id: string; email: string }; profile: Profile };
}

export const PERSONAS: Record<Persona, { label: string; hint: string }> = {
  familia: { label: "Soy familia", hint: "Quiero saber cómo está mi madre, padre o abuelo" },
  voluntario: { label: "Soy vecino voluntario", hint: "Quiero acompañar a mayores de mi barrio" },
  ong: { label: "Soy de una ONG", hint: "Coordino avisos y voluntarios" },
};
