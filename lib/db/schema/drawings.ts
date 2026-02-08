import { pgTable, text, timestamp, serial, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const drawings = pgTable("drawings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("My Drawing"),
  isDefault: boolean("is_default").default(false),
  elements: jsonb("elements").default([]).$type<unknown[]>(),
  appState: jsonb("app_state").$type<{
    viewBackgroundColor?: string;
    zoom?: number;
    scrollX?: number;
    scrollY?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
