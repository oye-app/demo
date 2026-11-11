import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const STATUS = ["llamando", "urgencia_en_curso", "analizando", "completada", "rechazada", "no_contesta", "error"] as const;
const FINAL = ["completada", "rechazada", "no_contesta"];
const IN_PROGRESS = ["llamando", "analizando"];

const bodySchema = z.object({
  conversation_id: z.string().trim().min(1).max(200),
  call_sid: z.string().max(200).nullish(),
  person_id: z.string().trim().min(1).max(200).optional(),
  nombre: z.string().max(200).nullish(),
  telefono_usuario: z.string().max(50).nullish(),
  status: z.enum(STATUS).optional(),
  motivo: z.string().max(2000).nullish(),
  duracion_seg: z.coerce.number().int().min(0).max(86400).nullish(),
  llamada_inicio: z.string().datetime({ offset: true }).nullish(),
  nivel_alerta: z.enum(["VERDE", "AMARILLO", "ROJO"]).nullish(),
  global_pct: z.coerce.number().int().min(0).max(100).nullish(),
  activar_protocolo_voy_yo: z.boolean().nullish(),
  acepta_llamada: z.boolean().nullish(),
  acepta_llamadas_diarias: z.boolean().nullish(),
  report: z.unknown().optional(),
});

const querySchema = z.object({
  person_id: z.string().trim().min(1).max(200),
  exclude_conversation_id: z.string().trim().min(1).max(200).optional(),
});

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function authorized(request: Request) {
  const secret = process.env["CALL_LOGS_WEBHOOK_SECRET"];
  const given = request.headers.get("x-webhook-secret") ?? "";
  return !!secret && safeEqual(given, secret);
}

const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });

export const Route = createFileRoute("/api/public/call-logs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return unauthorized();
        const url = new URL(request.url);
        const parsed = querySchema.safeParse({
          person_id: url.searchParams.get("person_id") ?? undefined,
          exclude_conversation_id: url.searchParams.get("exclude_conversation_id") || undefined,
        });
        if (!parsed.success) return Response.json({ error: "person_id es obligatorio", issues: parsed.error.issues }, { status: 400 });

        const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
        let q = sb.from("call_logs").select("*").eq("person_id", parsed.data.person_id);
        if (parsed.data.exclude_conversation_id) q = q.neq("conversation_id", parsed.data.exclude_conversation_id);
        const { data, error } = await q.order("created_at", { ascending: false }).limit(3);
        if (error) return Response.json({ error: "No se pudo leer" }, { status: 500 });
        return Response.json({ ok: true, count: data.length, calls: data });
      },
      POST: async ({ request }) => {
        if (!authorized(request)) return unauthorized();

        let json: unknown;
        try { json = await request.json(); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) return Response.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });

        // Omitted fields are kept; explicit null clears the value.
        const row: Record<string, unknown> = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));

        const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
        const { data: existing } = await sb.from("call_logs").select("id, status").eq("conversation_id", parsed.data.conversation_id).maybeSingle();

        if (existing) {
          let statusIgnored = false;
          if (existing.status && FINAL.includes(existing.status) && row["status"] && IN_PROGRESS.includes(row["status"] as string)) {
            delete row["status"];
            statusIgnored = true;
          }
          const { data, error } = await sb.from("call_logs").update(row as never).eq("id", existing.id).select("*").single();
          if (error) return Response.json({ error: "No se pudo actualizar" }, { status: 500 });
          return Response.json({ ok: true, action: "updated", status_ignored: statusIgnored, data });
        }
        if (!parsed.data.person_id) return Response.json({ error: "person_id es obligatorio para un registro nuevo" }, { status: 400 });
        const { data, error } = await sb.from("call_logs").insert(row as never).select("*").single();
        if (error) return Response.json({ error: "No se pudo guardar" }, { status: 500 });
        return Response.json({ ok: true, action: "inserted", status_ignored: false, data }, { status: 201 });
      },
    },
  },
});
