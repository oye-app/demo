import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.object({
  person_id: z.string().trim().min(1),
});

export const Route = createFileRoute("/api/start-call")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }

        const parsed = requestSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "person_id es obligatorio", issues: parsed.error.issues }, { status: 400 });
        }

        const personId = parsed.data.person_id;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Load person details
        const { data: senior, error: seniorError } = await supabaseAdmin
          .from("seniors")
          .select("id, name, phone, age")
          .eq("id", personId)
          .maybeSingle();

        if (seniorError || !senior) {
          return Response.json({ error: "Persona no encontrada" }, { status: 404 });
        }

        // Load relation
        const { data: link } = await supabaseAdmin
          .from("person_links")
          .select("relation")
          .eq("senior_id", personId)
          .maybeSingle();

        const relationship = link?.relation || "Familiar";

        // Format phone to E.164 without spaces
        let rawPhone = (senior.phone || "").replace(/[^\d+]/g, "");
        if (!rawPhone) {
          return Response.json({ error: "Teléfono no registrado" }, { status: 400 });
        }
        if (rawPhone.startsWith("00")) {
          rawPhone = "+" + rawPhone.slice(2);
        } else if (!rawPhone.startsWith("+")) {
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

        const makeUrl = process.env["MAKE_START_CALL_URL"];
        if (!makeUrl) {
          // Fallback in dev: record a calling row so UI can test
          const fakeConvId = `dev-${crypto.randomUUID()}`;
          await supabaseAdmin.from("call_logs").insert({
            conversation_id: fakeConvId,
            person_id: senior.id,
            nombre: senior.name.split(" ")[0],
            telefono_usuario: rawPhone,
            status: "llamando",
          });
          return Response.json({
            ok: true,
            conversation_id: fakeConvId,
            call_sid: "dev-mock-sid",
            mocked: true,
          });
        }

        try {
          const makeRes = await fetch(makeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!makeRes.ok) {
            const err = await makeRes.text();
            return Response.json({ error: "Error de Make S1", details: err }, { status: 502 });
          }

          const makeData = (await makeRes.json().catch(() => ({}))) as {
            ok?: boolean;
            conversation_id?: string;
            call_sid?: string;
          };

          return Response.json({
            ok: true,
            conversation_id: makeData.conversation_id ?? null,
            call_sid: makeData.call_sid ?? null,
          });
        } catch (err) {
          return Response.json({ error: "No se pudo conectar con Make", details: String(err) }, { status: 500 });
        }
      },
    },
  },
});
