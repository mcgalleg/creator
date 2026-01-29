import { pgTable, text, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const canvasAnnotations = pgTable("canvas_annotations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'text', 'sticky', 'comment'
  content: text("content"),
  canvasData: jsonb("canvas_data").notNull().$type<{
    position: { x: number; y: number };
    size?: { width: number; height: number };
    style?: { color?: string; [key: string]: unknown };
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
