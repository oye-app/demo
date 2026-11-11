CREATE OR REPLACE FUNCTION public.can_manage_person(_sid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.seniors s WHERE s.id=_sid AND s.active AND CASE WHEN EXISTS(SELECT 1 FROM public.demo_members WHERE user_id=auth.uid()) THEN s.is_demo AND EXISTS(SELECT 1 FROM public.demo_members WHERE user_id=auth.uid() AND kind IN ('familia','ong')) ELSE NOT s.is_demo AND public.has_role(auth.uid(),'admin') END) $$;
REVOKE ALL ON FUNCTION public.can_manage_person(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_person(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.person_edit_details(_sid uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.can_manage_person(_sid) THEN RETURN NULL; END IF; RETURN (SELECT jsonb_build_object('id',s.id,'requested_name',s.name,'requested_phone',s.phone,'requested_age',s.age,'relation',coalesce((SELECT relation FROM public.person_links WHERE user_id=auth.uid() AND senior_id=s.id AND status='approved'),'')) FROM public.seniors s WHERE s.id=_sid); END $$;
REVOKE ALL ON FUNCTION public.person_edit_details(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.person_edit_details(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.manage_person(_sid uuid,_delete boolean,_name text DEFAULT NULL,_phone text DEFAULT NULL,_age integer DEFAULT NULL,_relation text DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM 1 FROM public.seniors WHERE id=_sid FOR UPDATE;
 IF NOT public.can_manage_person(_sid) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF _delete THEN
  IF EXISTS(SELECT 1 FROM public.alerts WHERE senior_id=_sid AND status IN ('accepted','arrived')) THEN RAISE EXCEPTION 'Active visit' USING ERRCODE='22023'; END IF;
  UPDATE public.call_schedules SET active=false WHERE senior_id=_sid;
  UPDATE public.seniors SET active=false WHERE id=_sid;
 ELSE
  IF _name IS NULL OR char_length(trim(_name)) NOT BETWEEN 2 AND 100 OR _phone IS NULL OR char_length(trim(_phone)) NOT BETWEEN 5 AND 30 OR _phone !~ '^[0-9+ ()-]+$' OR char_length(regexp_replace(_phone,'[^0-9]','','g'))<5 OR _age IS NULL OR _age NOT BETWEEN 0 AND 120 OR _relation IS NULL OR char_length(trim(_relation)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Invalid details' USING ERRCODE='22023'; END IF;
  UPDATE public.seniors SET name=trim(_name),phone=trim(_phone),age=_age WHERE id=_sid;
  UPDATE public.person_links SET requested_name=trim(_name),requested_phone=trim(_phone),requested_age=_age,relation=trim(_relation) WHERE senior_id=_sid AND user_id=auth.uid() AND status='approved';
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.manage_person(uuid,boolean,text,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_person(uuid,boolean,text,text,integer,text) TO authenticated;