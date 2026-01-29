import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { users } from "./users";

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Positive for additions, negative for deductions
  type: text("type").notNull().$type<
    "sync_profile" | "sync_posts" | "sync_comments" | "purchase" | "refund" | "signup_bonus"
  >(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
