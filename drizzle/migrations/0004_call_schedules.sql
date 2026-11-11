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