-- Combined version-controlled record of live migrations:
-- 1) enrich_call_context_and_no_answer_key_holder
-- 2) ngo_command_console_and_multi_org
-- 3) ngo_console_cohort_summary

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

CREATE OR REPLACE FUNCTION public.is_console_operator(_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _uid IS NOT NULL AND (
    public.is_ong(_uid)
    OR EXISTS (
      SELECT 1 FROM public.demo_members d
      WHERE d.user_id = _uid AND d.kind = 'ong'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.operator_is_demo_scope(_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.demo_members d
    WHERE d.user_id = _uid
  );
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND policyname = 'Console operators read organizations'
  ) THEN
    CREATE POLICY "Console operators read organizations"
    ON public.organizations
    FOR SELECT
    TO authenticated
    USING (public.is_console_operator(auth.uid()));
  END IF;
END $$;
