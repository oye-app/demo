ALTER TABLE public.alerts ADD COLUMN duration_min integer NOT NULL DEFAULT 3;
ALTER TABLE public.alerts ADD COLUMN loneliness_score integer;
COMMENT ON COLUMN public.alerts.loneliness_score IS 'Puntuación de soledad 3-9 calculada por la IA en cada llamada (UCLA-3 estimada).';
COMMENT ON TABLE public.loneliness_scores IS 'DEPRECATED: la soledad la calcula la IA en cada llamada (alerts.loneliness_score); este cuestionario manual ya no se usa.';