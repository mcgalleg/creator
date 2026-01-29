import { pgTable, text, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const pinnedComponents = pgTable("pinned_components", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  componentType: text("component_type").notNull(),
  title: text("title"),
  configuration: jsonb("configuration").notNull().$type<Record<string, unknown>>(),
  gridPosition: jsonb("grid_position").$type<{ x: number; y: number; w: number; h: number }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
