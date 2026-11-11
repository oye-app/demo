-- Migration 0019: Add RLS policy for call_logs table
-- Allows authenticated users to select call logs for seniors they are authorized to care for.

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'call_logs' and policyname = 'Authorized call_logs read'
  ) then
    create policy "Authorized call_logs read" on public.call_logs
      for select to authenticated
      using (
        case 
          when person_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then public.can_care(person_id::uuid)
          else true 
        end
      );
  end if;
end $$;
