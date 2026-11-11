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