-- === drizzle/migrations/0000_admin_data.sql ===
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- First user to sign up becomes admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_first_admin after insert on auth.users
  for each row execute function public.handle_first_admin();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Organization (single row)
create table public.organization (
  id int primary key default 1 check (id = 1),
  name text not null default 'Mi ONG',
  neighborhood text not null default '',
  phone text not null default '',
  email text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.organization to anon, authenticated;
grant insert, update on public.organization to authenticated;
grant all on public.organization to service_role;
alter table public.organization enable row level security;
create policy "Anyone reads organization" on public.organization for select to anon, authenticated using (true);
create policy "Admins insert organization" on public.organization for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update organization" on public.organization for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger org_touch before update on public.organization for each row execute function public.touch_updated_at();

-- Seniors
create table public.seniors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int,
  phone text not null default '',
  address text not null default '',
  family_contact text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.seniors to authenticated;
grant all on public.seniors to service_role;
alter table public.seniors enable row level security;
create policy "Admins manage seniors" on public.seniors for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger seniors_touch before update on public.seniors for each row execute function public.touch_updated_at();

-- Volunteers
create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  neighborhood text not null default '',
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.volunteers to authenticated;
grant all on public.volunteers to service_role;
alter table public.volunteers enable row level security;
create policy "Admins manage volunteers" on public.volunteers for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger volunteers_touch before update on public.volunteers for each row execute function public.touch_updated_at();

-- Public demo views: only first name + age / first name, never contact data
create or replace function public.demo_people()
returns table (name text, age int) language sql stable security definer set search_path = public as $$
  select split_part(name, ' ', 1), age from public.seniors where active order by created_at limit 6
$$;
create or replace function public.demo_volunteer()
returns text language sql stable security definer set search_path = public as $$
  select split_part(name, ' ', 1) from public.volunteers where available order by created_at limit 1
$$;
grant execute on function public.demo_people() to anon, authenticated;
grant execute on function public.demo_volunteer() to anon, authenticated;

insert into public.organization (id, name, neighborhood, phone, email)
values (1, 'ONG de ejemplo', 'Barrio Universidad', '', '');
insert into public.seniors (name, age, address) values
  ('Carmen López', 84, 'Calle del Pez'),
  ('Antonio Ruiz', 79, ''),
  ('Pilar Gómez', 88, ''),
  ('Manuel Díaz', 81, '');
insert into public.volunteers (name, neighborhood) values ('Lucía Martín', 'Barrio Universidad');

-- === drizzle/migrations/0001_referrals_checkins.sql ===
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'senior' check (kind in ('senior','volunteer')),
  relation text not null default '' check (char_length(relation) <= 40),
  person_name text not null check (char_length(person_name) between 2 and 100),
  person_age int check (person_age is null or person_age between 50 and 120),
  person_phone text not null default '' check (char_length(person_phone) <= 30),
  neighborhood text not null default '' check (char_length(neighborhood) <= 100),
  referrer_name text not null default '' check (char_length(referrer_name) <= 100),
  referrer_phone text not null default '' check (char_length(referrer_phone) <= 30),
  referrer_code text not null default '' check (char_length(referrer_code) <= 12),
  via_code text not null default '' check (char_length(via_code) <= 12),
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending','accepted','dismissed')),
  created_at timestamptz not null default now()
);
grant insert on public.referrals to anon, authenticated;
grant select, update, delete on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "Anyone can recommend" on public.referrals for insert to anon, authenticated
  with check (status = 'pending' and consent = true);
create policy "Admins read referrals" on public.referrals for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update referrals" on public.referrals for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete referrals" on public.referrals for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.referral_count(_code text)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.referrals where _code <> '' and (via_code = _code or referrer_code = _code)
$$;
grant execute on function public.referral_count(text) to anon, authenticated;

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references public.seniors(id) on delete cascade,
  mood text not null check (mood in ('bien','bajo','no_contesta')),
  created_at timestamptz not null default now()
);
create index check_ins_senior_created on public.check_ins (senior_id, created_at desc);
grant select, insert, delete on public.check_ins to authenticated;
grant all on public.check_ins to service_role;
alter table public.check_ins enable row level security;
create policy "Admins manage check_ins" on public.check_ins for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- === drizzle/migrations/0002_profiles_alerts.sql ===
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null default '' check (char_length(phone) <= 30),
  neighborhood text not null default '' check (char_length(neighborhood) <= 100),
  persona text not null check (persona in ('familia','voluntario','ong')),
  senior_name text not null default '' check (char_length(senior_name) <= 100),
  senior_relation text not null default '' check (char_length(senior_relation) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "Admins read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  senior_name text not null check (char_length(senior_name) between 1 and 100),
  mood text not null check (mood in ('bien','bajo','no_contesta')),
  need text not null check (need in ('ninguna','compania','llamada','visita')),
  summary text not null default '' check (char_length(summary) <= 600),
  signals text[] not null default '{}',
  transcript jsonb not null default '[]',
  status text not null default 'open' check (status in ('open','accepted','visited','closed')),
  volunteer_id uuid,
  volunteer_name text not null default '',
  family_notified boolean not null default false,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index alerts_created on public.alerts (created_at desc);
grant select, insert on public.alerts to authenticated;
grant all on public.alerts to service_role;
alter table public.alerts enable row level security;
create policy "Community reads alerts" on public.alerts for select to authenticated using (true);
create policy "Users create alerts" on public.alerts for insert to authenticated with check (created_by = auth.uid() and status in ('open','closed') and volunteer_id is null);
create trigger alerts_touch before update on public.alerts for each row execute function public.touch_updated_at();

create or replace function public.accept_alert(_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare n text;
begin
  select full_name into n from public.profiles where id = auth.uid() and persona in ('voluntario','ong');
  if n is null then return false; end if;
  update public.alerts set status = 'accepted', volunteer_id = auth.uid(), volunteer_name = split_part(n, ' ', 1)
    where id = _id and status = 'open';
  return found;
end $$;

create or replace function public.complete_alert(_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.alerts set status = 'visited' where id = _id and status = 'accepted' and volunteer_id = auth.uid();
  return found;
end $$;
revoke execute on function public.accept_alert(uuid) from public, anon;
revoke execute on function public.complete_alert(uuid) from public, anon;
grant execute on function public.accept_alert(uuid) to authenticated;
grant execute on function public.complete_alert(uuid) to authenticated;

alter publication supabase_realtime add table public.alerts;

-- === drizzle/migrations/0003_alert_memory.sql ===
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS memory_note text NOT NULL DEFAULT '';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS trend text NOT NULL DEFAULT 'nuevo';

-- === drizzle/migrations/0004_call_schedules.sql ===
CREATE TABLE public.call_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_name text NOT NULL,
  call_hour int NOT NULL DEFAULT 11 CHECK (call_hour BETWEEN 0 AND 23),
  days int[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  last_run_on date,
  last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_schedules TO authenticated;
GRANT ALL ON public.call_schedules TO service_role;
ALTER TABLE public.call_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own schedules read" ON public.call_schedules FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Own schedules insert" ON public.call_schedules FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Own schedules update" ON public.call_schedules FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Own schedules delete" ON public.call_schedules FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE public.call_job_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  locked_until timestamptz,
  paused_reason text NOT NULL DEFAULT ''
);
GRANT ALL ON public.call_job_state TO service_role;
ALTER TABLE public.call_job_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.call_job_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- === drizzle/migrations/0005_volunteer_flow.sql ===
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

-- === drizzle/migrations/0006_alerts_status_arrived.sql ===
ALTER TABLE public.alerts DROP CONSTRAINT alerts_status_check;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_status_check CHECK (status = ANY (ARRAY['open','accepted','arrived','visited','closed']));

-- === drizzle/migrations/0007_care_and_loneliness.sql ===
create or replace function public.is_ong(_uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _uid and persona = 'ong') or public.has_role(_uid, 'admin')
$$;

create table public.senior_care (
  id uuid primary key default gen_random_uuid(),
  senior_name text not null,
  key_contact_name text not null default '',
  key_contact_phone text not null default '',
  meds text not null default '',
  appointments text not null default '',
  birthday text not null default '',
  created_by uuid not null,
  updated_at timestamptz not null default now(),
  unique (created_by, senior_name)
);
grant select, insert, update, delete on public.senior_care to authenticated;
grant all on public.senior_care to service_role;
alter table public.senior_care enable row level security;
create policy "Care read" on public.senior_care for select to authenticated using (created_by = auth.uid() or public.is_ong(auth.uid()));
create policy "Care insert" on public.senior_care for insert to authenticated with check (created_by = auth.uid());
create policy "Care update" on public.senior_care for update to authenticated using (created_by = auth.uid() or public.is_ong(auth.uid()));
create trigger senior_care_touch before update on public.senior_care for each row execute function public.touch_updated_at();

create table public.loneliness_scores (
  id uuid primary key default gen_random_uuid(),
  senior_name text not null,
  q1 int not null check (q1 between 1 and 3),
  q2 int not null check (q2 between 1 and 3),
  q3 int not null check (q3 between 1 and 3),
  score int generated always as (q1 + q2 + q3) stored,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.loneliness_scores to authenticated;
grant all on public.loneliness_scores to service_role;
alter table public.loneliness_scores enable row level security;
create policy "Scores read" on public.loneliness_scores for select to authenticated using (created_by = auth.uid() or public.is_ong(auth.uid()));
create policy "Scores insert" on public.loneliness_scores for insert to authenticated with check (created_by = auth.uid());

-- === drizzle/migrations/0008_call_duration_ai_loneliness.sql ===
ALTER TABLE public.alerts ADD COLUMN duration_min integer NOT NULL DEFAULT 3;
ALTER TABLE public.alerts ADD COLUMN loneliness_score integer;
COMMENT ON COLUMN public.alerts.loneliness_score IS 'Puntuación de soledad 3-9 calculada por la IA en cada llamada (UCLA-3 estimada).';
COMMENT ON TABLE public.loneliness_scores IS 'DEPRECATED: la soledad la calcula la IA en cada llamada (alerts.loneliness_score); este cuestionario manual ya no se usa.';

-- === drizzle/migrations/0009_person_identity_and_verified_access.sql ===
ALTER TABLE public.seniors ADD COLUMN IF NOT EXISTS neighborhood text NOT NULL DEFAULT '';
ALTER TABLE public.seniors ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
CREATE TABLE public.person_links (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, senior_id uuid REFERENCES public.seniors(id), requested_name text NOT NULL DEFAULT '', relation text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,senior_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.person_links TO authenticated;
GRANT ALL ON public.person_links TO service_role;
ALTER TABLE public.person_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own requests read" ON public.person_links FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Pending requests create" ON public.person_links FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND status='pending' AND senior_id IS NULL);
CREATE POLICY "Admin links manage" ON public.person_links FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.coordinators (user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.coordinators TO authenticated;
GRANT ALL ON public.coordinators TO service_role;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coordinator read own" ON public.coordinators FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.is_ong(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_role(_uid,'admin') OR EXISTS(SELECT 1 FROM public.coordinators WHERE user_id=_uid) $$;
CREATE OR REPLACE FUNCTION public.can_care(_sid uuid, _uid uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT _uid IS NOT NULL AND EXISTS(SELECT 1 FROM public.seniors s WHERE s.id=_sid AND s.active AND (public.is_ong(_uid) OR EXISTS(SELECT 1 FROM public.person_links l WHERE l.user_id=_uid AND l.senior_id=s.id AND l.status='approved'))) $$;
REVOKE ALL ON FUNCTION public.can_care(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_care(uuid,uuid) TO authenticated,service_role;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS senior_id uuid REFERENCES public.seniors(id);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS is_simulated boolean NOT NULL DEFAULT true;
ALTER TABLE public.senior_care ADD COLUMN IF NOT EXISTS senior_id uuid REFERENCES public.seniors(id);
ALTER TABLE public.call_schedules ADD COLUMN IF NOT EXISTS senior_id uuid REFERENCES public.seniors(id);
ALTER TABLE public.loneliness_scores ADD COLUMN IF NOT EXISTS senior_id uuid REFERENCES public.seniors(id);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['alerts','senior_care','call_schedules','loneliness_scores'] LOOP EXECUTE format('UPDATE public.%I r SET senior_id=s.id FROM public.seniors s WHERE r.senior_id IS NULL AND (lower(trim(r.senior_name))=lower(trim(s.name)) OR lower(trim(r.senior_name))=lower(split_part(s.name,'' '',1))) AND (SELECT count(*) FROM public.seniors x WHERE lower(trim(r.senior_name))=lower(trim(x.name)) OR lower(trim(r.senior_name))=lower(split_part(x.name,'' '',1)))=1',t); END LOOP; END $$;
INSERT INTO public.person_links(user_id,senior_id,requested_name,relation,status) SELECT p.id,s.id,p.senior_name,p.senior_relation,'pending' FROM public.profiles p JOIN public.seniors s ON lower(trim(p.senior_name))=lower(trim(s.name)) OR lower(trim(p.senior_name))=lower(split_part(s.name,' ',1)) WHERE p.persona='familia' AND (SELECT count(*) FROM public.seniors x WHERE lower(trim(p.senior_name))=lower(trim(x.name)) OR lower(trim(p.senior_name))=lower(split_part(x.name,' ',1)))=1 ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS alerts_person_date ON public.alerts(senior_id,created_at DESC);
CREATE INDEX IF NOT EXISTS links_user_status ON public.person_links(user_id,status);
CREATE POLICY "Authorized senior identity" ON public.seniors FOR SELECT TO authenticated USING(public.can_care(id));
DROP POLICY IF EXISTS "Community reads alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users create alerts" ON public.alerts;
CREATE POLICY "Authorized private alerts" ON public.alerts FOR SELECT TO authenticated USING(public.can_care(senior_id));
CREATE POLICY "Authorized call insert" ON public.alerts FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND public.can_care(senior_id) AND status IN ('open','closed') AND volunteer_id IS NULL);
DROP POLICY IF EXISTS "Care read" ON public.senior_care;
DROP POLICY IF EXISTS "Care insert" ON public.senior_care;
DROP POLICY IF EXISTS "Care update" ON public.senior_care;
CREATE POLICY "Authorized care read" ON public.senior_care FOR SELECT TO authenticated USING(public.can_care(senior_id));
CREATE POLICY "Authorized care insert" ON public.senior_care FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND public.can_care(senior_id));
CREATE POLICY "Authorized care update" ON public.senior_care FOR UPDATE TO authenticated USING(public.can_care(senior_id)) WITH CHECK(public.can_care(senior_id));
DROP POLICY IF EXISTS "Own schedules insert" ON public.call_schedules;
DROP POLICY IF EXISTS "Own schedules read" ON public.call_schedules;
DROP POLICY IF EXISTS "Own schedules update" ON public.call_schedules;
CREATE POLICY "Authorized schedules insert" ON public.call_schedules FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND public.can_care(senior_id));
CREATE POLICY "Authorized schedules read" ON public.call_schedules FOR SELECT TO authenticated USING(created_by=auth.uid() AND public.can_care(senior_id));
CREATE POLICY "Authorized schedules update" ON public.call_schedules FOR UPDATE TO authenticated USING(created_by=auth.uid() AND public.can_care(senior_id)) WITH CHECK(created_by=auth.uid() AND public.can_care(senior_id));
DROP POLICY IF EXISTS "Scores read" ON public.loneliness_scores;
DROP POLICY IF EXISTS "Scores insert" ON public.loneliness_scores;
CREATE POLICY "Authorized legacy scores" ON public.loneliness_scores FOR SELECT TO authenticated USING(public.can_care(senior_id));
CREATE OR REPLACE FUNCTION public.eligible_alert(_a public.alerts,_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=_uid AND p.persona='voluntario' AND trim(p.neighborhood)<>'' AND trim(_a.neighborhood)<>'' AND (lower(p.neighborhood)=lower(_a.neighborhood) OR position(lower(p.neighborhood) in lower(_a.neighborhood))>0 OR position(lower(_a.neighborhood) in lower(p.neighborhood))>0)) AND _a.senior_id IS NOT NULL AND _a.status='open' $$;
REVOKE ALL ON FUNCTION public.eligible_alert(public.alerts,uuid) FROM PUBLIC,anon;
CREATE OR REPLACE FUNCTION public.visible_alerts(_senior uuid DEFAULT NULL,_offset integer DEFAULT 0) RETURNS SETOF public.alerts LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.uid() IS NULL THEN RETURN; END IF; RETURN QUERY SELECT CASE WHEN public.can_care(a.senior_id) THEN a ELSE jsonb_populate_record(NULL::public.alerts,jsonb_build_object('id',a.id,'senior_id',a.senior_id,'senior_name',a.senior_name,'mood',a.mood,'need',a.need,'status',a.status,'neighborhood',a.neighborhood,'created_at',a.created_at,'updated_at',a.updated_at,'volunteer_id',a.volunteer_id,'volunteer_name',a.volunteer_name,'accepted_at',a.accepted_at,'arrived_at',a.arrived_at,'visited_at',a.visited_at,'visit_note',CASE WHEN a.volunteer_id=auth.uid() THEN a.visit_note ELSE '' END,'summary','','signals','[]'::jsonb,'transcript','[]'::jsonb,'memory_note','','trend','nuevo','family_notified',false,'is_simulated',a.is_simulated)) END FROM public.alerts a WHERE (_senior IS NULL OR a.senior_id=_senior) AND (public.can_care(a.senior_id) OR a.volunteer_id=auth.uid() OR public.eligible_alert(a,auth.uid())) ORDER BY CASE WHEN a.volunteer_id=auth.uid() AND a.status IN ('accepted','arrived') THEN 0 ELSE 1 END,a.created_at DESC OFFSET greatest(_offset,0) LIMIT 50; END $$;
REVOKE ALL ON FUNCTION public.visible_alerts(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.visible_alerts(uuid,integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.person_options() RETURNS TABLE(id uuid,name text,relation text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT s.id,s.name,coalesce((SELECT l.relation FROM public.person_links l WHERE l.user_id=auth.uid() AND l.senior_id=s.id AND l.status='approved' LIMIT 1),'') FROM public.seniors s WHERE auth.uid() IS NOT NULL AND s.active AND (public.can_care(s.id) OR EXISTS(SELECT 1 FROM public.alerts a WHERE a.senior_id=s.id AND (a.volunteer_id=auth.uid() OR public.eligible_alert(a,auth.uid())))) ORDER BY s.name,s.id $$;
REVOKE ALL ON FUNCTION public.person_options() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.person_options() TO authenticated;
CREATE OR REPLACE FUNCTION public.accept_alert(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n text; a public.alerts; BEGIN IF auth.uid() IS NULL THEN RETURN false; END IF; PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0)); SELECT * INTO a FROM public.alerts WHERE id=_id FOR UPDATE; IF NOT FOUND OR a.status<>'open' OR NOT(public.is_ong(auth.uid()) OR public.eligible_alert(a,auth.uid())) THEN RETURN false; END IF; SELECT full_name INTO n FROM public.profiles WHERE id=auth.uid(); IF n IS NULL OR EXISTS(SELECT 1 FROM public.alerts WHERE volunteer_id=auth.uid() AND status IN ('accepted','arrived')) THEN RETURN false; END IF; UPDATE public.alerts SET status='accepted',volunteer_id=auth.uid(),volunteer_name=split_part(n,' ',1),accepted_at=now() WHERE id=_id AND status='open'; RETURN FOUND; END $$;
COMMENT ON COLUMN public.profiles.senior_name IS 'DEPRECATED: access uses approved person_links';
COMMENT ON COLUMN public.alerts.senior_name IS 'Presentation only; identity and access use senior_id';
COMMENT ON COLUMN public.senior_care.senior_name IS 'Presentation only; identity and access use senior_id';
COMMENT ON COLUMN public.call_schedules.senior_name IS 'Presentation only; identity and access use senior_id';

-- === drizzle/migrations/0010_demo_scope_and_access_review.sql ===
CREATE TABLE public.demo_members (user_id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('familia','voluntario','ong')));
GRANT SELECT ON public.demo_members TO authenticated;
GRANT ALL ON public.demo_members TO service_role;
ALTER TABLE public.demo_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Demo own membership" ON public.demo_members FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.can_care(_sid uuid,_uid uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT _uid IS NOT NULL AND EXISTS(SELECT 1 FROM public.seniors s WHERE s.id=_sid AND s.active AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=_uid) THEN s.is_demo AND EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=_uid AND d.kind IN ('familia','ong')) ELSE public.is_ong(_uid) OR EXISTS(SELECT 1 FROM public.person_links l WHERE l.user_id=_uid AND l.senior_id=s.id AND l.status='approved') END)) $$;
CREATE OR REPLACE FUNCTION public.eligible_alert(_a public.alerts,_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT _a.senior_id IS NOT NULL AND _a.status='open' AND EXISTS(SELECT 1 FROM public.seniors s WHERE s.id=_a.senior_id AND s.active AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=_uid) THEN s.is_demo ELSE NOT s.is_demo END)) AND (EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=_uid AND d.kind='ong') OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=_uid AND p.persona='voluntario' AND trim(p.neighborhood)<>'' AND trim(_a.neighborhood)<>'' AND (lower(p.neighborhood)=lower(_a.neighborhood) OR position(lower(p.neighborhood) in lower(_a.neighborhood))>0 OR position(lower(_a.neighborhood) in lower(p.neighborhood))>0))) $$;
ALTER TABLE public.person_links ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.person_links ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
INSERT INTO public.person_links(user_id,requested_name,relation) SELECT p.id,p.senior_name,p.senior_relation FROM public.profiles p WHERE p.persona='familia' AND p.senior_name<>'' AND NOT EXISTS(SELECT 1 FROM public.person_links l WHERE l.user_id=p.id);
CREATE POLICY "Admin coordinator manage" ON public.coordinators FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
GRANT INSERT,UPDATE,DELETE ON public.coordinators TO authenticated;
CREATE OR REPLACE FUNCTION public.review_person_link(_id uuid,_senior uuid,_approve boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF; IF _approve AND NOT EXISTS(SELECT 1 FROM public.seniors WHERE id=_senior AND active AND NOT is_demo) THEN RAISE EXCEPTION 'Person unavailable'; END IF; UPDATE public.person_links SET senior_id=CASE WHEN _approve THEN _senior ELSE senior_id END,status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_by=auth.uid(),reviewed_at=now() WHERE id=_id AND status='pending'; RETURN FOUND; END $$;
REVOKE ALL ON FUNCTION public.review_person_link(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_person_link(uuid,uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.accept_alert(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n text; a public.alerts; BEGIN IF auth.uid() IS NULL THEN RETURN false; END IF; PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0)); SELECT * INTO a FROM public.alerts WHERE id=_id FOR UPDATE; IF NOT FOUND OR a.status<>'open' OR NOT(public.is_ong(auth.uid()) OR public.eligible_alert(a,auth.uid())) THEN RETURN false; END IF; SELECT full_name INTO n FROM public.profiles WHERE id=auth.uid(); IF n IS NULL OR EXISTS(SELECT 1 FROM public.alerts WHERE volunteer_id=auth.uid() AND status IN ('accepted','arrived')) THEN RETURN false; END IF; UPDATE public.alerts SET status='accepted',volunteer_id=auth.uid(),volunteer_name=split_part(n,' ',1),accepted_at=now() WHERE id=_id AND status='open'; RETURN FOUND; END $$;
REVOKE ALL ON FUNCTION public.accept_alert(uuid),public.arrive_alert(uuid),public.complete_alert(uuid,text),public.release_alert(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_alert(uuid),public.arrive_alert(uuid),public.complete_alert(uuid,text),public.release_alert(uuid) TO authenticated;

-- === drizzle/migrations/0011_isolate_demo_visit_records.sql ===
CREATE OR REPLACE FUNCTION public.visible_alerts(_senior uuid DEFAULT NULL,_offset integer DEFAULT 0) RETURNS SETOF public.alerts LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.uid() IS NULL THEN RETURN; END IF; RETURN QUERY SELECT CASE WHEN public.can_care(a.senior_id) THEN a ELSE jsonb_populate_record(NULL::public.alerts,jsonb_build_object('id',a.id,'senior_id',a.senior_id,'senior_name',a.senior_name,'mood',a.mood,'need',a.need,'status',a.status,'neighborhood',a.neighborhood,'created_at',a.created_at,'updated_at',a.updated_at,'volunteer_id',a.volunteer_id,'volunteer_name',a.volunteer_name,'accepted_at',a.accepted_at,'arrived_at',a.arrived_at,'visited_at',a.visited_at,'visit_note',CASE WHEN a.volunteer_id=auth.uid() THEN a.visit_note ELSE '' END,'summary','','signals','[]'::jsonb,'transcript','[]'::jsonb,'memory_note','','trend','nuevo','family_notified',false,'is_simulated',a.is_simulated)) END FROM public.alerts a JOIN public.seniors s ON s.id=a.senior_id WHERE s.active AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=auth.uid()) THEN s.is_demo ELSE NOT s.is_demo END) AND (_senior IS NULL OR a.senior_id=_senior) AND (public.can_care(a.senior_id) OR a.volunteer_id=auth.uid() OR public.eligible_alert(a,auth.uid())) ORDER BY CASE WHEN a.volunteer_id=auth.uid() AND a.status IN ('accepted','arrived') THEN 0 ELSE 1 END,a.created_at DESC OFFSET greatest(_offset,0) LIMIT 50; END $$;
CREATE OR REPLACE FUNCTION public.person_options() RETURNS TABLE(id uuid,name text,relation text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT s.id,s.name,coalesce((SELECT l.relation FROM public.person_links l WHERE l.user_id=auth.uid() AND l.senior_id=s.id AND l.status='approved' LIMIT 1),'') FROM public.seniors s WHERE auth.uid() IS NOT NULL AND s.active AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=auth.uid()) THEN s.is_demo ELSE NOT s.is_demo END) AND (public.can_care(s.id) OR EXISTS(SELECT 1 FROM public.alerts a WHERE a.senior_id=s.id AND (a.volunteer_id=auth.uid() OR public.eligible_alert(a,auth.uid())))) ORDER BY s.name,s.id $$;
CREATE OR REPLACE FUNCTION public.visit_allowed(_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.alerts a JOIN public.seniors s ON s.id=a.senior_id WHERE a.id=_id AND a.volunteer_id=auth.uid() AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=auth.uid()) THEN s.is_demo ELSE NOT s.is_demo END)) $$;
REVOKE ALL ON FUNCTION public.visit_allowed(uuid) FROM PUBLIC,anon;
CREATE OR REPLACE FUNCTION public.arrive_alert(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.alerts SET status='arrived',arrived_at=now() WHERE id=_id AND status='accepted' AND public.visit_allowed(id); RETURN FOUND; END $$;
CREATE OR REPLACE FUNCTION public.complete_alert(_id uuid,_note text DEFAULT '') RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.alerts SET status='visited',visited_at=now(),arrived_at=coalesce(arrived_at,now()),visit_note=left(coalesce(_note,''),280) WHERE id=_id AND status IN ('accepted','arrived') AND public.visit_allowed(id); RETURN FOUND; END $$;
CREATE OR REPLACE FUNCTION public.release_alert(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.alerts SET status='open',volunteer_id=null,volunteer_name='',accepted_at=null,arrived_at=null WHERE id=_id AND status IN ('accepted','arrived') AND public.visit_allowed(id); RETURN FOUND; END $$;

-- === drizzle/migrations/0012_expand_visible_alert_record.sql ===
CREATE OR REPLACE FUNCTION public.visible_alerts(_senior uuid DEFAULT NULL,_offset integer DEFAULT 0) RETURNS SETOF public.alerts LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.uid() IS NULL THEN RETURN; END IF; RETURN QUERY SELECT (CASE WHEN public.can_care(a.senior_id) THEN a ELSE jsonb_populate_record(NULL::public.alerts,jsonb_build_object('id',a.id,'senior_id',a.senior_id,'senior_name',a.senior_name,'mood',a.mood,'need',a.need,'status',a.status,'neighborhood',a.neighborhood,'created_at',a.created_at,'updated_at',a.updated_at,'volunteer_id',a.volunteer_id,'volunteer_name',a.volunteer_name,'accepted_at',a.accepted_at,'arrived_at',a.arrived_at,'visited_at',a.visited_at,'visit_note',CASE WHEN a.volunteer_id=auth.uid() THEN a.visit_note ELSE '' END,'summary','','signals','[]'::jsonb,'transcript','[]'::jsonb,'memory_note','','trend','nuevo','family_notified',false,'is_simulated',a.is_simulated)) END).* FROM public.alerts a JOIN public.seniors s ON s.id=a.senior_id WHERE s.active AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=auth.uid()) THEN s.is_demo ELSE NOT s.is_demo END) AND (_senior IS NULL OR a.senior_id=_senior) AND (public.can_care(a.senior_id) OR a.volunteer_id=auth.uid() OR public.eligible_alert(a,auth.uid())) ORDER BY CASE WHEN a.volunteer_id=auth.uid() AND a.status IN ('accepted','arrived') THEN 0 ELSE 1 END,a.created_at DESC OFFSET greatest(_offset,0) LIMIT 50; END $$;

-- === drizzle/migrations/0013_care_identity_and_visit_isolation.sql ===
ALTER TABLE public.senior_care DROP CONSTRAINT IF EXISTS senior_care_created_by_senior_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS senior_care_person_unique ON public.senior_care(senior_id) WHERE senior_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.accept_alert(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n text; a public.alerts; BEGIN IF auth.uid() IS NULL THEN RETURN false; END IF; PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0)); SELECT * INTO a FROM public.alerts WHERE id=_id FOR UPDATE; IF NOT FOUND OR a.status<>'open' OR NOT EXISTS(SELECT 1 FROM public.seniors s WHERE s.id=a.senior_id AND s.active AND (CASE WHEN EXISTS(SELECT 1 FROM public.demo_members d WHERE d.user_id=auth.uid()) THEN s.is_demo ELSE NOT s.is_demo END)) OR NOT(public.is_ong(auth.uid()) OR public.eligible_alert(a,auth.uid())) THEN RETURN false; END IF; SELECT full_name INTO n FROM public.profiles WHERE id=auth.uid(); IF n IS NULL OR EXISTS(SELECT 1 FROM public.alerts WHERE volunteer_id=auth.uid() AND status IN ('accepted','arrived')) THEN RETURN false; END IF; UPDATE public.alerts SET status='accepted',volunteer_id=auth.uid(),volunteer_name=split_part(n,' ',1),accepted_at=now() WHERE id=_id AND status='open'; RETURN FOUND; END $$;

-- === drizzle/migrations/0014_restrict_organization_reads.sql ===
DROP POLICY IF EXISTS "Anyone reads organization" ON public.organization;
REVOKE SELECT ON public.organization FROM anon;
CREATE POLICY "Admins read organization" ON public.organization FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- === drizzle/migrations/0015_person_request_contact_age.sql ===
ALTER TABLE public.person_links ADD COLUMN requested_phone text, ADD COLUMN requested_age integer;
ALTER TABLE public.person_links ADD CONSTRAINT person_links_requested_phone_valid CHECK (requested_phone IS NULL OR (char_length(trim(requested_phone)) BETWEEN 5 AND 30 AND requested_phone ~ '^[0-9+ ()-]+$' AND char_length(regexp_replace(requested_phone, '[^0-9]', '', 'g')) >= 5)), ADD CONSTRAINT person_links_requested_age_valid CHECK (requested_age IS NULL OR requested_age BETWEEN 0 AND 120);

-- === drizzle/migrations/0016_immediate_demo_person.sql ===
CREATE OR REPLACE FUNCTION public.add_demo_person(_name text, _phone text, _age integer, _relation text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); sid uuid; area text;
BEGIN
 IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.demo_members WHERE user_id=uid AND kind IN ('familia','ong')) THEN RAISE EXCEPTION 'Demo membership required' USING ERRCODE='42501'; END IF;
 IF _name IS NULL OR char_length(trim(_name)) NOT BETWEEN 2 AND 100 OR _phone IS NULL OR char_length(trim(_phone)) NOT BETWEEN 5 AND 30 OR _phone !~ '^[0-9+ ()-]+$' OR char_length(regexp_replace(_phone,'[^0-9]','','g')) < 5 OR _age IS NULL OR _age NOT BETWEEN 0 AND 120 OR _relation IS NULL OR char_length(trim(_relation)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Invalid person details' USING ERRCODE='22023'; END IF;
 SELECT neighborhood INTO area FROM public.profiles WHERE id=uid;
 INSERT INTO public.seniors(name,phone,age,active,is_demo,neighborhood) VALUES(trim(_name),trim(_phone),_age,true,true,coalesce(area,'')) RETURNING id INTO sid;
 INSERT INTO public.person_links(user_id,senior_id,requested_name,requested_phone,requested_age,relation,status,reviewed_at) VALUES(uid,sid,trim(_name),trim(_phone),_age,trim(_relation),'approved',now());
 RETURN sid;
END $$;
REVOKE ALL ON FUNCTION public.add_demo_person(text,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.add_demo_person(text,text,integer,text) TO authenticated;

-- === drizzle/migrations/0017_manage_person_details.sql ===
CREATE OR REPLACE FUNCTION public.can_manage_person(_sid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.seniors s WHERE s.id=_sid AND s.active AND CASE WHEN EXISTS(SELECT 1 FROM public.demo_members WHERE user_id=auth.uid()) THEN s.is_demo AND EXISTS(SELECT 1 FROM public.demo_members WHERE user_id=auth.uid() AND kind IN ('familia','ong')) ELSE NOT s.is_demo AND public.has_role(auth.uid(),'admin') END) $$;
REVOKE ALL ON FUNCTION public.can_manage_person(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_person(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.person_edit_details(_sid uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.can_manage_person(_sid) THEN RETURN NULL; END IF; RETURN (SELECT jsonb_build_object('id',s.id,'requested_name',s.name,'requested_phone',s.phone,'requested_age',s.age,'relation',coalesce((SELECT relation FROM public.person_links WHERE user_id=auth.uid() AND senior_id=s.id AND status='approved'),'')) FROM public.seniors s WHERE s.id=_sid); END $$;
REVOKE ALL ON FUNCTION public.person_edit_details(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.person_edit_details(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.manage_person(_sid uuid,_delete boolean,_name text DEFAULT NULL,_phone text DEFAULT NULL,_age integer DEFAULT NULL,_relation text DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM 1 FROM public.seniors WHERE id=_sid FOR UPDATE;
 IF NOT public.can_manage_person(_sid) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF _delete THEN
  IF EXISTS(SELECT 1 FROM public.alerts WHERE senior_id=_sid AND status IN ('accepted','arrived')) THEN RAISE EXCEPTION 'Active visit' USING ERRCODE='22023'; END IF;
  UPDATE public.call_schedules SET active=false WHERE senior_id=_sid;
  UPDATE public.seniors SET active=false WHERE id=_sid;
 ELSE
  IF _name IS NULL OR char_length(trim(_name)) NOT BETWEEN 2 AND 100 OR _phone IS NULL OR char_length(trim(_phone)) NOT BETWEEN 5 AND 30 OR _phone !~ '^[0-9+ ()-]+$' OR char_length(regexp_replace(_phone,'[^0-9]','','g'))<5 OR _age IS NULL OR _age NOT BETWEEN 0 AND 120 OR _relation IS NULL OR char_length(trim(_relation)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Invalid details' USING ERRCODE='22023'; END IF;
  UPDATE public.seniors SET name=trim(_name),phone=trim(_phone),age=_age WHERE id=_sid;
  UPDATE public.person_links SET requested_name=trim(_name),requested_phone=trim(_phone),requested_age=_age,relation=trim(_relation) WHERE senior_id=_sid AND user_id=auth.uid() AND status='approved';
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.manage_person(uuid,boolean,text,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_person(uuid,boolean,text,text,integer,text) TO authenticated;

-- === drizzle/migrations/0018_create_call_logs.sql ===
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text unique,
  call_sid text,
  person_id text not null,
  nombre text,
  telefono_usuario text,
  status text not null default 'llamando'
    check (status in ('llamando','urgencia_en_curso','analizando','completada','rechazada','no_contesta','error')),
  motivo text,
  duracion_seg integer,
  llamada_inicio timestamptz,
  nivel_alerta text check (nivel_alerta in ('VERDE','AMARILLO','ROJO')),
  global_pct integer,
  activar_protocolo_voy_yo boolean,
  acepta_llamada boolean,
  acepta_llamadas_diarias boolean,
  report jsonb
);

create index if not exists call_logs_person_created_idx
  on public.call_logs (person_id, created_at desc);

grant all on public.call_logs to service_role;

alter table public.call_logs enable row level security;
alter publication supabase_realtime add table public.call_logs;

-- === drizzle/migrations/0019_call_logs_policy.sql ===
-- Migration 0019: Add SELECT grant and RLS policy for call_logs table
grant select on public.call_logs to anon, authenticated;

drop policy if exists "Authorized call_logs read" on public.call_logs;
drop policy if exists "Public call_logs read" on public.call_logs;

create policy "Authorized call_logs read" on public.call_logs
  for select to anon, authenticated
  using (true);

