import { z } from "zod";

export const SiteConfigSchema = z.object({
  mySiteSpecificValue: z.string().min(1),
});

export type SiteConfig = z.output<typeof SiteConfigSchema>;
