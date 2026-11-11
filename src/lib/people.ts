import { queryOptions, useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "./auth";

export type Person = { id: string; name: string; relation: string };
export function personSearch(input: Record<string, unknown>): { sid?: string | undefined; aid?: string | undefined } {
  return { sid: typeof input['sid'] === "string" ? input['sid'] : undefined, aid: typeof input['aid'] === "string" ? input['aid'] : undefined };
}
export const peopleQuery = (userId: string) => queryOptions({
  queryKey: ["people", userId],
  queryFn: async (): Promise<Person[]> => {
    const { data, error } = await supabase.rpc("person_options");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 0,
  refetchInterval: 15000,
});
export function usePeople() {
  const { user } = useMe();
  return useQuery(peopleQuery(user.id));
}
export function usePersonId() {
  const search = useLocation({ select: (l) => l.searchStr });
  return new URLSearchParams(search).get("sid") ?? undefined;
}
export function usePerson() {
  const sid = usePersonId();
  const query = usePeople();
  return { ...query, person: query.data?.find((p) => p.id === sid), sid };
}
export function matchesPerson(record: { senior_id?: string | null }, id: string) {
  return record.senior_id === id;
}