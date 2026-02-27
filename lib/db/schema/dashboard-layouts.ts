import { pgTable, text, timestamp, serial, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users";

// TypeScript interfaces for widget positioning
export interface WidgetPosition {
  id: string;
  widgetType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface BreakpointLayouts {
  lg: WidgetPosition[];
  md: WidgetPosition[];
  sm: WidgetPosition[];
}

export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Default Dashboard"),
  isDefault: boolean("is_default").default(false),
  layouts: jsonb("layouts").$type<BreakpointLayouts>(),
  widgetConfigs: jsonb("widget_configs").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("dashboard_layouts_user_id_idx").on(table.userId),
]);
