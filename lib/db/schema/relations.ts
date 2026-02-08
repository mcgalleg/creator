import { relations } from "drizzle-orm";
import { users } from "./users";
import { tiktokAccounts } from "./tiktok-accounts";
import { posts } from "./posts";
import { comments } from "./comments";
import { accountMetricsHistory } from "./metrics";
import { pinnedComponents } from "./pinned-components";
import { creditTransactions } from "./credits";
import { syncJobs } from "./sync-jobs";
import { drawings } from "./drawings";
import { dashboardLayouts } from "./dashboard-layouts";
import { userFeatureOverrides } from "./feature-flags";

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  tiktokAccounts: many(tiktokAccounts),
  pinnedComponents: many(pinnedComponents),
  creditTransactions: many(creditTransactions),
  syncJobs: many(syncJobs),
  drawings: many(drawings),
  dashboardLayouts: many(dashboardLayouts),
  featureOverrides: many(userFeatureOverrides),
}));

// TikTok accounts relations
export const tiktokAccountsRelations = relations(tiktokAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [tiktokAccounts.userId],
    references: [users.id],
  }),
  posts: many(posts),
  metricsHistory: many(accountMetricsHistory),
  syncJobs: many(syncJobs),
}));

// Posts relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  account: one(tiktokAccounts, {
    fields: [posts.accountId],
    references: [tiktokAccounts.id],
  }),
  comments: many(comments),
}));

// Comments relations
export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

// Account metrics history relations
export const accountMetricsHistoryRelations = relations(accountMetricsHistory, ({ one }) => ({
  account: one(tiktokAccounts, {
    fields: [accountMetricsHistory.accountId],
    references: [tiktokAccounts.id],
  }),
}));

// Pinned components relations
export const pinnedComponentsRelations = relations(pinnedComponents, ({ one }) => ({
  user: one(users, {
    fields: [pinnedComponents.userId],
    references: [users.id],
  }),
}));

// Credit transactions relations
export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// Sync jobs relations
export const syncJobsRelations = relations(syncJobs, ({ one }) => ({
  account: one(tiktokAccounts, {
    fields: [syncJobs.accountId],
    references: [tiktokAccounts.id],
  }),
  user: one(users, {
    fields: [syncJobs.userId],
    references: [users.id],
  }),
}));

// Drawings relations
export const drawingsRelations = relations(drawings, ({ one }) => ({
  user: one(users, {
    fields: [drawings.userId],
    references: [users.id],
  }),
}));

// Dashboard layouts relations
export const dashboardLayoutsRelations = relations(dashboardLayouts, ({ one }) => ({
  user: one(users, {
    fields: [dashboardLayouts.userId],
    references: [users.id],
  }),
}));

// User feature overrides relations
export const userFeatureOverridesRelations = relations(userFeatureOverrides, ({ one }) => ({
  user: one(users, {
    fields: [userFeatureOverrides.userId],
    references: [users.id],
  }),
}));
