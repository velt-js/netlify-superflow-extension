import { z } from "zod";

export const SiteConfigSchema = z.object({
	siteSpecificString: z.string().optional(),
	siteSpecificSecret: z.string().optional(),
	siteSpecificBoolean: z.boolean().optional(),
	siteSpecificNumber: z.number().optional(),
});

export type SiteConfig = z.output<typeof SiteConfigSchema>;
