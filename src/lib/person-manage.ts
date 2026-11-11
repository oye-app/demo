import { z } from "zod";
import { personRequestSchema } from "./person-request";

export const personUpdateSchema = personRequestSchema.extend({ id: z.string().uuid() });
export const personDeleteSchema = z.object({ id: z.string().uuid(), confirmed: z.literal(true) });