ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS neighborhood text NOT NULL DEFAULT '';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS arrived_at timestamptz;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS visited_at timestamptz;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS visit_note text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.accept_alert(_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare n text;
begin
  select full_name into n from public.profiles where id = auth.uid() and persona in ('voluntario','ong');
  if n is null then return false; end if;
  -- one active visit at a time per volunteer
  if exists (select 1 from public.alerts where volunteer_id = auth.uid() and status in ('accepted','arrived')) then return false; end if;
  update public.alerts set status = 'accepted', volunteer_id = auth.uid(), volunteer_name = split_part(n, ' ', 1), accepted_at = now()
    where id = _id and status = 'open';
  return found;
end $$;

CREATE OR REPLACE FUNCTION public.arrive_alert(_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  update public.alerts set status = 'arrived', arrived_at = now()
    where id = _id and status = 'accepted' and volunteer_id = auth.uid();
  return found;
end $$;

CREATE OR REPLACE FUNCTION public.release_alert(_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  update public.alerts set status = 'open', volunteer_id = null, volunteer_name = '', accepted_at = null, arrived_at = null
    where id = _id and status in ('accepted','arrived') and volunteer_id = auth.uid();
  return found;
end $$;

DROP FUNCTION IF EXISTS public.complete_alert(uuid);
CREATE OR REPLACE FUNCTION public.complete_alert(_id uuid, _note text DEFAULT '')
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
begin
  update public.alerts set status = 'visited', visited_at = now(), arrived_at = coalesce(arrived_at, now()), visit_note = left(coalesce(_note, ''), 280)
    where id = _id and status in ('accepted','arrived') and volunteer_id = auth.uid();
  return found;
end $$;

REVOKE EXECUTE ON FUNCTION public.arrive_alert(uuid), public.release_alert(uuid), public.complete_alert(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.arrive_alert(uuid), public.release_alert(uuid), public.complete_alert(uuid, text) TO authenticated;