import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seasonConfigTable = pgTable("season_config", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull().default("pre-season"),
  lastCompletedWeek: integer("last_completed_week").notNull().default(0),
});

export const insertSeasonConfigSchema = createInsertSchema(seasonConfigTable).omit({ id: true });
export type InsertSeasonConfig = z.infer<typeof insertSeasonConfigSchema>;
export type SeasonConfig = typeof seasonConfigTable.$inferSelect;
