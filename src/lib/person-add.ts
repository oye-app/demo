import { personRequestSchema } from "./person-request";

export async function addDemoPersonRecord(input: unknown, kind: string | null, create: (details: ReturnType<typeof personRequestSchema.parse>) => Promise<string>) {
  if (kind !== "familia" && kind !== "ong") throw new Error("El alta inmediata solo está disponible en la demo.");
  return create(personRequestSchema.parse(input));
}