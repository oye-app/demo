-- Migration 0019: Add SELECT grant and RLS policy for call_logs table
grant select on public.call_logs to anon, authenticated;

drop policy if exists "Authorized call_logs read" on public.call_logs;
drop policy if exists "Public call_logs read" on public.call_logs;

create policy "Authorized call_logs read" on public.call_logs
  for select to anon, authenticated
  using (true);
