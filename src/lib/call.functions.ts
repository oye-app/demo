import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  seniorId: z.string().uuid(),
  seniorName: z.string().trim().min(1).max(100),
  lines: z.array(z.object({ who: z.enum(["oye", "mayor"]), text: z.string().max(500) })).min(1).max(30),
});

export type CallAnalysis = {
  mood: "bien" | "bajo" | "no_contesta";
  need: "ninguna" | "compania" | "llamada" | "visita";
  summary: string;
  signals: string[];
  memory: string;
  trend: "mejor" | "igual" | "peor" | "nuevo";
  loneliness: number;
  durationMin: number;
  alertId: string | null;
  familyNotified: boolean;
};

export const analyzeCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data, context }): Promise<CallAnalysis> => {
    const { runCallAnalysis } = await import("./call.server");
    return runCallAnalysis(context.supabase, context.userId, data);
  });

/**
 * Backend function to initiate a real outbound call via Make scenario S1 (Contract A).
 * Receives personId, loads person details, formats phone into E.164,
 * and POSTs { person_id, name, phone, age, relationship } to MAKE_START_CALL_URL.
 */
export const startCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ personId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { personId } = data;

    // 1. Verify access to this senior
    const { data: canCare } = await context.supabase.rpc("can_care", {
      _sid: personId,
      _uid: context.userId,
    });
    if (!canCare) {
      throw new Error("No tiene autorización para llamar a esta persona.");
    }

    // 2. Fetch senior details
    const { data: senior, error: seniorError } = await context.supabase
      .from("seniors")
      .select("id, name, phone, age")
      .eq("id", personId)
      .maybeSingle();

    if (seniorError || !senior) {
      throw new Error("No se encontró la persona seleccionada.");
    }

    // 3. Fetch relationship from person_links or senior_family_links
    const { data: link } = await context.supabase
      .from("person_links")
      .select("relation")
      .eq("user_id", context.userId)
      .eq("senior_id", personId)
      .maybeSingle();

    const relationship = link?.relation?.trim() || "Familiar";

    // 4. Format phone strictly to E.164 without spaces
    let rawPhone = (senior.phone || "").replace(/[^\d+]/g, "");
    if (!rawPhone) {
      throw new Error("La persona no tiene un número de teléfono registrado.");
    }
    if (rawPhone.startsWith("00")) {
      rawPhone = "+" + rawPhone.slice(2);
    } else if (!rawPhone.startsWith("+")) {
      // Default to Spain prefix +34 if 9 digits
      if (rawPhone.length === 9) {
        rawPhone = "+34" + rawPhone;
      } else {
        rawPhone = "+" + rawPhone;
      }
    }

    const payload = {
      person_id: senior.id,
      name: senior.name,
      phone: rawPhone,
      age: senior.age ?? null,
      relationship,
    };

    const makeWebhookUrl = process.env["MAKE_START_CALL_URL"];
    if (!makeWebhookUrl) {
      console.warn(
        "[startCall] MAKE_START_CALL_URL no está configurada en las variables de entorno. Registrando llamada localmente para desarrollo."
      );
      // In local dev without Make URL, we can record a row so the UI can demonstrate the flow
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const fakeConversationId = `dev-${crypto.randomUUID()}`;
      await supabaseAdmin.from("call_logs").insert({
        conversation_id: fakeConversationId,
        person_id: senior.id,
        nombre: senior.name.split(" ")[0],
        telefono_usuario: rawPhone,
        status: "llamando",
      });
      return {
        ok: true,
        conversation_id: fakeConversationId,
        call_sid: "dev-mock-sid",
        mocked: true,
      };
    }

    // 5. POST to Make webhook
    const response = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[startCall] Make S1 webhook returned error:", response.status, errText);
      throw new Error("No se pudo iniciar la llamada con el servicio de telefonía.");
    }

    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      conversation_id?: string;
      call_sid?: string;
    };

    return {
      ok: true,
      conversation_id: json.conversation_id ?? null,
      call_sid: json.call_sid ?? null,
    };
  });
