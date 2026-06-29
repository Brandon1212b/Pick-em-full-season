import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type UserRole = "member" | "admin";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  avatar: text("avatar"),
  role: text("role").$type<UserRole>().notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
