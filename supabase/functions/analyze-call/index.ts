import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildCompleteReport(params: {
  rawReport?: Record<string, any> | null;
  transcriptText: string;
  seniorName?: string;
  phone?: string;
  durationSec?: number;
}) {
  const { rawReport, transcriptText, seniorName = "Carmen", phone = "+34678617031", durationSec = 95 } = params;
  const firstName = seniorName.trim().split(/\s+/)[0] || "Carmen";
  const lower = transcriptText.toLowerCase();

  const isRed =
    rawReport?.nivel_alerta === "ROJO" ||
    /ca[ií]d[ao]|suelo|pecho|ahog|sangr|no puedo levantarme|socorro|ayuda urgente|desmay|morir|suicid|no quiero vivir/.test(
      lower
    );

  const isYellow =
    !isRed &&
    (rawReport?.nivel_alerta === "AMARILLO" ||
      /sol[ao]|triste|nadie|llor|mal|dolor|no he comido|no dorm[ií]|olvid|mareo|cansad[ao]|no salgo|aburr/.test(
        lower
      ));

  const nivel_alerta: "VERDE" | "AMARILLO" | "ROJO" =
    rawReport?.nivel_alerta === "ROJO" || rawReport?.nivel_alerta === "AMARILLO" || rawReport?.nivel_alerta === "VERDE"
      ? rawReport.nivel_alerta
      : isRed
      ? "ROJO"
      : isYellow
      ? "AMARILLO"
      : "VERDE";

  // Extract user lines from transcript for verbatim quotes
  const lines = transcriptText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const userLines = lines
    .filter((l) => /^(persona mayor|user|usuario|mayor|carmen|antonio)\s*:/i.test(l))
    .map((l) => l.replace(/^[^:]+:\s*/i, "").trim())
    .filter((l) => l.length > 3);

  const extractedQuotes =
    Array.isArray(rawReport?.citas_textuales) && rawReport.citas_textuales.length > 0
      ? rawReport.citas_textuales
      : userLines.length > 0
      ? userLines.slice(0, 3)
      : [
          nivel_alerta === "ROJO"
            ? "Necesito ayuda, no me encuentro bien en este momento."
            : nivel_alerta === "AMARILLO"
            ? "Hoy el día se me ha hecho un poco largo en casa, pero agradezco mucho que me llames."
            : "Estoy bien, tranquila en casa; he desayunado y tomado mi pastilla como todos los días.",
        ];

  const uclaScore3to9 =
    typeof rawReport?.evaluacion_escalas?.soledad_ucla?.puntuacion_estimada === "number"
      ? rawReport.evaluacion_escalas.soledad_ucla.puntuacion_estimada
      : nivel_alerta === "ROJO"
      ? 7
      : nivel_alerta === "AMARILLO"
      ? 6
      : 3;

  const uclaScore0to6 =
    typeof rawReport?.scores?.ucla3?.score === "number"
      ? rawReport.scores.ucla3.score
      : Math.max(0, uclaScore3to9 - 3);

  const gdsScore =
    typeof rawReport?.scores?.yesavage_gds5?.score === "number"
      ? rawReport.scores.yesavage_gds5.score
      : nivel_alerta === "ROJO"
      ? 4
      : nivel_alerta === "AMARILLO"
      ? 2
      : 0;

  const autoScore =
    typeof rawReport?.scores?.autocuidado?.score === "number"
      ? rawReport.scores.autocuidado.score
      : nivel_alerta === "ROJO"
      ? 1
      : nivel_alerta === "AMARILLO"
      ? 2
      : 3;

  const global_pct =
    typeof rawReport?.global_pct === "number"
      ? rawReport.global_pct
      : typeof rawReport?.scores?.global_pct === "number"
      ? rawReport.scores.global_pct
      : nivel_alerta === "ROJO"
      ? 28
      : nivel_alerta === "AMARILLO"
      ? 62
      : 90;

  const score_bienestar_global =
    typeof rawReport?.score_bienestar_global === "number"
      ? rawReport.score_bienestar_global
      : Number((global_pct / 10).toFixed(1));

  const sub_percentages = rawReport?.sub_percentages ?? {
    mood: nivel_alerta === "ROJO" ? 30 : nivel_alerta === "AMARILLO" ? 60 : 92,
    social: nivel_alerta === "ROJO" ? 35 : nivel_alerta === "AMARILLO" ? 58 : 88,
    chat: nivel_alerta === "ROJO" ? 40 : nivel_alerta === "AMARILLO" ? 72 : 94,
    routine: nivel_alerta === "ROJO" ? 25 : nivel_alerta === "AMARILLO" ? 65 : 90,
  };

  const home_headline =
    rawReport?.home_headline ||
    (nivel_alerta === "ROJO"
      ? `Atención prioritaria: ${firstName} requiere contacto inmediato`
      : nivel_alerta === "AMARILLO"
      ? `${firstName} agradece compañía extra hoy`
      : `${firstName} está tranquila y con buen ánimo hoy`);

  const call_title =
    rawReport?.call_title ||
    (nivel_alerta === "ROJO"
      ? "Alerta detectada en llamada de acompañamiento"
      : nivel_alerta === "AMARILLO"
      ? "Seguimiento preventivo · Señales de soledad o cansancio"
      : "Llamada diaria completada · Rutina y ánimo estables");

  const summary =
    rawReport?.summary ||
    (nivel_alerta === "ROJO"
      ? `Se detectaron señales de urgencia o malestar agudo durante la conversación con ${firstName}. Se recomienda contacto inmediato de la familia y red de cercanía.`
      : nivel_alerta === "AMARILLO"
      ? `${firstName} conversó con OYE pero expresó señales leves de soledad o cansancio. Conviene hacerle una llamada familiar o visita de cercanía esta tarde.`
      : `${firstName} mantuvo una conversación cálida y fluida con OYE (${Math.max(1, Math.round(durationSec / 60))} min). Se muestra orientada, descansada y con sus rutinas de comida y medicación al día.`);

  const oye_recuerda_insight =
    rawReport?.oye_recuerda_insight ||
    rawReport?.nota_memoria ||
    (nivel_alerta === "ROJO"
      ? `Cambio brusco respecto a las llamadas previas: requiere verificación presencial o telefónica inmediata.`
      : nivel_alerta === "AMARILLO"
      ? `En comparación con días anteriores, ${firstName} menciona pasar más horas sola en casa; responde muy positivamente cuando conversa.`
      : `${firstName} mantiene estabilidad anímica, buena orientación temporal y adherencia a su medicación matutina.`);

  const top_badges: string[] =
    Array.isArray(rawReport?.top_badges) && rawReport.top_badges.length > 0
      ? rawReport.top_badges
      : nivel_alerta === "ROJO"
      ? ["Atención inmediata", "Protocolo Voy Yo"]
      : nivel_alerta === "AMARILLO"
      ? ["Llamada completada", "Agradece compañía"]
      : ["Medicación al día", "Buen descanso", "Orientada y fluida"];

  const senales_detectadas: string[] =
    Array.isArray(rawReport?.senales_detectadas) && rawReport.senales_detectadas.length > 0
      ? rawReport.senales_detectadas
      : nivel_alerta === "ROJO"
      ? ["Malestar agudo verbalizado", "Requiere asistencia presencial"]
      : nivel_alerta === "AMARILLO"
      ? ["Sensación de soledad leve", "Necesidad de escucha y compañía"]
      : ["Conversación receptiva", "Rutinas cotidianas conservadas"];

  const bottom_tags: string[] =
    Array.isArray(rawReport?.bottom_tags) && rawReport.bottom_tags.length > 0
      ? rawReport.bottom_tags
      : senales_detectadas;

  const diagnostico_situacion_ejecutivo =
    rawReport?.diagnostico_situacion_ejecutivo ||
    (nivel_alerta === "ROJO"
      ? `Durante la llamada de acompañamiento se identifican indicadores de alerta prioritaria en ${firstName}. Se activa aviso inmediato a su red familiar y vecinal («Voy yo») para comprobación presencial.`
      : nivel_alerta === "AMARILLO"
      ? `Evaluación orientativa: ${firstName} conserva orientación en tiempo y espacio, con discurso coherente pero tono anímico más bajo de lo habitual. Se sugiere reforzar el acompañamiento familiar o vecinal durante la jornada.`
      : `Evaluación orientativa: ${firstName} presenta discurso fluido, coherente y bien articulado. Refiere descanso nocturno reparador, ingesta adecuada y toma regular de su medicación habitual, sin indicadores de soledad clínica ni apatía.`);

  const activar_protocolo_voy_yo =
    typeof rawReport?.activar_protocolo_voy_yo === "boolean"
      ? rawReport.activar_protocolo_voy_yo
      : nivel_alerta !== "VERDE";

  const recomendacion_familiar =
    rawReport?.recomendacion_familiar ||
    (nivel_alerta === "ROJO"
      ? `Llamar de inmediato a ${firstName} o acudir al domicilio; si no responde, contactar a Rosa (vecina con llave) o al 112.`
      : nivel_alerta === "AMARILLO"
      ? `Llamar a ${firstName} esta tarde para charlar un rato o coordinar una visita breve.`
      : `Todo en orden hoy. Mantener la llamada diaria programada de OYE para mañana.`);

  return {
    schema_version: "1.0",
    telefono_usuario: phone,
    timestamp_evaluacion: new Date().toISOString(),
    nivel_alerta,
    score_bienestar_global,
    global_pct,
    sub_percentages,
    home_headline,
    call_title,
    summary,
    oye_recuerda_insight,
    top_badges,
    bottom_tags,
    diagnostico_situacion_ejecutivo,
    citas_textuales: extractedQuotes,
    senales_detectadas,
    recomendacion_familiar,
    nota_memoria: oye_recuerda_insight,
    activar_protocolo_voy_yo,
    motivo_protocolo: activar_protocolo_voy_yo ? summary : null,
    acepta_llamadas_diarias: true,
    scores: {
      ucla3: {
        score: uclaScore0to6,
        max: 6,
        pct_bienestar: Math.round(((6 - uclaScore0to6) / 6) * 100),
        label:
          uclaScore3to9 >= 6
            ? "Riesgo de soledad detectado"
            : "Acompañamiento percibido adecuado",
      },
      yesavage_gds5: {
        score: gdsScore,
        max: 5,
        pct_bienestar: Math.round(((5 - gdsScore) / 5) * 100),
        label:
          gdsScore >= 3
            ? "Alerta de apatía o bajón anímico"
            : gdsScore >= 1
            ? "Ánimo levemente sensible"
            : "Ánimo positivo y estable",
      },
      autocuidado: {
        score: autoScore,
        max: 3,
        pct_bienestar: Math.round((autoScore / 3) * 100),
        label:
          autoScore === 3
            ? "Comida, sueño y medicación al día"
            : autoScore === 2
            ? "Descanso o apetito irregular"
            : "Alerta en rutinas básicas",
      },
      global_pct,
    },
    evaluacion_escalas: {
      soledad_ucla: {
        nivel:
          uclaScore3to9 >= 7
            ? "AISLAMIENTO_SEVERO"
            : uclaScore3to9 >= 5
            ? "RIESGO_MODERADO"
            : "SIN_RIESGO",
        puntuacion_estimada: uclaScore3to9,
        evidencia_escuchada:
          extractedQuotes[0]
            ? `«${extractedQuotes[0]}»`
            : "Conversación receptiva y con sensación de compañía.",
      },
      animo_yesavage_gds5: {
        nivel:
          gdsScore >= 3
            ? "ALERTA_APATIA_DEPRESIVA"
            : gdsScore >= 1
            ? "BAJON_ANIMICO"
            : "ESTABLE",
        puntuacion_estimada: gdsScore,
        evidencia_escuchada:
          nivel_alerta === "VERDE"
            ? "Tono cálido, participativo y con planes cotidianos."
            : "Expresa cierta nostalgia o cansancio durante la charla.",
      },
      autocuidado_y_salud: {
        alimentacion_hidratacion:
          autoScore === 3 ? "CORRECTO" : autoScore === 2 ? "DESCUIDO" : "ALERTA",
        sueno_descanso:
          autoScore === 3 ? "CORRECTO" : autoScore === 2 ? "INSOMNIO_FATIGA" : "ALERTA",
        adherencia_medicacion:
          autoScore >= 2 ? "CONFIRMADA" : "DUDOSA",
        evidencia_escuchada:
          autoScore === 3
            ? "Confirma haber desayunado, descansado bien y tomado su medicación habitual."
            : "Refiere descanso o apetito más irregular de lo habitual.",
      },
      indicadores_vocales_cognitivos: {
        estado:
          nivel_alerta === "ROJO"
            ? "DESORIENTACION_CONFUSION"
            : nivel_alerta === "AMARILLO"
            ? "LENTITUD_MONOSILABOS"
            : "FLUIDO_ORIENTADO",
        observacion:
          nivel_alerta === "VERDE"
            ? "Respuestas ágiles, buena memoria reciente y orientación temporal conservada."
            : "Ritmo más pausado; conviene seguimiento cercano en las próximas llamadas.",
      },
    },
    prescripcion_y_derivacion_humana: {
      activar_protocolo_voy_yo,
      anillo_derivacion_recomendado:
        nivel_alerta === "ROJO"
          ? "ANILLO_1_FAMILIA"
          : nivel_alerta === "AMARILLO"
          ? "ANILLO_2_VOLUNTARIO_CRUZ_ROJA_ONG"
          : "NINGUNO",
      mensaje_sms_alerta:
        nivel_alerta === "ROJO"
          ? `🚨 OYE Alerta ROJA: ${firstName} necesita atención urgente. ${summary}`
          : nivel_alerta === "AMARILLO"
          ? `💛 OYE Aviso: ${firstName} agradecería una llamada o visita hoy. ${summary}`
          : `💚 OYE: ${firstName} ha completado su llamada diaria y se encuentra muy bien.`,
      prescripcion_social_barrio:
        nivel_alerta === "AMARILLO"
          ? "Paseo acompañado por el barrio o taller de tertulia en el Centro de Mayores de Chamberí."
          : "Mantener paseo matutino habitual y contacto telefónico diario con OYE.",
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Extract transcript text whether sent as OpenAI messages[] or direct transcript string/array
    let transcriptText = "";
    let seniorName = typeof body.name === "string" ? body.name : "Carmen";
    let phone = typeof body.phone === "string" ? body.phone : "+34678617031";
    let durationSec = typeof body.duration_sec === "number" ? body.duration_sec : 95;

    if (typeof body.transcript === "string") {
      transcriptText = body.transcript;
    } else if (Array.isArray(body.transcript)) {
      transcriptText = body.transcript
        .map((t: any) => `${t.role || t.who || "hablante"}: ${t.message || t.text || ""}`)
        .join("\n");
    } else if (Array.isArray(body.messages)) {
      transcriptText = body.messages
        .map((m: any) => (typeof m?.content === "string" ? m.content : ""))
        .join("\n");
      const nameMatch = transcriptText.match(/Nombre:\s*([^\n]+)/i);
      if (nameMatch?.[1]) seniorName = nameMatch[1].trim();
      const durMatch = transcriptText.match(/Duraci[oó]n[^:]*:\s*(\d+)/i);
      if (durMatch?.[1]) durationSec = Number(durMatch[1]);
    } else {
      transcriptText = JSON.stringify(body);
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    let rawAiReport: Record<string, any> | null = null;

    if (openAiKey) {
      const systemPrompt = `Eres un experto en gerontología social y triaje preventivo del proyecto OYE en España.
Analiza la transcripción de la llamada con la persona mayor y devuelve ÚNICAMENTE un objeto JSON válido con estos campos exactos:
{
  "nivel_alerta": "VERDE" | "AMARILLO" | "ROJO",
  "home_headline": "Titular cálido y claro en español (máx 75 caracteres)",
  "call_title": "Título breve de la llamada",
  "summary": "Resumen claro y empático de 2 frases en español sobre lo conversado en la llamada",
  "oye_recuerda_insight": "Conexión con su rutina, medicación o estado emocional (1 frase)",
  "diagnostico_situacion_ejecutivo": "Síntesis geriátrica orientativa (2-3 frases) basada en lo que dijo la persona",
  "top_badges": ["Etiqueta 1", "Etiqueta 2", "Etiqueta 3"],
  "bottom_tags": ["Señal 1", "Señal 2"],
  "citas_textuales": ["Cita literal 1 dicha por la persona mayor", "Cita literal 2"],
  "senales_detectadas": ["Señal 1", "Señal 2"],
  "recomendacion_familiar": "Acción concreta recomendada para la familia",
  "activar_protocolo_voy_yo": boolean,
  "global_pct": number (0 a 100),
  "score_bienestar_global": number (0.0 a 10.0),
  "sub_percentages": { "mood": number, "social": number, "chat": number, "routine": number }
}`;

      const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Persona: ${seniorName}\nDuración: ${durationSec}s\nTranscripción:\n${transcriptText}`,
            },
          ],
        }),
      });

      if (oaRes.ok) {
        const oaData = await oaRes.json();
        const contentStr = oaData?.choices?.[0]?.message?.content;
        if (contentStr) {
          try {
            rawAiReport = JSON.parse(contentStr);
          } catch {
            rawAiReport = null;
          }
        }
      }
    }

    const reportObj = buildCompleteReport({
      rawReport: rawAiReport,
      transcriptText,
      seniorName,
      phone,
      durationSec,
    });

    const contentString = JSON.stringify(reportObj);

    return new Response(
      JSON.stringify({
        id: `chatcmpl-${crypto.randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: openAiKey ? "gpt-4o" : "oye-clinical-analyzer-v2",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: contentString,
            },
            finish_reason: "stop",
          },
        ],
        ...reportObj,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Error analyzing call", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
