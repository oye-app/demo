import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { personRequestSchema } from "./person-request";
import { addDemoPersonRecord } from "./person-add";
import { z } from "zod";
import { personDeleteSchema, personUpdateSchema } from "./person-manage";

export const getPersonDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: details, error } = await context.supabase.rpc("person_edit_details", { _sid: data.id });
    if (error) throw new Error("No se pudieron cargar los datos.");
    if (!details) return null;
    return z.object({ id: z.string(), requested_name: z.string(), requested_phone: z.string(), requested_age: z.number().nullable(), relation: z.string() }).parse(details);
  });

export const updatePerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => personUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("manage_person", { _sid: data.id, _delete: false, _name: data.requested_name, _phone: data.requested_phone, _age: data.requested_age, _relation: data.relation });
    if (error) throw new Error("No se pudieron guardar los cambios.");
    return { ok: true };
  });

export const deletePerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => personDeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("manage_person", { _sid: data.id, _delete: true });
    if (error) throw new Error(error.message === "Active visit" ? "Finalice la visita activa antes de eliminar a esta persona." : "No se pudo eliminar la persona.");
    return { ok: true };
  });

export const addPerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => personRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: membership, error } = await context.supabase.from("demo_members").select("kind").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error("No se pudo comprobar el acceso.");
    const id = await addDemoPersonRecord(data, membership?.kind ?? null, async (details) => {
      const { data: id, error } = await context.supabase.rpc("add_demo_person", {
        _name: details.requested_name, _phone: details.requested_phone,
        _age: details.requested_age, _relation: details.relation,
      });
      if (error || !id) throw new Error("No se pudo añadir la persona.");
      return id;
    });
    return { id };
  });