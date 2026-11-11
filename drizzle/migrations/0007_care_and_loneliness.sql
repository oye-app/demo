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