DROP POLICY IF EXISTS "Anyone reads organization" ON public.organization;
REVOKE SELECT ON public.organization FROM anon;
CREATE POLICY "Admins read organization" ON public.organization FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));