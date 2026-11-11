// Supabase Edge Function: start-call
// Follows Contract A from OYE TRD
// Secret required: MAKE_START_CALL_URL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { person_id } = await req.json();
    if (!person_id) {
      return new Response(JSON.stringify({ error: "person_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const makeUrl = Deno.env.get("MAKE_START_CALL_URL");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load person
    const { data: senior, error: seniorError } = await supabase
      .from("seniors")
      .select("id, name, phone, age")
      .eq("id", person_id)
      .single();

    if (seniorError || !senior) {
      return new Response(JSON.stringify({ error: "Persona no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load relation
    const { data: link } = await supabase
      .from("person_links")
      .select("relation")
      .eq("senior_id", person_id)
      .maybeSingle();

    const relationship = link?.relation || "Familiar";

    // Format phone to E.164 without spaces
    let rawPhone = (senior.phone || "").replace(/[^\d+]/g, "");
    if (rawPhone.startsWith("00")) {
      rawPhone = "+" + rawPhone.slice(2);
    } else if (!rawPhone.startsWith("+")) {
      if (rawPhone.length === 9) {
        rawPhone = "+34" + rawPhone;
      } else {
        rawPhone = "+" + rawPhone;
      }
    }

    const payload = {
      person_id: senior.id,
      name: senior.name,
      phone: rawPhone,
      age: senior.age ?? null,
      relationship,
    };

    if (!makeUrl) {
      return new Response(
        JSON.stringify({
          error: "Falta configurar MAKE_START_CALL_URL en los secretos del proyecto",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeRes = await fetch(makeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!makeRes.ok) {
      const err = await makeRes.text();
      return new Response(
        JSON.stringify({ error: "Error al llamar al webhook de Make S1", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeData = await makeRes.json();
    return new Response(JSON.stringify({ ok: true, ...makeData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
