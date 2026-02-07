import { pgTable, text, integer, timestamp, serial, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Positive for additions, negative for deductions
  type: text("type").notNull().$type<
    "sync_posts" | "sync_comments" | "credit_hold" | "purchase" | "refund" | "signup_bonus"
  >(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("credit_tx_user_created_idx").on(table.userId, table.createdAt),
]);
