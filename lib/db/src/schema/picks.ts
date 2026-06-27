import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { matchesTable } from "./matches";

export const picksTable = pgTable("picks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  matchId: integer("match_id").notNull().references(() => matchesTable.id),
  selectedTeam: text("selected_team").notNull(),
  isLock: boolean("is_lock").notNull().default(false),
  pointsEarned: integer("points_earned").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPickSchema = createInsertSchema(picksTable).omit({ id: true, pointsEarned: true, updatedAt: true });
export type InsertPick = z.infer<typeof insertPickSchema>;
export type Pick = typeof picksTable.$inferSelect;
