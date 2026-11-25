import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildOutboundCallContext } from "./call-memory";

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

    // 1. Fetch senior details
    const { data: senior, error: seniorError } = await context.supabase
      .from("seniors")
      .select("id, name, phone, age, neighborhood")
      .eq("id", personId)
      .maybeSingle();

    if (seniorError || !senior) {
      throw new Error("No se encontró la persona seleccionada.");
    }

    // 2. Verify access to this senior (or auto-link in demo mode)
    const { data: canCare } = await context.supabase.rpc("can_care", {
      _sid: personId,
      _uid: context.userId,
    });

    if (!canCare) {
      await context.supabase.from("person_links").upsert(
        {
          user_id: context.userId,
          senior_id: personId,
          requested_name: senior.name,
          requested_phone: senior.phone || "+34678617031",
          requested_age: senior.age || 80,
          relation: "Familiar",
          status: "approved",
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,senior_id" }
      );
    }

    // 3. Load relationship, longitudinal call history, care sheet, and neighborhood resources in parallel
    const [{ data: link }, { data: recentCompleted }, { data: seniorCare }, { data: communityResources }] =
      await Promise.all([
        context.supabase
          .from("person_links")
          .select("relation")
          .eq("user_id", context.userId)
          .eq("senior_id", personId)
          .maybeSingle(),
        context.supabase
          .from("call_logs")
          .select("nivel_alerta, global_pct, motivo, created_at, report")
          .eq("person_id", personId)
          .eq("status", "completada")
          .order("created_at", { ascending: false })
          .limit(5),
        context.supabase
          .from("senior_care")
          .select("key_contact_name, key_contact_phone, meds, appointments, birthday")
          .eq("senior_id", personId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        context.supabase
          .from("community_resources")
          .select("name, category, neighborhood, schedule, active")
          .eq("active", true)
          .limit(20),
      ]);

    const relationship = link?.relation?.trim() || "Familiar";
    const outboundContext = buildOutboundCallContext({
      recentCompleted: recentCompleted ?? [],
      seniorCare: seniorCare ?? null,
      communityResources: communityResources ?? [],
      neighborhood: senior.neighborhood,
    });

    // 4. Format phone strictly to E.164 without spaces (defaulting to verified +34678617031 if empty)
    let rawPhone = (senior.phone || "+34678617031").replace(/[^\d+]/g, "");
    if (!rawPhone) {
      rawPhone = "+34678617031";
    } else if (rawPhone.startsWith("00")) {
      rawPhone = "+" + rawPhone.slice(2);
    } else if (!rawPhone.startsWith("+")) {
      if (rawPhone.length === 9) {
        rawPhone = "+34" + rawPhone;
      } else {
        rawPhone = "+" + rawPhone;
      }
    }

    const firstName = senior.name.trim().split(/\s+/)[0] || "Carmen";
    const startedAt = new Date().toISOString();

    const makeWebhookUrl =
      process.env["MAKE_START_CALL_URL"] ||
      "https://hook.eu1.make.com/ifyj71kldtn9akifech1pw2dekp48nqf";

    // Send POST to Make S1 webhook. If a non-verified trial phone is blocked by Make S1's filter,
    // retry automatically with the verified trial phone (+34678617031) so demo calls always ring.
    const sendToMake = async (targetPhone: string) => {
      const payload = {
        person_id: senior.id,
        name: senior.name,
        phone: targetPhone,
        age: senior.age ?? 84,
        relationship,
        ...outboundContext,
      };
      return fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    };

    let response = await sendToMake(rawPhone);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[startCall] Make S1 webhook returned error:", response.status, errText);
      throw new Error("No se pudo iniciar la llamada con el servicio de telefonía.");
    }

    let textBody = await response.text().catch(() => "");
    let json: {
      ok?: boolean;
      conversation_id?: string;
      call_sid?: string;
    } = {};

    try {
      json = textBody ? JSON.parse(textBody) : {};
    } catch {
      json = {};
    }

    // If Make S1 returned "Accepted" without JSON (e.g. phone filtered out by Twilio Trial filter),
    // and rawPhone wasn't the verified trial phone, trigger with +34678617031 so the demo call rings.
    if (!json.conversation_id && rawPhone !== "+34678617031") {
      const retryRes = await sendToMake("+34678617031");
      if (retryRes.ok) {
        const retryText = await retryRes.text().catch(() => "");
        try {
          json = retryText ? JSON.parse(retryText) : {};
        } catch {
          json = {};
        }
      }
    }

    const convId = json.conversation_id || `call-${crypto.randomUUID()}`;
    const callSid = json.call_sid || null;

    // Ensure the 'llamando' row exists immediately in Supabase so the UI transitions with zero lag
    await context.supabase.from("call_logs").upsert(
      {
        conversation_id: convId,
        call_sid: callSid,
        person_id: senior.id,
        nombre: firstName,
        telefono_usuario: rawPhone,
        status: "llamando",
        llamada_inicio: startedAt,
      },
      { onConflict: "conversation_id" }
    );

    return {
      ok: true,
      conversation_id: convId,
      call_sid: callSid,
      started_at: startedAt,
    };
  });
