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