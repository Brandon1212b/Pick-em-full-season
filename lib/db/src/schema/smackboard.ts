import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smackboardTable = pgTable("smackboard", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSmackboardSchema = createInsertSchema(smackboardTable).omit({ id: true, timestamp: true });
export type InsertSmackboard = z.infer<typeof insertSmackboardSchema>;
export type Smackboard = typeof smackboardTable.$inferSelect;
