import { pgTable, text, timestamp, serial, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const canvases = pgTable("canvases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My Canvas"),
  isDefault: boolean("is_default").default(false),
  nodes: jsonb("nodes").default([]).$type<unknown[]>(),
  edges: jsonb("edges").default([]).$type<unknown[]>(),
  viewport: jsonb("viewport").$type<{ x: number; y: number; zoom: number }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
