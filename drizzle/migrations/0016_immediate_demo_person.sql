CREATE OR REPLACE FUNCTION public.add_demo_person(_name text, _phone text, _age integer, _relation text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); sid uuid; area text;
BEGIN
 IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.demo_members WHERE user_id=uid AND kind IN ('familia','ong')) THEN RAISE EXCEPTION 'Demo membership required' USING ERRCODE='42501'; END IF;
 IF _name IS NULL OR char_length(trim(_name)) NOT BETWEEN 2 AND 100 OR _phone IS NULL OR char_length(trim(_phone)) NOT BETWEEN 5 AND 30 OR _phone !~ '^[0-9+ ()-]+$' OR char_length(regexp_replace(_phone,'[^0-9]','','g')) < 5 OR _age IS NULL OR _age NOT BETWEEN 0 AND 120 OR _relation IS NULL OR char_length(trim(_relation)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Invalid person details' USING ERRCODE='22023'; END IF;
 SELECT neighborhood INTO area FROM public.profiles WHERE id=uid;
 INSERT INTO public.seniors(name,phone,age,active,is_demo,neighborhood) VALUES(trim(_name),trim(_phone),_age,true,true,coalesce(area,'')) RETURNING id INTO sid;
 INSERT INTO public.person_links(user_id,senior_id,requested_name,requested_phone,requested_age,relation,status,reviewed_at) VALUES(uid,sid,trim(_name),trim(_phone),_age,trim(_relation),'approved',now());
 RETURN sid;
END $$;
REVOKE ALL ON FUNCTION public.add_demo_person(text,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.add_demo_person(text,text,integer,text) TO authenticated;