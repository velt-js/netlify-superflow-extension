import { z } from "zod";

export const TeamConfigSchema = z.object({
  myTeamSpecificValue: z.string().min(1),
});

export type TeamConfig = z.output<typeof TeamConfigSchema>;
