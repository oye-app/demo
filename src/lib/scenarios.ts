export type Line = { who: "oye" | "mayor"; text: string };
export type ScenarioKey = "bien" | "bajo" | "compania" | "no_contesta";

export const SCENARIOS: Record<ScenarioKey, { label: string; hint: string; lines: (n: string) => Line[] }> = {
  bien: {
    label: "Está bien",
    hint: "Un día normal",
    lines: (n) => [
      { who: "oye", text: `Buenos días, ${n}. Soy OYE, una inteligencia artificial. ¿Qué tal ha dormido?` },
      { who: "mayor", text: "Muy bien, hija. Ayer vino mi nieta a comer." },
      { who: "oye", text: "¡Qué bonito! ¿Ha tomado ya su pastilla de la tensión?" },
      { who: "mayor", text: "Sí, con el desayuno. Ahora salgo a comprar el pan." },
      { who: "oye", text: `Estupendo. Que tenga buen día, ${n}. ¡Hasta mañana!` },
    ],
  },
  bajo: {
    label: "Ánimo bajo",
    hint: "Triste o con dolor",
    lines: (n) => [
      { who: "oye", text: `Buenos días, ${n}. Soy OYE, una inteligencia artificial. ¿Cómo se encuentra hoy?` },
      { who: "mayor", text: "Pues regular. No he pegado ojo, me duele mucho la rodilla." },
      { who: "oye", text: "Lo siento mucho. ¿Ha podido comer algo?" },
      { who: "mayor", text: "Poca cosa. No tengo ganas de nada, la verdad. Desde que murió mi marido…" },
      { who: "oye", text: "Le entiendo. Voy a pedir que una persona de verdad le llame hoy. ¿Le parece bien?" },
      { who: "mayor", text: "Sí, gracias." },
    ],
  },
  compania: {
    label: "Quiere compañía",
    hint: "Se siente sola",
    lines: (n) => [
      { who: "oye", text: `Buenos días, ${n}. Soy OYE, una inteligencia artificial. ¿Cómo ha dormido?` },
      { who: "mayor", text: "Bien, pero estos días estoy muy sola. No viene nadie." },
      { who: "oye", text: "¿Le gustaría que un vecino viniera a tomar un café con usted?" },
      { who: "mayor", text: "Pues mira, sí. Me haría mucha ilusión." },
      { who: "oye", text: "Perfecto. Aviso ahora a un voluntario del barrio. ¡Hasta mañana!" },
    ],
  },
  no_contesta: {
    label: "No contesta",
    hint: "Tres intentos sin respuesta",
    lines: () => [
      { who: "oye", text: "09:00 · Llamada sin respuesta." },
      { who: "oye", text: "09:15 · Segundo intento. Sin respuesta." },
      { who: "oye", text: "09:30 · Tercer intento. Sin respuesta. Aviso a la ONG y a la familia." },
    ],
  },
};
