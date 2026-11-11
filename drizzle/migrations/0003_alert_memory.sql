ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS memory_note text NOT NULL DEFAULT '';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS trend text NOT NULL DEFAULT 'nuevo';