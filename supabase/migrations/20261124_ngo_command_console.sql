-- Combined version-controlled record of live migrations:
-- 1) enrich_call_context_and_no_answer_key_holder
-- 2) ngo_command_console_and_multi_org
-- 3) ngo_console_cohort_summary
-- 4) ngo_console_excellence_pack
-- 5) clinical_veracity_and_audit_trail

ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS transcript_turns jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS analyzer_model text NOT NULL DEFAULT 'deterministic_legacy',
  ADD COLUMN IF NOT EXISTS is_simulated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qa_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS qa_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS qa_reviewed_by text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS qa_reviewed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id integer UNIQUE,
  name text NOT NULL,
  neighborhood text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT 'ong',
  daily_rate_eur numeric NOT NULL DEFAULT 0.46,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.seniors
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.volunteers
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.coordinators
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

CREATE TABLE IF NOT EXISTS public.care_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  alert_id uuid REFERENCES public.alerts(id) ON DELETE SET NULL,
  author_id uuid,
  author_name text NOT NULL DEFAULT 'Coordinación ONG',
  category text NOT NULL DEFAULT 'nota_coordinacion',
  ring integer NOT NULL DEFAULT 2,
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT 'registrada',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'centro_mayores',
  neighborhood text NOT NULL DEFAULT 'Chamberí',
  schedule text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  is_demo boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
