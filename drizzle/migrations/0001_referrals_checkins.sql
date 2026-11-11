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