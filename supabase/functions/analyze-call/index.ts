import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Turn {
  role: "agent" | "user";
  timeSec?: number;
  text: string;
}

function parseTranscriptTurns(rawTranscript: string, rawArray?: any[]): Turn[] {
  if (Array.isArray(rawArray) && rawArray.length > 0) {
    return rawArray
      .map((t: any) => {
        const r = String(t.role || t.who || "").toLowerCase();
        const role: "agent" | "user" =
          r.includes("user") || r.includes("mayor") || r.includes("usuario") || r.includes("carmen") || r.includes("antonio")
            ? "user"
            : "agent";
        const text = String(t.message ?? t.text ?? "").trim();
        const timeSec = typeof t.time_in_call_secs === "number" ? t.time_in_call_secs : undefined;
        return { role, timeSec, text };
      })
      .filter((t) => t.text.length > 0);
  }

  const lines = rawTranscript
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const turns: Turn[] = [];
  const lineRegex =
    /^(AGENT|AGENTE|OYE|ASISTENTE|IA|AI|BOT|USER|USUARIO|PERSONA MAYOR|MAYOR|PACIENTE|CARMEN|ANTONIO|PILAR|MANUEL)\s*(?:\[(\d+(?:\.\d+)?)s?\])?\s*:\s*(.+)$/i;

  for (const line of lines) {
    const m = line.match(lineRegex);
    if (m) {
      const speakerRaw = m[1].toUpperCase();
      const role: "agent" | "user" =
        speakerRaw === "AGENT" ||
        speakerRaw === "AGENTE" ||
        speakerRaw === "OYE" ||
        speakerRaw === "ASISTENTE" ||
        speakerRaw === "IA" ||
        speakerRaw === "AI" ||
        speakerRaw === "BOT"
          ? "agent"
          : "user";
      const timeSec = m[2] ? Math.round(Number(m[2])) : undefined;
      const text = m[3].trim();
      if (text) {
        turns.push({ role, timeSec, text });
      }
    } else if (turns.length > 0 && !line.startsWith("-") && !/^(Datos de|Transcripci|Genera )/i.test(line)) {
      turns[turns.length - 1].text += " " + line;
    }
  }

  return turns;
}

function analyzeSpanishConversation(params: {
  turns: Turn[];
  rawTranscript: string;
  seniorName: string;
  phone: string;
  durationSec: number;
  rawAiReport?: Record<string, any> | null;
}) {
  const { turns, rawTranscript, seniorName, phone, durationSec, rawAiReport } = params;
  const firstName = seniorName.trim().split(/\s+/)[0] || "Carmen";

  const userTurns = turns.filter((t) => t.role === "user");
  const agentTurns = turns.filter((t) => t.role === "agent");

  // If no structured turns were matched, treat non-header lines as user text fallback
  const userFullText =
    userTurns.length > 0
      ? userTurns.map((t) => t.text).join(" ")
      : rawTranscript
          .split(/\r?\n/)
          .filter((l) => !/^(AGENT|OYE|Datos de|- Nombre|- ID|- Edad|- Relaci|- Duraci|- Acepta|Transcripci|Genera )/i.test(l.trim()))
          .join(" ");

  const userLower = userFullText.toLowerCase();

  // Pair each user turn with the immediately preceding agent turn for Q&A context
  const qaPairs: { agentQ: string; userA: string }[] = [];
  let lastAgent = "";
  for (const t of turns) {
    if (t.role === "agent") {
      lastAgent = t.text;
    } else {
      qaPairs.push({ agentQ: lastAgent, userA: t.text });
    }
  }

  // Extract verbatim quotes spoken by the user (prefer substantive non-greeting sentences first)
  const nonGreetingUserQuotes = userTurns
    .map((t) => t.text.trim())
    .filter(
      (txt) =>
        txt.length >= 10 &&
        !/^(hola|buenos d[ií]as|buenas tardes|s[ií]|no|vale|claro|adi[oó]s|hasta luego)\b/i.test(txt)
    );
  const substantiveUserQuotes = userTurns
    .map((t) => t.text.trim())
    .filter((txt) => txt.length >= 8 && !/^(hola|buenos d[ií]as|s[ií]|no|vale|claro|adi[oó]s|hasta luego)\.?!?$/i.test(txt));

  const fallbackUserQuotes = userTurns.map((t) => t.text.trim()).filter((txt) => txt.length > 0);
  const combinedQuotes = [...nonGreetingUserQuotes, ...substantiveUserQuotes.filter((q) => !nonGreetingUserQuotes.includes(q))];
  const extractedQuotes =
    Array.isArray(rawAiReport?.citas_textuales) && rawAiReport.citas_textuales.length > 0
      ? rawAiReport.citas_textuales
      : combinedQuotes.length > 0
      ? combinedQuotes.slice(0, 3)
      : fallbackUserQuotes.length > 0
      ? fallbackUserQuotes.slice(0, 3)
      : ["Conversación telefónica registrada sin intervenciones extensas."];

  // 1. Detect Emergency / Red Flags strictly from USER speech
  const emergencyMatch = userFullText.match(
    /(me he ca[ií]do|me ca[ií]|estoy en el suelo|no puedo levantarme|duele mucho el pecho|dolor en el pecho|me ahogo|no puedo respirar|falta el aire|sangr[aeo]|me desmayo|no quiero vivir|quitarme la vida|mejor muert[ao]|socorro|ayuda urgente|auxilio)/i
  );

  // 2. Detect Physical Pain / Symptoms from USER speech
  const painMatches: string[] = [];
  if (/\b(espalda|lumbar)\b/i.test(userLower)) painMatches.push("dolor de espalda");
  if (/\b(rodilla|pierna|cadera|pie|tobillo)\b/i.test(userLower)) painMatches.push("molestia en piernas/rodilla");
  if (/\b(cabeza|jaqueca|migra[ñn]a)\b/i.test(userLower)) painMatches.push("dolor de cabeza");
  if (/\b(mare[oa]|maread[ao]|inestable|v[eé]rtigo)\b/i.test(userLower)) painMatches.push("sensación de mareo");
  if (/\b(est[oó]mago|barriga|tripa|n[aá]usea)\b/i.test(userLower)) painMatches.push("malestar estomacal");
  if (/\b(cansad[ao]|floj[ao]|agotad[ao]|sin fuerzas|fatiga)\b/i.test(userLower)) painMatches.push("cansancio físico");
  if (/\b(tensi[oó]n alta|fiebre|tos|resfriad[ao]|gripe)\b/i.test(userLower)) painMatches.push("síntomas leves de salud");
  if (painMatches.length === 0 && /\b(me duele|tengo dolor|dolorid[ao]|molestia)\b/i.test(userLower)) {
    painMatches.push("molestia física referida");
  }

  // 3. Analyze Sleep / Descanso (Q&A and clause aware)
  let sleepStatus: "CORRECTO" | "INSOMNIO_FATIGA" | "ALERTA" | "NO_MENCIONADO" = "NO_MENCIONADO";
  let sleepQuote = "";
  for (const { agentQ, userA } of qaPairs) {
    const qAboutSleep = /\b(dormid[oa]|dormir|noche|descansad[oa]|descansar|cama|despert)\b/i.test(agentQ);
    const clauses = userA.split(/(?:,\s*pero\b|\bpero\b|;|\.)/i).map((c) => c.trim()).filter(Boolean);
    const sleepClause =
      clauses.find((c) => /\b(dorm[ií]|dormid[oa]|noche|descans[eé]|descansad[oa]|insomnio|desvelad[ao]|despert[eé]|pegu[eé] ojo)\b/i.test(c)) ||
      (qAboutSleep ? clauses[0] || userA : "");
    if (sleepClause) {
      sleepQuote = userA;
      if (/\b(fatal|muy mal|no dorm[ií]|no he dormido|no pegu[eé] ojo|en vela|casi nada|despert[eé] muchas)\b/i.test(sleepClause)) {
        sleepStatus = "ALERTA";
      } else if (/\b(mal|regular|poco|cost[oó] dormir|desvelad[ao]|insomnio|me despert[eé])\b/i.test(sleepClause)) {
        sleepStatus = "INSOMNIO_FATIGA";
      } else if (/\b(bien|muy bien|estupend|fenomenal|toda la noche|de un tir[oó]n|descans[eé]|s[ií])\b/i.test(sleepClause)) {
        sleepStatus = "CORRECTO";
      }
    }
  }

  // 4. Analyze Food / Alimentación (Q&A and clause aware)
  let foodStatus: "CORRECTO" | "DESCUIDO" | "ALERTA" | "NO_MENCIONADO" = "NO_MENCIONADO";
  let foodQuote = "";
  for (const { agentQ, userA } of qaPairs) {
    const qAboutFood = /\b(desayun|comid[oa]|comer|cenar|cenad[oa]|almuerz|apetito|hambre|cocin|calentito)\b/i.test(agentQ);
    const clauses = userA.split(/(?:,\s*pero\b|\bpero\b|;|\.)/i).map((c) => c.trim()).filter(Boolean);
    const foodClause =
      clauses.find((c) =>
        /\b(desayun\w*|com[ií]\w*|comid[oa]|cen[eé]\w*|caf[eé]|tostada\w*|leche|fruta|sopa|caldo|lentejas|pur[eé]|pan|yogur|galleta\w*|hambre|apetito|cocin\w*)\b/i.test(c)
      ) || (qAboutFood && !/\bpastilla|medicaci/i.test(userA) ? clauses[0] || userA : "");
    if (foodClause) {
      foodQuote = userA;
      if (/\b(no he comido nada|sin comer|no tengo nada de hambre|no quiero comer|no desayun[eé])\b/i.test(foodClause)) {
        foodStatus = "ALERTA";
      } else if (/\b(todav[ií]a no|a[uú]n no|poca hambre|sin ganas|solo un poco|casi nada|no he desayunado)\b/i.test(foodClause)) {
        foodStatus = "DESCUIDO";
      } else if (/\b(s[ií]|desayun\w*|com[ií]\w*|caf[eé]|tostada\w*|leche|fruta|sopa|caldo|lentejas|bien|ya tom[eé])\b/i.test(foodClause)) {
        foodStatus = "CORRECTO";
      }
    }
  }

  // 5. Analyze Medication / Adherencia (Q&A and clause aware)
  let medStatus: "CONFIRMADA" | "DUDOSA" | "NO_TOMADA" | "NO_MENCIONADA" = "NO_MENCIONADA";
  let medQuote = "";
  for (const { agentQ, userA } of qaPairs) {
    const qAboutMed = /\b(pastilla|medicaci[oó]n|medicamento|tratamiento|tensi[oó]n|enalapril|sintrom|dosis)\b/i.test(agentQ);
    const clauses = userA.split(/(?:,\s*pero\b|\bpero\b|;|\.)/i).map((c) => c.trim()).filter(Boolean);
    const medClause =
      clauses.find((c) => /\b(pastilla|medicaci[oó]n|medicamento|enalapril|sintrom|me la tom[eé]|ya la tom[eé]|se me olvid[oó]|se me hab[ií]a pasado|no me la he tomado)\b/i.test(c)) ||
      (qAboutMed && !/\bdesayun|caf[eé]|tostada/i.test(userA) ? clauses[0] || userA : "");
    if (medClause) {
      medQuote = userA;
      if (/\b(no me la he tomado|no la tom[eé]|se me olvid[oó]|se me ha olvidado|se me hab[ií]a pasado|todav[ií]a no|a[uú]n no)\b/i.test(medClause)) {
        medStatus = "NO_TOMADA";
      } else if (/\b(no me acuerdo|no s[eé] si|creo que|duda|luego me la tomo)\b/i.test(medClause)) {
        medStatus = "DUDOSA";
      } else if (/\b(s[ií]|ya me la tom[eé]|tomada|como siempre|ya la he tomado|claro|por supuesto)\b/i.test(medClause)) {
        medStatus = "CONFIRMADA";
      }
    }
  }

  // 6. Analyze Loneliness & Social Contact (UCLA-3: 3 to 9)
  let uclaScore3to9 = 3;
  let lonelinessQuote = "";
  const highLonelinessMatch = userFullText.match(
    /(muy sol[ao]|completamente sol[ao]|nadie me llama|nadie viene|llevo d[ií]as sin hablar|no hablo con nadie|encerrad[ao] todo el d[ií]a|me pesa mucho la soledad)/i
  );
  const modLonelinessMatch = userFullText.match(
    /(me siento sol[ao]|estoy sol[ao]|no ha venido nadie|hoy no vi a nadie|echo de menos|extra[ñn]o a|aburr[ií]d[ao]|el d[ií]a se hace largo|no he salido|sin salir)/i
  );
  const socialContactMatch = userFullText.match(
    /(vino mi hij[ao]|habl[eé] con mi hij[ao]|mi niet[ao]|mi vecin[ao]|rosa|sal[ií] a pasear|fui a comprar|fui al mercado|centro de mayores|estuve con|qued[eé] con|acompa[ñn]ad[ao]|viene a verme)/i
  );

  if (highLonelinessMatch) {
    uclaScore3to9 = 8;
    lonelinessQuote =
      userTurns.find((t) => new RegExp(highLonelinessMatch[0], "i").test(t.text))?.text || extractedQuotes[0];
  } else if (modLonelinessMatch) {
    uclaScore3to9 = 6;
    lonelinessQuote =
      userTurns.find((t) => new RegExp(modLonelinessMatch[0], "i").test(t.text))?.text || extractedQuotes[0];
  } else if (socialContactMatch) {
    uclaScore3to9 = 3;
    lonelinessQuote =
      userTurns.find((t) => new RegExp(socialContactMatch[0], "i").test(t.text))?.text || extractedQuotes[0];
  } else {
    uclaScore3to9 = 4;
    lonelinessQuote = extractedQuotes[0];
  }

  // 7. Analyze Mood & Spirits (Yesavage GDS-5: 0 to 5)
  let gdsScore = 0;
  let moodQuote = "";
  const severeMoodMatch = userFullText.match(
    /(muy triste|llorando|he llorado|sin ganas de nada|deprimid[ao]|no sirvo para nada|todo me sale mal|no tengo ilusi[oó]n|cansad[ao] de vivir)/i
  );
  const mildMoodMatch = userFullText.match(
    /(triste|desanimad[ao]|baj[oó]n|apagad[ao]|poco animad[ao]|mal d[ií]a|preocupad[ao]|angustiad[ao]|nervios[ao]|nostalgia|melanc[oó]lic[ao]|cansad[ao])/i
  );
  const positiveMoodMatch = userFullText.match(
    /(muy bien|estupend|fenomenal|content[ao]|tranquil[ao]|animad[ao]|alegre|feliz|con ganas|bien gracias|todo bien)/i
  );

  if (severeMoodMatch) {
    gdsScore = 4;
    moodQuote = userTurns.find((t) => new RegExp(severeMoodMatch[0], "i").test(t.text))?.text || extractedQuotes[0];
  } else if (mildMoodMatch) {
    gdsScore = 2;
    moodQuote = userTurns.find((t) => new RegExp(mildMoodMatch[0], "i").test(t.text))?.text || extractedQuotes[0];
  } else if (positiveMoodMatch) {
    gdsScore = 0;
    moodQuote = userTurns.find((t) => new RegExp(positiveMoodMatch[0], "i").test(t.text))?.text || extractedQuotes[0];
  } else {
    gdsScore = 1;
    moodQuote = extractedQuotes[0];
  }

  // 8. Calculate Self-Care Score (0 to 3)
  let autoPoints = 0;
  let evaluatedAutoCount = 0;
  if (sleepStatus !== "NO_MENCIONADO") {
    evaluatedAutoCount++;
    if (sleepStatus === "CORRECTO") autoPoints += 1;
    else if (sleepStatus === "INSOMNIO_FATIGA") autoPoints += 0.5;
  }
  if (foodStatus !== "NO_MENCIONADO") {
    evaluatedAutoCount++;
    if (foodStatus === "CORRECTO") autoPoints += 1;
    else if (foodStatus === "DESCUIDO") autoPoints += 0.5;
  }
  if (medStatus !== "NO_MENCIONADA") {
    evaluatedAutoCount++;
    if (medStatus === "CONFIRMADA") autoPoints += 1;
    else if (medStatus === "DUDOSA") autoPoints += 0.5;
  }

  const autoScore =
    evaluatedAutoCount > 0
      ? Math.max(0, Math.min(3, Math.round((autoPoints / evaluatedAutoCount) * 3)))
      : emergencyMatch
      ? 1
      : painMatches.length > 0
      ? 2
      : 3;

  // 9. Determine Alert Level (VERDE / AMARILLO / ROJO)
  const isRed =
    rawAiReport?.nivel_alerta === "ROJO" ||
    Boolean(emergencyMatch) ||
    gdsScore >= 4;

  const isYellow =
    !isRed &&
    (rawAiReport?.nivel_alerta === "AMARILLO" ||
      uclaScore3to9 >= 6 ||
      gdsScore >= 2 ||
      painMatches.length > 0 ||
      sleepStatus === "ALERTA" ||
       sleepStatus === "INSOMNIO_FATIGA" ||
      foodStatus === "ALERTA" ||
      foodStatus === "DESCUIDO" ||
      medStatus === "NO_TOMADA" ||
      medStatus === "DUDOSA");

  const nivel_alerta: "VERDE" | "AMARILLO" | "ROJO" = isRed ? "ROJO" : isYellow ? "AMARILLO" : "VERDE";

  // 10. Calculate Vocal & Conversational Fluency metrics
  const userWordCount = userFullText.split(/\s+/).filter(Boolean).length;
  const avgWordsPerTurn = userTurns.length > 0 ? Math.round(userWordCount / userTurns.length) : 0;
  const vocalState: "FLUIDO_ORIENTADO" | "LENTITUD_MONOSILABOS" | "DESORIENTACION_CONFUSION" =
    /no s[eé] d[oó]nde estoy|no me acuerdo de nada|confundid[ao]/i.test(userLower)
      ? "DESORIENTACION_CONFUSION"
      : userTurns.length <= 2 && userWordCount < 10
      ? "LENTITUD_MONOSILABOS"
      : "FLUIDO_ORIENTADO";

  const vocalObservation =
    userTurns.length > 0
      ? `${firstName} realizó ${userTurns.length} intervenciones (${userWordCount} palabras en ${durationSec} s, promedio de ${avgWordsPerTurn} palabras por respuesta). ${
          vocalState === "FLUIDO_ORIENTADO"
            ? "Discurso coherente, orientado y con buena fluidez conversacional."
            : vocalState === "LENTITUD_MONOSILABOS"
            ? "Respuestas breves o escuetas durante la llamada."
            : "Se observan posibles dudas de orientación o memoria durante la charla."
        }`
      : `Llamada de ${durationSec} segundos con registro verbal mínimo.`;

  // 11. Calculate Sub-percentages & Global Wellbeing Percentage
  const moodPct = Math.max(15, Math.min(100, Math.round(((5 - gdsScore) / 5) * 100)));
  const socialPct = Math.max(15, Math.min(100, Math.round(((9 - uclaScore3to9) / 6) * 100)));
  const chatPct =
    vocalState === "DESORIENTACION_CONFUSION"
      ? 35
      : vocalState === "LENTITUD_MONOSILABOS"
      ? 65
      : Math.min(98, 80 + Math.min(18, userTurns.length * 3));
  const routinePct =
    evaluatedAutoCount > 0
      ? Math.max(20, Math.min(100, Math.round((autoPoints / evaluatedAutoCount) * 100)))
      : painMatches.length > 0
      ? 70
      : 88;

  const sub_percentages = rawAiReport?.sub_percentages ?? {
    mood: moodPct,
    social: socialPct,
    chat: chatPct,
    routine: routinePct,
  };

  let rawGlobal = Math.round(0.3 * moodPct + 0.25 * socialPct + 0.2 * chatPct + 0.25 * routinePct);
  if (nivel_alerta === "ROJO") rawGlobal = Math.min(rawGlobal, 25);
  else if (nivel_alerta === "AMARILLO") rawGlobal = Math.min(Math.max(rawGlobal, 45), 72);
  else rawGlobal = Math.max(rawGlobal, 78);

  const global_pct = typeof rawAiReport?.global_pct === "number" ? rawAiReport.global_pct : rawGlobal;
  const score_bienestar_global = Number((global_pct / 10).toFixed(1));

  // 12. Build Dynamic Topic Findings from the REAL Call
  const discussedDetails: string[] = [];
  const badges: string[] = [];
  const signals: string[] = [];

  if (emergencyMatch) {
    discussedDetails.push(`expresó una señal de alerta urgente («${emergencyMatch[0]}»)`);
    badges.push("Alerta urgente detectada");
    signals.push(`Urgencia verbalizada: «${emergencyMatch[0]}»`);
  }

  if (painMatches.length > 0) {
    discussedDetails.push(`mencionó ${painMatches.join(" y ")}`);
    badges.push(painMatches[0].charAt(0).toUpperCase() + painMatches[0].slice(1));
    signals.push(`Refiere ${painMatches.join(", ")}`);
  }

  if (sleepStatus === "CORRECTO") {
    discussedDetails.push("indicó haber descansado bien por la noche");
    badges.push("Buen descanso");
  } else if (sleepStatus === "INSOMNIO_FATIGA" || sleepStatus === "ALERTA") {
    discussedDetails.push("comentó haber dormido mal o con interrupciones");
    badges.push("Sueño irregular");
    signals.push("Descanso nocturno irregular");
  }

  if (foodStatus === "CORRECTO") {
    discussedDetails.push("confirmó haber desayunado o comido adecuadamente");
    badges.push("Alimentación al día");
  } else if (foodStatus === "DESCUIDO" || foodStatus === "ALERTA") {
    discussedDetails.push("mencionó no haber desayunado/comido o tener poco apetito");
    badges.push("Apetito bajo / Pendiente comer");
    signals.push("Comida pendiente o falta de apetito");
  }

  if (medStatus === "CONFIRMADA") {
    discussedDetails.push("confirmó la toma de su medicación");
    badges.push("Medicación tomada");
  } else if (medStatus === "NO_TOMADA" || medStatus === "DUDOSA") {
    discussedDetails.push("indicó no haber tomado aún su medicación o tener dudas");
    badges.push("Medicación pendiente");
    signals.push("Olvido o duda en la toma de medicación");
  }

  if (uclaScore3to9 >= 6) {
    discussedDetails.push("expresó sensación de soledad o llevar tiempo sin compañía");
    badges.push("Agradece compañía");
    signals.push("Expresa sentimiento de soledad en casa");
  } else if (socialContactMatch) {
    discussedDetails.push(`mencionó contacto social positivo (${socialContactMatch[0]})`);
    badges.push("En contacto social");
  }

  if (gdsScore >= 2) {
    discussedDetails.push("mostró un tono de ánimo más bajo o desanimado");
    signals.push("Ánimo sensible o desmotivación expresada");
  } else if (positiveMoodMatch && !isRed && !isYellow) {
    discussedDetails.push("se mostró con buen ánimo y tranquila");
    badges.push("Ánimo estable");
  }

  if (badges.length === 0) {
    badges.push(
      userTurns.length > 0 ? `Conversación (${userTurns.length} respuestas)` : "Llamada atendida",
      vocalState === "FLUIDO_ORIENTADO" ? "Discurso coherente" : "Interacción breve"
    );
  }
  if (signals.length === 0) {
    signals.push(
      discussedDetails.length > 0
        ? `Temas conversados: ${discussedDetails.slice(0, 2).join("; ")}`
        : `Charla de ${durationSec} s (${userTurns.length} intervenciones de ${firstName})`
    );
  }

  const durLabel =
    durationSec >= 60
      ? `${Math.floor(durationSec / 60)} min ${durationSec % 60 > 0 ? `${durationSec % 60} s` : ""}`.trim()
      : `${durationSec} s`;

  const home_headline =
    rawAiReport?.home_headline ||
    (nivel_alerta === "ROJO"
      ? `Atención urgente: ${firstName} necesita ayuda (${emergencyMatch?.[0] || "alerta en llamada"})`
      : nivel_alerta === "AMARILLO"
      ? painMatches.length > 0
        ? `${firstName} mencionó ${painMatches[0]} durante la llamada`
        : medStatus === "NO_TOMADA" || medStatus === "DUDOSA"
        ? `${firstName} tiene pendiente su medicación de hoy`
        : uclaScore3to9 >= 6
        ? `${firstName} expresó sentirse sola y agradecería compañía hoy`
        : `${firstName} conversó con OYE · Requiere seguimiento suave hoy`
      : `${firstName} conversó con OYE (${durLabel}) y se encuentra bien`);

  const call_title =
    rawAiReport?.call_title ||
    (nivel_alerta === "ROJO"
      ? "Alerta prioritaria detectada en llamada"
      : nivel_alerta === "AMARILLO"
      ? `Seguimiento preventivo · ${badges.slice(0, 2).join(" · ")}`
      : `Llamada completada (${durLabel}) · ${badges.slice(0, 2).join(" · ")}`);

  const firstQuoteSnippet = extractedQuotes[0] ? ` Dijo textualmente: «${extractedQuotes[0]}».` : "";

  const summary =
    rawAiReport?.summary ||
    (discussedDetails.length > 0
      ? `En la llamada de hoy (${durLabel}, ${userTurns.length} intervenciones), ${firstName} ${discussedDetails.join(", ")}.${firstQuoteSnippet}`
      : `En la llamada de hoy (${durLabel}, ${userTurns.length} intervenciones), ${firstName} mantuvo una charla breve con OYE sin referir molestias ni incidencias.${firstQuoteSnippet}`);

  const notMentionedItems: string[] = [];
  if (sleepStatus === "NO_MENCIONADO") notMentionedItems.push("descanso nocturno");
  if (foodStatus === "NO_MENCIONADO") notMentionedItems.push("alimentación");
  if (medStatus === "NO_MENCIONADA") notMentionedItems.push("medicación");

  const autocuidadoEvidence =
    evaluatedAutoCount > 0
      ? [
          sleepQuote ? `Descanso: «${sleepQuote}»` : null,
          foodQuote ? `Comida: «${foodQuote}»` : null,
          medQuote ? `Medicación: «${medQuote}»` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : `En esta llamada (${durLabel}) no se detallaron explícitamente ${notMentionedItems.join(", ")}.`;

  const oye_recuerda_insight =
    rawAiReport?.oye_recuerda_insight ||
    (discussedDetails.length > 0
      ? `En esta llamada (${durLabel}), ${firstName} ${discussedDetails.join(", ")}.`
      : `Conversación de ${durLabel} (${userTurns.length} respuestas de ${firstName}): «${extractedQuotes[0]}».`);

  const diagnostico_situacion_ejecutivo =
    rawAiReport?.diagnostico_situacion_ejecutivo ||
    `Síntesis de la conversación (${durLabel}, ${userTurns.length} intervenciones de ${firstName}, ${userWordCount} palabras): ${
      discussedDetails.length > 0
        ? `${firstName} ${discussedDetails.join("; ")}.`
        : `${firstName} respondió de forma ${vocalState === "FLUIDO_ORIENTADO" ? "coherente y fluida" : "breve"} a la llamada de acompañamiento.`
    }${
      notMentionedItems.length > 0
        ? ` Aspectos no mencionados en esta conversación: ${notMentionedItems.join(", ")}.`
        : ""
    }`;

  const activar_protocolo_voy_yo =
    typeof rawAiReport?.activar_protocolo_voy_yo === "boolean"
      ? rawAiReport.activar_protocolo_voy_yo
      : nivel_alerta !== "VERDE";

  const recomendacion_familiar =
    rawAiReport?.recomendacion_familiar ||
    (nivel_alerta === "ROJO"
      ? `Contactar de inmediato a ${firstName} o acudir al domicilio (avisar a Rosa, vecina con llave, o al 112 si no responde).`
      : nivel_alerta === "AMARILLO"
      ? medStatus === "NO_TOMADA" || medStatus === "DUDOSA"
        ? `Llamar a ${firstName} para recordarle con cariño la toma de su medicación de hoy.`
        : painMatches.length > 0
        ? `Llamar a ${firstName} hoy para preguntarle cómo sigue de su ${painMatches[0]}.`
        : `Hacerle una llamada familiar o visita breve hoy para acompañarla.`
      : `Todo en orden según lo conversado hoy. Mantener la llamada diaria de acompañamiento.`);

  const uclaScore0to6 = Math.max(0, uclaScore3to9 - 3);

  return {
    schema_version: "1.0",
    telefono_usuario: phone,
    timestamp_evaluacion: new Date().toISOString(),
    nivel_alerta,
    resumen_ejecutivo: summary,
    score_bienestar_global,
    global_pct,
    sub_percentages,
    home_headline,
    call_title,
    summary,
    oye_recuerda_insight,
    top_badges: badges.slice(0, 4),
    bottom_tags: signals.slice(0, 4),
    diagnostico_situacion_ejecutivo,
    citas_textuales: extractedQuotes,
    senales_detectadas: signals,
    recomendacion_familiar,
    nota_memoria: oye_recuerda_insight,
    activar_protocolo_voy_yo,
    motivo_protocolo: activar_protocolo_voy_yo ? summary : null,
    motivo_protocolo_voy_yo: activar_protocolo_voy_yo ? summary : null,
    acepta_llamadas_diarias: true,
    // TRD & SituationReportCard scores
    scores: {
      ucla3: {
        score: uclaScore0to6,
        max: 6,
        pct_bienestar: socialPct,
        label: uclaScore3to9 >= 6 ? "Riesgo de soledad detectado" : "Acompañamiento percibido adecuado",
      },
      yesavage_gds5: {
        score: gdsScore,
        max: 5,
        pct_bienestar: moodPct,
        label:
          gdsScore >= 3
            ? "Alerta de apatía o bajón anímico"
            : gdsScore >= 2
            ? "Ánimo sensible hoy"
            : "Ánimo estable",
      },
      autocuidado: {
        score: autoScore,
        max: 3,
        pct_bienestar: routinePct,
        label:
          evaluatedAutoCount === 0
            ? "No detallado en esta llamada"
            : autoScore === 3
            ? "Rutinas mencionadas al día"
            : "Requiere seguimiento en rutinas",
      },
      global_pct,
    },
    // Legacy Make S3 Step 1E compatibility (`parsed_json.escalas.global.porcentaje_bienestar`)
    escalas: {
      global: {
        porcentaje_bienestar: global_pct,
        resumen_estado_general: summary,
      },
    },
    // SituationReportCard detailed geriatric scales
    evaluacion_escalas: {
      soledad_ucla: {
        nivel:
          uclaScore3to9 >= 7
            ? "AISLAMIENTO_SEVERO"
            : uclaScore3to9 >= 6
            ? "RIESGO_MODERADO"
            : "SIN_RIESGO",
        puntuacion_estimada: uclaScore3to9,
        evidencia_escuchada: `«${lonelinessQuote || extractedQuotes[0]}»`,
      },
      animo_yesavage_gds5: {
        nivel:
          gdsScore >= 3
            ? "ALERTA_APATIA_DEPRESIVA"
            : gdsScore >= 2
            ? "BAJON_ANIMICO"
            : "ESTABLE",
        puntuacion_estimada: gdsScore,
        evidencia_escuchada: `«${moodQuote || extractedQuotes[0]}»`,
      },
      autocuidado_y_salud: {
        alimentacion_hidratacion: foodStatus,
        sueno_descanso: sleepStatus,
        adherencia_medicacion: medStatus,
        evidencia_escuchada: autocuidadoEvidence,
      },
      indicadores_vocales_cognitivos: {
        estado: vocalState,
        observacion: vocalObservation,
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
          ? `💛 OYE Aviso: ${summary}`
          : `💚 OYE: ${summary}`,
      prescripcion_social_barrio:
        nivel_alerta === "AMARILLO"
          ? "Llamada o visita cercana de la red familiar/vecinal y paseo acompañado por el barrio."
          : "Mantener seguimiento telefónico diario con OYE y actividades habituales.",
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    let rawTranscript = "";
    let rawTranscriptArray: any[] | undefined = undefined;
    let seniorName = typeof body.name === "string" ? body.name : "Carmen";
    let personId = typeof body.person_id === "string" ? body.person_id : "";
    let conversationId = typeof body.conversation_id === "string" ? body.conversation_id : "";
    let phone = typeof body.phone === "string" ? body.phone : "+34678617031";
    let durationSec = typeof body.duration_sec === "number" ? body.duration_sec : 0;

    // 1. Direct ElevenLabs post_call_transcription payload support
    const elData = body.data || (body.transcript && body.conversation_id ? body : null);
    if (elData) {
      if (elData.conversation_id) conversationId = String(elData.conversation_id);
      const dyn = elData.conversation_initiation_client_data?.dynamic_variables || {};
      if (dyn.name) seniorName = String(dyn.name);
      if (dyn.person_id) personId = String(dyn.person_id);
      if (dyn.phone) phone = String(dyn.phone);
      if (typeof elData.metadata?.call_duration_secs === "number") {
        durationSec = elData.metadata.call_duration_secs;
      }
      if (Array.isArray(elData.transcript)) {
        rawTranscriptArray = elData.transcript;
      }
    }

    // 2. OpenAI messages[] payload from Make S3 Step 1C
    if (Array.isArray(body.messages)) {
      const userMessages = body.messages
        .filter((m: any) => m?.role === "user")
        .map((m: any) => (typeof m?.content === "string" ? m.content : ""))
        .join("\n");

      const sourceText = userMessages || body.messages.map((m: any) => m?.content || "").join("\n");

      const nameMatch = sourceText.match(/-\s*Nombre:\s*([^\n(]+)/i);
      if (nameMatch?.[1]?.trim()) seniorName = nameMatch[1].trim();

      const personMatch = sourceText.match(/-\s*ID de persona:\s*([^\n]+)/i);
      if (personMatch?.[1]?.trim()) personId = personMatch[1].trim();

      const convMatch = sourceText.match(/-\s*ID de conversaci[oó]n:\s*([^\n]+)/i);
      if (convMatch?.[1]?.trim()) conversationId = convMatch[1].trim();

      const durMatch = sourceText.match(/-\s*Duraci[oó]n[^:]*:\s*(\d+)/i);
      if (durMatch?.[1]) durationSec = Number(durMatch[1]);

      // Extract ONLY the section after "Transcripción completa de la conversación:" if present
      const splitParts = sourceText.split(/Transcripci[oó]n completa de la conversaci[oó]n\s*:/i);
      if (splitParts.length > 1) {
        rawTranscript = splitParts[1]
          .replace(/Genera [uú]nicamente el objeto JSON[\s\S]*$/i, "")
          .trim();
      } else {
        rawTranscript = sourceText;
      }
    } else if (typeof body.transcript === "string") {
      rawTranscript = body.transcript;
    } else if (Array.isArray(body.transcript)) {
      rawTranscriptArray = body.transcript;
    }

    const turns = parseTranscriptTurns(rawTranscript, rawTranscriptArray);
    if (!durationSec || durationSec <= 0) {
      const maxTurnSec = turns.reduce((acc, t) => (t.timeSec && t.timeSec > acc ? t.timeSec : acc), 0);
      durationSec = maxTurnSec > 0 ? maxTurnSec + 8 : Math.max(20, turns.length * 8);
    }

    console.log(
      `[analyze-call] senior=${seniorName} personId=${personId} convId=${conversationId} dur=${durationSec}s turns=${turns.length}`
    );

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    let rawAiReport: Record<string, any> | null = null;

    if (openAiKey && turns.length > 0) {
      const cleanTranscript = turns.map((t) => `${t.role.toUpperCase()}: ${t.text}`).join("\n");
      const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Analiza fielmente la transcripción real en español entre OYE (AGENT) y la persona mayor (USER). No inventes datos que no se hayan mencionado en la conversación. Devuelve JSON con nivel_alerta, home_headline, call_title, summary, oye_recuerda_insight, diagnostico_situacion_ejecutivo, citas_textuales (frases exactas de USER), recomendacion_familiar, activar_protocolo_voy_yo.",
            },
            {
              role: "user",
              content: `Persona: ${seniorName}\nDuración: ${durationSec}s\nTranscripción:\n${cleanTranscript}`,
            },
          ],
        }),
      }).catch(() => null);

      if (oaRes?.ok) {
        const oaData = await oaRes.json().catch(() => null);
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

    const reportObj = analyzeSpanishConversation({
      turns,
      rawTranscript,
      seniorName,
      phone,
      durationSec,
      rawAiReport,
    });

    // Directly persist the report into public.call_logs using SUPABASE_SERVICE_ROLE_KEY as an immediate guarantee
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRoleKey && !personId.startsWith("test-only")) {
      try {
        const sb = createClient(supabaseUrl, serviceRoleKey);
        const resolvedPersonId =
          !personId || personId === "demo-carmen" || personId === "person_123"
            ? "d0000000-0000-4000-8000-000000000001"
            : personId;

        let targetConvId = conversationId;
        if (!targetConvId) {
          const { data: recentRow } = await sb
            .from("call_logs")
            .select("conversation_id")
            .eq("person_id", resolvedPersonId)
            .in("status", ["analizando", "llamando", "urgencia_en_curso"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (recentRow?.conversation_id) {
            targetConvId = recentRow.conversation_id;
          }
        }

        if (targetConvId) {
          await sb.from("call_logs").upsert(
            {
              conversation_id: targetConvId,
              person_id: resolvedPersonId,
              nombre: seniorName.split(/\s+/)[0] || "Carmen",
              telefono_usuario: phone,
              status: "completada",
              motivo: reportObj.summary,
              duracion_seg: durationSec,
              nivel_alerta: reportObj.nivel_alerta,
              global_pct: reportObj.global_pct,
              activar_protocolo_voy_yo: reportObj.activar_protocolo_voy_yo,
              acepta_llamada: true,
              acepta_llamadas_diarias: true,
              report: reportObj,
            },
            { onConflict: "conversation_id" }
          );
          console.log(`[analyze-call] Saved report directly to call_logs for convId=${targetConvId}`);
        }
      } catch (dbErr) {
        console.error("[analyze-call] Direct DB upsert warning:", dbErr);
      }
    }

    const contentString = JSON.stringify(reportObj);

    return new Response(
      JSON.stringify({
        id: `chatcmpl-${crypto.randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: openAiKey ? "gpt-4o" : "oye-clinical-analyzer-v3",
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
    console.error("[analyze-call] Error:", err);
    return new Response(
      JSON.stringify({ error: "Error analyzing call", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
