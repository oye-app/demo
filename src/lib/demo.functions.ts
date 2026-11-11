import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_PERSON_IDS } from "./person-presentation";

/** Three shared demo accounts (no admin rights) so anyone can try each role in one tap. */
const DEMO = {
  familia: { email: "familia@demo.oye.app", full_name: "Lucía Martín", neighborhood: "Chamberí", senior_name: "Carmen", senior_relation: "Madre" },
  voluntario: { email: "voluntario@demo.oye.app", full_name: "Javier Ruiz", neighborhood: "Chamberí", senior_name: "", senior_relation: "" },
  ong: { email: "ong@demo.oye.app", full_name: "Ana Torres", neighborhood: "Asociación Vecinal Chamberí", senior_name: "", senior_relation: "" },
} as const;
const PASSWORD = "oye-demo-2026";

export const demoAccess = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ persona: z.enum(["familia", "voluntario", "ong"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const d = DEMO[data.persona];
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let id = list?.users.find((u) => u.email === d.email)?.id;
    if (!id) {
      const { data: c, error } = await supabaseAdmin.auth.admin.createUser({ email: d.email, password: PASSWORD, email_confirm: true });
      if (error || !c.user) throw new Error("No se pudo preparar la demo.");
      id = c.user.id;
    }
    const { error: memberError } = await supabaseAdmin.from("demo_members").upsert({ user_id:id,kind:data.persona });
    if (memberError) throw new Error("No se pudo preparar la demo.");
    // Demo accounts must never hold admin rights.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({ id, persona: data.persona, phone: "", full_name: d.full_name, neighborhood: d.neighborhood, senior_name: d.senior_name, senior_relation: d.senior_relation });
    if (profileError) throw new Error("No se pudo preparar la demo.");
    if (data.persona === "familia") {
      const { data: carmen, error: personError } = await supabaseAdmin.from("seniors").select("id,active").eq("id", DEMO_PERSON_IDS.carmen).eq("is_demo", true).maybeSingle();
      if (personError || !carmen) throw new Error("No se pudo preparar a Carmen.");
      const { error: linkError } = carmen.active ? await supabaseAdmin.from("person_links").upsert({ user_id: id, senior_id: carmen.id, requested_name: "Carmen", relation: "Madre", status: "approved" }, { onConflict: "user_id,senior_id", ignoreDuplicates: true }) : { error: null };
      if (linkError) throw new Error("No se pudo vincular a Carmen.");
    }
    return { email: d.email, password: PASSWORD };
  });
