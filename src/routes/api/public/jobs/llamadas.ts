import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const BATCH = 10;

function madridNow() {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p["weekday"] ?? "") + 1;
  return { date: `${p["year"]}-${p["month"]}-${p["day"]}`, hour: Number(p["hour"]), dow };
}

export const Route = createFileRoute("/api/public/jobs/llamadas")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;

        const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
        const { runCallAnalysis, AiError } = await import("@/lib/call.server");
        const { SCENARIOS } = await import("@/lib/scenarios");

        const { data: state } = await sb.from("call_job_state").select("*").eq("id", 1).single();
        const probe = !!state?.paused_reason; // paused: at most one probe item per run

        // Single-flight lease
        const until = new Date(Date.now() + 5 * 60_000).toISOString();
        const { data: lock } = await sb.from("call_job_state").update({ locked_until: until })
          .eq("id", 1).or(`locked_until.is.null,locked_until.lt.${new Date().toISOString()}`).select("id");
        if (!lock?.length) return Response.json({ skipped: "locked" });

        const now = madridNow();
        let done = 0;
        try {
          const { data: due } = await sb.from("call_schedules").select("*")
            .eq("active", true).lte("call_hour", now.hour).contains("days", [now.dow])
            .or(`last_run_on.is.null,last_run_on.lt.${now.date}`).limit(probe ? 1 : BATCH);

          for (const s of due ?? []) {
            if (!s.senior_id) { await sb.from("call_schedules").update({ active: false, last_error: "Pendiente de verificar la persona" }).eq("id",s.id); continue; }
            // Mark first so a crash never repeats the same call today.
            await sb.from("call_schedules").update({ last_run_on: now.date, last_error: "" }).eq("id", s.id);
            const r = Math.random();
            const key = r < 0.5 ? "bien" : r < 0.75 ? "compania" : r < 0.92 ? "bajo" : "no_contesta";
            try {
              await runCallAnalysis(sb, s.created_by, { seniorId: s.senior_id, seniorName: s.senior_name, lines: SCENARIOS[key].lines(s.senior_name) });
              done++;
              if (probe) await sb.from("call_job_state").update({ paused_reason: "" }).eq("id", 1);
            } catch (e) {
              const status = e instanceof AiError ? e.status : 500;
              await sb.from("call_schedules").update({ last_error: (e as Error).message, last_run_on: status === 429 || status >= 500 ? null : now.date }).eq("id", s.id);
              if (status === 402 || status === 403) {
                await sb.from("call_job_state").update({ paused_reason: (e as Error).message }).eq("id", 1);
                break;
              }
              if (status === 429) break;
            }
          }
        } finally {
          await sb.from("call_job_state").update({ locked_until: null }).eq("id", 1);
        }
        return Response.json({ success: true, done });
      },
    },
  },
});
