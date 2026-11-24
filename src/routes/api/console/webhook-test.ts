import dns from "node:dns/promises";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isPrivateOrReservedIp, signPayloadHmacSha256, validateWebhookTargetUrl } from "@/lib/console";

const bodySchema = z.object({
  targetUrl: z.string().trim().url(),
  payload: z.unknown(),
  secret: z.string().trim().min(4).max(128).optional().default("oye-b2b-sandbox-key"),
});

export const Route = createFileRoute("/api/console/webhook-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") || "";
        if (!authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "Autenticación Bearer requerida" }, { status: 401 });
        }
        const token = authHeader.slice(7).trim();
        if (token.split(".").length !== 3) {
          return Response.json({ error: "Token inválido" }, { status: 401 });
        }

        const supabaseUrl =
          process.env["SUPABASE_URL"] ||
          process.env["VITE_SUPABASE_URL"] ||
          "https://lkbplpptjkajtyvcdier.supabase.co";
        const publishableKey =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          "sb_publishable_EOAC2YZxklma9wEymgtgog_1s4PGOGv";

        const sb = createClient(supabaseUrl, publishableKey, {
          global: {
            headers: {
              apikey: publishableKey,
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            storage: undefined,
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data: userData, error: userErr } = await sb.auth.getUser(token);
        if (userErr || !userData?.user) {
          return Response.json({ error: "Sesión no válida" }, { status: 401 });
        }

        const { data: isOp, error: opErr } = await sb.rpc("is_console_operator");
        if (opErr || !isOp) {
          return Response.json({ error: "Solo operadores autorizados de la Consola NGO" }, { status: 403 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Body JSON inválido" }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { error: "Parámetros inválidos", issues: parsed.error.issues },
            { status: 400 }
          );
        }

        const check = validateWebhookTargetUrl(parsed.data.targetUrl);
        if (!check.ok) {
          return Response.json({ error: check.reason }, { status: 400 });
        }

        // Resolve DNS on server to prevent DNS rebinding / internal IP SSRF
        const hostname = check.url.hostname.replace(/^\[|\]$/g, "");
        try {
          const resolved = await dns.lookup(hostname, { all: true });
          if (!resolved.length || resolved.some((r) => isPrivateOrReservedIp(r.address))) {
            return Response.json(
              { error: "El destino resuelve a una red privada o no pública (bloqueado por SSRF)." },
              { status: 400 }
            );
          }
        } catch {
          return Response.json({ error: "No se pudo resolver el dominio HTTPS destino." }, { status: 400 });
        }

        const bodyText = JSON.stringify(parsed.data.payload);
        if (bodyText.length > 100_000) {
          return Response.json({ error: "Payload demasiado grande (máx 100KB)." }, { status: 400 });
        }

        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = await signPayloadHmacSha256(bodyText, parsed.data.secret);

        const t0 = Date.now();
        try {
          const upstream = await fetch(check.url.toString(), {
            method: "POST",
            redirect: "manual",
            signal: AbortSignal.timeout(5000),
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "OYE-Console-B2B-Webhook/1.0",
              "X-OYE-Signature": signature,
              "X-OYE-Timestamp": timestamp,
            },
            body: bodyText,
          });
          const latencyMs = Date.now() - t0;
          const preview = (await upstream.text().catch(() => "")).slice(0, 300);
          return Response.json({
            ok: upstream.ok,
            status: upstream.status,
            statusText: upstream.statusText,
            latencyMs,
            signature,
            timestamp,
            responsePreview: preview,
          });
        } catch (err) {
          return Response.json(
            {
              error: err instanceof Error ? err.message : "Error de red al conectar con el webhook",
              latencyMs: Date.now() - t0,
              signature,
            },
            { status: 502 }
          );
        }
      },
    },
  },
});
