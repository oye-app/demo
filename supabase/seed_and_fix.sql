-- 1. Permisos y políticas para call_logs (lectura Realtime y escritura)
GRANT SELECT, INSERT, UPDATE ON public.call_logs TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Authorized call_logs read" ON public.call_logs;
DROP POLICY IF EXISTS "Public call_logs read" ON public.call_logs;
DROP POLICY IF EXISTS "Authenticated call_logs insert" ON public.call_logs;

CREATE POLICY "Authorized call_logs read" ON public.call_logs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated call_logs insert" ON public.call_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'call_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
  END IF;
END $$;

-- 2. Crear personas demo (Carmen y Antonio) con sus IDs fijos y teléfono de prueba
INSERT INTO public.seniors (id, name, age, phone, address, neighborhood, active, is_demo)
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'Carmen López', 84, '+34678617031', 'Calle del Pez', 'Chamberí', true, true),
  ('d0000000-0000-4000-8000-000000000002', 'Antonio Ruiz', 79, '+34678617031', 'Calle Fuencarral', 'Chamberí', true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  age = EXCLUDED.age,
  phone = EXCLUDED.phone,
  active = true,
  is_demo = true;

-- 3. Crear los 3 usuarios demo (familia, voluntario, ong) en auth.users y vincular a Carmen
DO $$
DECLARE
  r RECORD;
  uid uuid;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('a0000000-0000-4000-8000-000000000001'::uuid, 'familia@demo.oye.app', 'familia', 'Lucía Martín', 'Chamberí', 'Carmen', 'Madre'),
      ('a0000000-0000-4000-8000-000000000002'::uuid, 'voluntario@demo.oye.app', 'voluntario', 'Javier Ruiz', 'Chamberí', '', ''),
      ('a0000000-0000-4000-8000-000000000003'::uuid, 'ong@demo.oye.app', 'ong', 'Ana Torres', 'Asociación Vecinal Chamberí', '', '')
    ) AS t(default_id, email, persona, full_name, neighborhood, senior_name, senior_relation)
  LOOP
    SELECT id INTO uid FROM auth.users WHERE email = r.email LIMIT 1;

    IF uid IS NULL THEN
      uid := r.default_id;
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        uid,
        'authenticated',
        'authenticated',
        r.email,
        extensions.crypt('oye-demo-2026', extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now(), now(), '', '', '', ''
      );

      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        uid,
        jsonb_build_object('sub', uid::text, 'email', r.email, 'email_verified', true, 'phone_verified', false),
        'email',
        uid::text,
        now(), now(), now()
      ) ON CONFLICT DO NOTHING;
    ELSE
      UPDATE auth.users
      SET encrypted_password = extensions.crypt('oye-demo-2026', extensions.gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = uid;
    END IF;

    -- Asegurar que los usuarios demo no sean admin y tengan demo_members + profiles
    DELETE FROM public.user_roles WHERE user_id = uid;

    INSERT INTO public.demo_members (user_id, kind)
    VALUES (uid, r.persona)
    ON CONFLICT (user_id) DO UPDATE SET kind = EXCLUDED.kind;

    INSERT INTO public.profiles (id, persona, phone, full_name, neighborhood, senior_name, senior_relation)
    VALUES (uid, r.persona, '', r.full_name, r.neighborhood, r.senior_name, r.senior_relation)
    ON CONFLICT (id) DO UPDATE SET
      persona = EXCLUDED.persona,
      full_name = EXCLUDED.full_name,
      neighborhood = EXCLUDED.neighborhood,
      senior_name = EXCLUDED.senior_name,
      senior_relation = EXCLUDED.senior_relation;

    IF r.persona = 'familia' THEN
      INSERT INTO public.person_links (user_id, senior_id, requested_name, requested_phone, requested_age, relation, status, reviewed_at)
      VALUES (uid, 'd0000000-0000-4000-8000-000000000001', 'Carmen López', '+34678617031', 84, 'Madre', 'approved', now())
      ON CONFLICT (user_id, senior_id) DO UPDATE SET
        status = 'approved',
        relation = 'Madre',
        requested_phone = '+34678617031',
        requested_age = 84;
    END IF;
  END LOOP;
END $$;
