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