import { z } from "zod";

export const TeamConfigSchema = z.object({
	exampleString: z.string().optional(),
	exampleSecret: z.string().optional(),
	exampleBoolean: z.boolean().optional(),
	exampleNumber: z.number().optional(),
});

export type TeamConfig = z.output<typeof TeamConfigSchema>;
