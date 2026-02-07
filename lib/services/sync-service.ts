import { ApifyClient } from "apify-client";
import { db } from "@/lib/db";
import {
  syncJobs,
  tiktokAccounts,
  posts,
  comments,
  accountMetricsHistory,
} from "@/lib/db/schema";
import type { SyncConfigSchema } from "@/lib/db/schema/sync-jobs";
import {
  holdCredits,
  finalizeCredits,
  refundHold,
} from "@/lib/services/credit-service";
import { eq, desc, and, gte, lte, inArray, isNull, sql } from "drizzle-orm";
import {
  CREDIT_RATES,
  calculateCommentCredits,
  calculatePostCredits,
  calculateSyncCredits,
} from "@/lib/credits";

// ─── Apify Client ────────────────────────────────────────────────────────────

const getApifyClient = () => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN environment variable is not set");
  }
  return new ApifyClient({ token });
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SYNC_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StartSyncInput {
  accountId: number;
  userId: string;
  type: "posts" | "comments" | "full";
  config: SyncConfigSchema;
}

export interface StartSyncResult {
  jobId: number;
  creditsHeld: number;
  estimatedBreakdown: { posts: number; comments: number };
}

export interface CostEstimate {
  credits: number;
  estimatedComments: number;
  description: string;
  breakdown: {
    posts: number;
    comments: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  profile?: {
    username: string;
    displayName: string;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
    avatarUrl: string;
    bio: string;
    isVerified: boolean;
  };
  error?: string;
}

export interface SyncStatus {
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "READY" | "ABORTING" | "ABORTED" | "TIMING-OUT" | "TIMED-OUT";
  startedAt?: Date;
  finishedAt?: Date;
  exitCode?: number;
  defaultDatasetId?: string;
  datasetItemCount?: number;
}

export interface ProcessedSyncResults {
  postsCount: number;
  commentsCount: number;
  newPostsCount: number;
  updatedPostsCount: number;
  newCommentsCount: number;
  updatedCommentsCount: number;
  creditsUsed: number;
  profileUpdated: boolean;
}

// Apify TikTok data types
interface TikTokAuthorMeta {
  id: string;
  name: string;
  nickName: string;
  verified: boolean;
  signature: string;
  avatar: string;
  fans: number;
  following: number;
  heart: number;
  video: number;
}

interface TikTokVideoMeta {
  height: number;
  width: number;
  duration: number;
  coverUrl: string;
}

interface TikTokPostData {
  id: string;
  text: string;
  createTime: number;
  createTimeISO: string;
  authorMeta: TikTokAuthorMeta;
  webVideoUrl: string;
  videoMeta: TikTokVideoMeta;
  diggCount: number;
  shareCount: number;
  playCount: number;
  collectCount: number;
  commentCount: number;
  comments?: TikTokCommentData[];
}

interface TikTokCommentData {
  cid: string;
  text: string;
  createTime: number;
  diggCount: number;
  user: {
    uniqueId: string;
    avatarThumb: string;
  };
}

// ─── Cost Estimation ─────────────────────────────────────────────────────────

/**
 * Estimate credits for a post sync (optionally with inline comments)
 */
export function estimateSyncCost(options: {
  postsLimit?: number;
  includeComments?: boolean;
  commentsLimit?: number;
}): CostEstimate {
  const postsLimit = Math.max(0, options.postsLimit ?? 50);
  const postsCost = calculatePostCredits(postsLimit);

  let commentsCost = 0;
  let estimatedComments = 0;
  if (options.includeComments && options.commentsLimit && options.commentsLimit > 0) {
    estimatedComments = options.commentsLimit;
    commentsCost = calculateCommentCredits(estimatedComments);
  }

  const totalCredits = postsCost + commentsCost;
  const parts = [`${postsLimit} posts (~${postsCost} credits)`];
  if (commentsCost > 0) {
    parts.push(`${estimatedComments} comments (~${commentsCost} credits)`);
  }

  return {
    credits: totalCredits,
    estimatedComments,
    description: parts.join(", "),
    breakdown: { posts: postsCost, comments: commentsCost },
  };
}

/**
 * Estimate credits for a comment-only sync
 */
export function estimateCommentSyncCost(options: {
  postCount: number;
  commentsPerPost?: number;
  totalComments?: number;
}): CostEstimate {
  const { postCount, commentsPerPost = 100, totalComments } = options;
  const estimatedComments = Math.max(0, totalComments ?? postCount * commentsPerPost);
  const commentsCost = calculateCommentCredits(estimatedComments);

  return {
    credits: commentsCost,
    estimatedComments,
    description: `Comments for ${postCount} posts (~${estimatedComments} comments, ${commentsCost} credits)`,
    breakdown: { posts: 0, comments: commentsCost },
  };
}

// ─── Username Validation ─────────────────────────────────────────────────────

/**
 * Validate that a TikTok username exists and return basic profile data
 */
export async function validateUsername(username: string): Promise<ValidationResult> {
  const client = getApifyClient();

  try {
    const run = await client.actor("clockworks/tiktok-scraper").call({
      profiles: [username.replace("@", "")],
      resultsPerPage: 1,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return { valid: false, error: "Username not found or no public content available" };
    }

    const authorMeta = (items[0] as unknown as TikTokPostData)?.authorMeta;
    if (!authorMeta) {
      return { valid: false, error: "Could not retrieve profile information" };
    }

    return {
      valid: true,
      profile: {
        username: authorMeta.name,
        displayName: authorMeta.nickName,
        followerCount: authorMeta.fans || 0,
        followingCount: authorMeta.following || 0,
        likesCount: authorMeta.heart || 0,
        videoCount: authorMeta.video || 0,
        avatarUrl: authorMeta.avatar || "",
        bio: authorMeta.signature || "",
        isVerified: authorMeta.verified || false,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error validating username",
    };
  }
}

// ─── Unified Sync Pipeline ───────────────────────────────────────────────────

/**
 * Start any sync type (posts, comments, or full).
 *
 * Flow:
 * 1. Estimate credits → hold in escrow
 * 2. Create sync_job with status "pending"
 * 3. Build Apify actor input based on type + config
 * 4. Start Apify actor run with ad-hoc webhook
 * 5. Update job with apifyRunId, status "running"
 * 6. Return jobId + creditsHeld
 */
export async function startSync(input: StartSyncInput): Promise<StartSyncResult> {
  const { accountId, userId, type, config } = input;

  // Get the account (need username for Apify)
  const [account] = await db
    .select()
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.id, accountId))
    .limit(1);

  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  // 1. Estimate and hold credits
  const estimate = await calculateEstimate(type, config, accountId);
  const creditsToHold = estimate.credits;

  await holdCredits(
    userId,
    creditsToHold,
    `Hold for ${type} sync of @${account.username}`
  );

  // 2. Create sync job
  const [syncJob] = await db
    .insert(syncJobs)
    .values({
      accountId,
      userId,
      type,
      status: "pending",
      creditsEstimated: creditsToHold,
      creditsHeld: creditsToHold,
      commentsEstimated: estimate.estimatedComments || null,
      syncConfig: config,
    })
    .returning();

  try {
    const client = getApifyClient();

    // 3. Build actor input and start run
    let runId: string;

    if (type === "comments") {
      // Comment-only sync uses the comments scraper actor
      runId = await startCommentActor(client, accountId, config, syncJob.id);
    } else {
      // Posts or full sync uses the main TikTok scraper
      runId = await startPostActor(client, account.username, config, syncJob.id);
    }

    // 4. Update job with run ID and status
    await db
      .update(syncJobs)
      .set({
        apifyRunId: runId,
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJob.id));

    return {
      jobId: syncJob.id,
      creditsHeld: creditsToHold,
      estimatedBreakdown: estimate.breakdown,
    };
  } catch (error) {
    // On failure to start: refund held credits and mark job failed
    await refundHold(
      userId,
      creditsToHold,
      `Refund: failed to start ${type} sync of @${account.username}`
    );

    const errorMessage = error instanceof Error ? error.message : "Unknown error starting sync";
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJob.id));

    throw error;
  }
}

/**
 * Calculate cost estimate based on sync type and config.
 * For comment syncs, queries actual comment counts from the DB
 * so credit holds match realistic usage instead of worst-case.
 */
export async function calculateEstimate(
  type: "posts" | "comments" | "full",
  config: SyncConfigSchema,
  accountId: number
): Promise<CostEstimate> {
  if (type === "comments") {
    const maxCommentsPerPost = config.maxCommentsPerPost ?? 100;
    let postCount: number;
    let totalComments: number | undefined;

    const mode = config.commentMode ?? "top_performers";

    switch (mode) {
      case "selection": {
        postCount = config.selectedPostIds?.length ?? 0;
        if (config.selectedPostIds && config.selectedPostIds.length > 0) {
          const selectedPosts = await db
            .select({ comments: posts.comments })
            .from(posts)
            .where(
              and(
                eq(posts.accountId, accountId),
                inArray(posts.tiktokId, config.selectedPostIds)
              )
            );
          totalComments = selectedPosts.reduce(
            (sum, p) => sum + Math.min(p.comments ?? 0, maxCommentsPerPost),
            0
          );
        }
        break;
      }
      case "top_performers": {
        const topN = config.topCount ?? 10;
        postCount = topN;
        const topPosts = await db
          .select({ comments: posts.comments })
          .from(posts)
          .where(eq(posts.accountId, accountId))
          .orderBy(desc(sql`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`))
          .limit(topN);
        totalComments = topPosts.reduce(
          (sum, p) => sum + Math.min(p.comments ?? 0, maxCommentsPerPost),
          0
        );
        break;
      }
      case "date_range": {
        if (config.dateRange) {
          const rangePosts = await db
            .select({ comments: posts.comments })
            .from(posts)
            .where(
              and(
                eq(posts.accountId, accountId),
                gte(posts.postedAt, new Date(config.dateRange.start)),
                lte(posts.postedAt, new Date(config.dateRange.end))
              )
            );
          postCount = rangePosts.length;
          totalComments = rangePosts.reduce(
            (sum, p) => sum + Math.min(p.comments ?? 0, maxCommentsPerPost),
            0
          );
        } else {
          postCount = 10;
        }
        break;
      }
      default:
        postCount = config.topCount ?? 10;
    }

    return estimateCommentSyncCost({
      postCount,
      commentsPerPost: maxCommentsPerPost,
      totalComments,
    });
  }

  return estimateSyncCost({
    postsLimit: config.postsLimit ?? 50,
    includeComments: type === "full",
    commentsLimit: type === "full" ? (config.postsLimit ?? 50) * (config.maxCommentsPerPost ?? 100) : 0,
  });
}

/**
 * Start the TikTok post scraper actor
 */
async function startPostActor(
  client: ApifyClient,
  username: string,
  config: SyncConfigSchema,
  jobId: number
): Promise<string> {
  const actorInput: Record<string, unknown> = {
    profiles: [username.replace("@", "")],
    resultsPerPage: config.postsLimit ?? 50,
    profileScrapeSections: ["videos"],
    profileSorting: config.sorting ?? "latest",
  };

  if (config.oldestPostDate) {
    actorInput.oldestPostDateUnified = config.oldestPostDate;
  }
  if (config.newestPostDate) {
    actorInput.newestPostDate = config.newestPostDate;
  }

  // Build webhook options
  const webhooks = buildWebhooks();

  const run = await client.actor("clockworks/tiktok-scraper").start(actorInput, {
    webhooks,
  });

  console.log(`[Sync Job ${jobId}] Started post actor run: ${run.id}`);
  return run.id;
}

/**
 * Start the TikTok comment scraper actor
 */
async function startCommentActor(
  client: ApifyClient,
  accountId: number,
  config: SyncConfigSchema,
  jobId: number
): Promise<string> {
  // Resolve posts to sync based on config
  const postsToSync = await getPostsForCommentSync(accountId, config);

  if (postsToSync.length === 0) {
    throw new Error("No posts found matching the specified criteria");
  }

  const postUrls = postsToSync.map(
    (p) => p.videoUrl || `https://www.tiktok.com/@user/video/${p.tiktokId}`
  );

  const actorInput: Record<string, unknown> = {
    postURLs: postUrls,
    commentsPerPost: config.maxCommentsPerPost ?? 100,
    maxRepliesPerComment: 0,
  };

  const webhooks = buildWebhooks();

  const run = await client.actor("clockworks/tiktok-comments-scraper").start(actorInput, {
    webhooks,
  });

  console.log(`[Sync Job ${jobId}] Started comment actor run: ${run.id} for ${postsToSync.length} posts`);
  return run.id;
}

/**
 * Build Apify ad-hoc webhook configuration.
 * In production (NEXT_PUBLIC_APP_URL is set), registers webhooks for instant processing.
 * In local dev, webhook won't fire — polling fallback handles it.
 */
function buildWebhooks() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;

  if (!appUrl || !webhookSecret) {
    return undefined;
  }

  return [
    {
      eventTypes: [
        "ACTOR.RUN.SUCCEEDED" as const,
        "ACTOR.RUN.FAILED" as const,
        "ACTOR.RUN.ABORTED" as const,
        "ACTOR.RUN.TIMED_OUT" as const,
      ],
      requestUrl: `${appUrl}/api/webhooks/apify?secret=${webhookSecret}`,
    },
  ];
}

// ─── Result Processing ───────────────────────────────────────────────────────

/**
 * Process results from a completed sync job.
 * Called by either the Apify webhook or the polling fallback.
 *
 * Handles:
 * - Profile data update (from post scraper)
 * - Post upsert scoped by (accountId, tiktokId) — fixes ownership bug
 * - Comment upsert
 * - Credit escrow finalization (refund overpayment)
 */
export async function processSyncResults(jobId: number): Promise<ProcessedSyncResults> {
  // Atomic claim: set completedAt as a lock to prevent concurrent processing
  // by both the webhook and the polling fallback. Only one UPDATE will match
  // the "running AND completedAt IS NULL" condition.
  const [claimed] = await db
    .update(syncJobs)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(syncJobs.id, jobId),
        inArray(syncJobs.status, ["running", "pending"]),
        isNull(syncJobs.completedAt)
      )
    )
    .returning();

  if (!claimed) {
    // Another processor already claimed this job (or it's already completed/failed)
    const [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
    return {
      postsCount: job?.postsCount ?? 0,
      commentsCount: job?.commentsCount ?? 0,
      newPostsCount: job?.newPostsCount ?? 0,
      updatedPostsCount: job?.updatedPostsCount ?? 0,
      newCommentsCount: job?.newCommentsCount ?? 0,
      updatedCommentsCount: job?.updatedCommentsCount ?? 0,
      creditsUsed: job?.creditsUsed ?? 0,
      profileUpdated: false,
    };
  }

  const job = claimed;

  if (!job.apifyRunId) {
    throw new Error(`Sync job ${jobId} has no Apify run ID`);
  }

  try {
    const client = getApifyClient();
    const run = await client.run(job.apifyRunId).get();

    if (!run || !run.defaultDatasetId) {
      throw new Error("Could not retrieve Apify run dataset");
    }

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      // No data returned — finalize with 0 credits (refund full hold)
      await finalizeAndComplete(job, { postsCount: 0, commentsCount: 0, newPostsCount: 0, updatedPostsCount: 0, newCommentsCount: 0, updatedCommentsCount: 0 }, 0, false);
      return { postsCount: 0, commentsCount: 0, newPostsCount: 0, updatedPostsCount: 0, newCommentsCount: 0, updatedCommentsCount: 0, creditsUsed: 0, profileUpdated: false };
    }

    let result: ProcessedSyncResults;

    if (job.type === "comments") {
      result = await processCommentResults(job, items);
    } else {
      result = await processPostResults(job, items as unknown as TikTokPostData[]);
    }

    return result;
  } catch (error) {
    // On processing failure: refund held credits and mark job failed.
    // IMPORTANT: Always update job status even if refund fails, to prevent
    // the job from getting stuck (completedAt set by claim, but status never updated).
    const errorMessage = error instanceof Error ? error.message : "Unknown error processing results";

    if (job.creditsHeld && job.creditsHeld > 0) {
      try {
        await refundHold(
          job.userId,
          job.creditsHeld,
          `Refund: sync processing failed for job ${jobId}`
        );
      } catch (refundError) {
        console.error(`[Sync Job ${jobId}] Failed to refund credits:`, refundError);
      }
    }

    await db
      .update(syncJobs)
      .set({
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, jobId));

    throw error;
  }
}

/**
 * Process post/full sync results
 */
async function processPostResults(
  job: typeof syncJobs.$inferSelect,
  typedItems: TikTokPostData[]
): Promise<ProcessedSyncResults> {
  let profileUpdated = false;

  // Update profile from authorMeta of the first result
  const authorMeta = typedItems[0]?.authorMeta;
  if (authorMeta) {
    await db
      .update(tiktokAccounts)
      .set({
        displayName: authorMeta.nickName,
        avatarUrl: authorMeta.avatar,
        followerCount: authorMeta.fans || 0,
        followingCount: authorMeta.following || 0,
        likesCount: authorMeta.heart || 0,
        videoCount: authorMeta.video || 0,
        bio: authorMeta.signature,
        isVerified: authorMeta.verified,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tiktokAccounts.id, job.accountId));

    await db.insert(accountMetricsHistory).values({
      accountId: job.accountId,
      followerCount: authorMeta.fans || 0,
      followingCount: authorMeta.following || 0,
      likesCount: authorMeta.heart || 0,
      videoCount: authorMeta.video || 0,
      recordedAt: new Date(),
    });

    profileUpdated = true;
  }

  // Upsert posts — scoped by (accountId, tiktokId) to prevent ownership collision
  let postsCount = 0;
  let commentsCount = 0;
  let newPostsCount = 0;
  let updatedPostsCount = 0;
  let newCommentsCount = 0;
  let updatedCommentsCount = 0;
  const postsWithCommentChanges = new Set<number>();

  for (const item of typedItems) {
    if (!item.id) continue;

    // Check for existing post scoped to THIS account
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.accountId, job.accountId),
          eq(posts.tiktokId, item.id)
        )
      )
      .limit(1);

    const postData = {
      description: item.text || "",
      likes: item.diggCount || 0,
      comments: item.commentCount || 0,
      shares: item.shareCount || 0,
      plays: item.playCount || 0,
      saves: item.collectCount || 0,
      duration: item.videoMeta?.duration || 0,
      thumbnailUrl: item.videoMeta?.coverUrl || "",
      videoUrl: item.webVideoUrl || "",
      updatedAt: new Date(),
    };

    if (existingPost) {
      await db.update(posts).set(postData).where(eq(posts.id, existingPost.id));
      updatedPostsCount++;
    } else {
      await db.insert(posts).values({
        accountId: job.accountId,
        tiktokId: item.id,
        ...postData,
        postedAt: item.createTimeISO ? new Date(item.createTimeISO) : undefined,
      });
      newPostsCount++;
    }
    postsCount++;

    // Process inline comments if present (from full sync)
    if (item.comments && Array.isArray(item.comments)) {
      const [postRecord] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.accountId, job.accountId),
            eq(posts.tiktokId, item.id)
          )
        )
        .limit(1);

      if (postRecord) {
        let postHadComments = false;
        for (const comment of item.comments) {
          if (!comment.cid) continue;

          const [existing] = await db
            .select({ id: comments.id })
            .from(comments)
            .where(eq(comments.tiktokId, comment.cid))
            .limit(1);

          if (existing) {
            await db.update(comments).set({
              likes: comment.diggCount || 0,
              text: comment.text || "",
            }).where(eq(comments.id, existing.id));
            updatedCommentsCount++;
          } else {
            await db.insert(comments).values({
              postId: postRecord.id,
              tiktokId: comment.cid,
              text: comment.text || "",
              authorUsername: comment.user?.uniqueId || "",
              authorAvatarUrl: comment.user?.avatarThumb || "",
              likes: comment.diggCount || 0,
              postedAt: comment.createTime ? new Date(comment.createTime * 1000) : undefined,
            });
            newCommentsCount++;
          }
          commentsCount++;
          postHadComments = true;
        }
        if (postHadComments) {
          postsWithCommentChanges.add(postRecord.id);
        }
      }
    }
  }

  // Update comment sync metadata on posts that had comments processed
  for (const postId of postsWithCommentChanges) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, postId));

    await db.update(posts).set({
      commentsSyncedAt: new Date(),
      syncedCommentCount: Number(countResult?.count ?? 0),
    }).where(eq(posts.id, postId));
  }

  const actualCredits = calculateActualCredits(postsCount, commentsCount);
  await finalizeAndComplete(job, { postsCount, commentsCount, newPostsCount, updatedPostsCount, newCommentsCount, updatedCommentsCount }, actualCredits, profileUpdated);

  return { postsCount, commentsCount, newPostsCount, updatedPostsCount, newCommentsCount, updatedCommentsCount, creditsUsed: actualCredits, profileUpdated };
}

/**
 * Process comment-only sync results
 */
async function processCommentResults(
  job: typeof syncJobs.$inferSelect,
  items: Record<string, unknown>[]
): Promise<ProcessedSyncResults> {
  let commentsCount = 0;
  let newCommentsCount = 0;
  let updatedCommentsCount = 0;
  const postsWithCommentChanges = new Set<number>();

  for (const item of items) {
    const comment = item as unknown as TikTokCommentData & {
      postUrl?: string; videoId?: string;
      videoWebUrl?: string; submittedVideoUrl?: string;
    };
    if (!comment.cid) continue;

    // Extract video ID from available URL fields (Apify comment scraper uses videoWebUrl)
    const videoUrl = comment.videoId
      || (comment.videoWebUrl ? extractVideoId(comment.videoWebUrl) : null)
      || (comment.submittedVideoUrl ? extractVideoId(comment.submittedVideoUrl) : null)
      || (comment.postUrl ? extractVideoId(comment.postUrl) : null);
    const videoId = videoUrl;

    if (!videoId) continue;

    // Find the post in our DB scoped to this account
    const [postRecord] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          eq(posts.accountId, job.accountId),
          eq(posts.tiktokId, videoId)
        )
      )
      .limit(1);

    if (!postRecord) continue;

    // Upsert comment — charge for all processed (Apify costs us regardless)
    const [existing] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.tiktokId, comment.cid))
      .limit(1);

    if (existing) {
      // Update existing comment metrics (likes change over time, text can be edited)
      await db.update(comments).set({
        likes: comment.diggCount || 0,
        text: comment.text || "",
      }).where(eq(comments.id, existing.id));
      updatedCommentsCount++;
    } else {
      await db.insert(comments).values({
        postId: postRecord.id,
        tiktokId: comment.cid,
        text: comment.text || "",
        authorUsername: comment.user?.uniqueId || "",
        authorAvatarUrl: comment.user?.avatarThumb || "",
        likes: comment.diggCount || 0,
        postedAt: comment.createTime ? new Date(comment.createTime * 1000) : undefined,
      });
      newCommentsCount++;
    }
    commentsCount++;
    postsWithCommentChanges.add(postRecord.id);
  }

  // Update comment sync metadata on posts that had comments processed
  for (const postId of postsWithCommentChanges) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, postId));

    await db.update(posts).set({
      commentsSyncedAt: new Date(),
      syncedCommentCount: Number(countResult?.count ?? 0),
    }).where(eq(posts.id, postId));
  }

  const actualCredits = calculateActualCredits(0, commentsCount);
  await finalizeAndComplete(job, { postsCount: 0, commentsCount, newPostsCount: 0, updatedPostsCount: 0, newCommentsCount, updatedCommentsCount }, actualCredits, false);

  return { postsCount: 0, commentsCount, newPostsCount: 0, updatedPostsCount: 0, newCommentsCount, updatedCommentsCount, creditsUsed: actualCredits, profileUpdated: false };
}

/**
 * Finalize credit escrow and mark job as completed
 */
interface SyncCounts {
  postsCount: number;
  commentsCount: number;
  newPostsCount: number;
  updatedPostsCount: number;
  newCommentsCount: number;
  updatedCommentsCount: number;
}

async function finalizeAndComplete(
  job: typeof syncJobs.$inferSelect,
  counts: SyncCounts,
  actualCredits: number,
  profileUpdated: boolean
): Promise<void> {
  const held = job.creditsHeld ?? 0;
  const creditType = job.type === "comments" ? "sync_comments" as const : "sync_posts" as const;

  // Settle the credit hold
  await finalizeCredits(
    job.userId,
    held,
    actualCredits,
    creditType,
    `Synced ${counts.postsCount} posts, ${counts.commentsCount} comments for job ${job.id}`
  );

  // Update account lastSyncedAt if profile was updated
  if (profileUpdated) {
    await db
      .update(tiktokAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(tiktokAccounts.id, job.accountId));
  }

  // Mark job complete
  await db
    .update(syncJobs)
    .set({
      status: "completed",
      postsCount: counts.postsCount,
      commentsCount: counts.commentsCount,
      newPostsCount: counts.newPostsCount,
      updatedPostsCount: counts.updatedPostsCount,
      newCommentsCount: counts.newCommentsCount,
      updatedCommentsCount: counts.updatedCommentsCount,
      creditsUsed: actualCredits,
      completedAt: new Date(),
    })
    .where(eq(syncJobs.id, job.id));

  console.log(`[Sync Job ${job.id}] Completed: ${counts.postsCount} posts (${counts.newPostsCount} new, ${counts.updatedPostsCount} updated), ${counts.commentsCount} comments (${counts.newCommentsCount} new, ${counts.updatedCommentsCount} updated), ${actualCredits} credits used (${held} held)`);
}

/**
 * Calculate actual credits based on what was received
 */
function calculateActualCredits(postsCount: number, commentsCount: number): number {
  return calculateSyncCredits(postsCount, commentsCount);
}

// ─── Post Selection for Comment Sync ─────────────────────────────────────────

/**
 * Get posts to sync comments for based on config mode
 */
async function getPostsForCommentSync(
  accountId: number,
  config: SyncConfigSchema
): Promise<Array<{ id: number; tiktokId: string; videoUrl: string | null }>> {
  const mode = config.commentMode ?? "top_performers";

  switch (mode) {
    case "selection": {
      if (!config.selectedPostIds || config.selectedPostIds.length === 0) {
        throw new Error("selectedPostIds required for selection mode");
      }
      return db
        .select({ id: posts.id, tiktokId: posts.tiktokId, videoUrl: posts.videoUrl })
        .from(posts)
        .where(
          and(
            eq(posts.accountId, accountId),
            inArray(posts.tiktokId, config.selectedPostIds)
          )
        );
    }

    case "top_performers": {
      const limit = config.topCount ?? 10;
      return db
        .select({ id: posts.id, tiktokId: posts.tiktokId, videoUrl: posts.videoUrl })
        .from(posts)
        .where(eq(posts.accountId, accountId))
        .orderBy(desc(sql`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`))
        .limit(limit);
    }

    case "date_range": {
      if (!config.dateRange) {
        throw new Error("dateRange required for date_range mode");
      }
      return db
        .select({ id: posts.id, tiktokId: posts.tiktokId, videoUrl: posts.videoUrl })
        .from(posts)
        .where(
          and(
            eq(posts.accountId, accountId),
            gte(posts.postedAt, new Date(config.dateRange.start)),
            lte(posts.postedAt, new Date(config.dateRange.end))
          )
        )
        .orderBy(desc(sql`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`))
        .limit(100);
    }

    default:
      throw new Error(`Unknown comment sync mode: ${mode}`);
  }
}

/**
 * Extract TikTok video ID from a URL
 */
function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

// ─── Job Status & Polling ────────────────────────────────────────────────────

/**
 * Get sync job status. If job is running and Apify has finished,
 * process results inline (polling fallback for local dev without webhooks).
 * Also enforces the 30-minute timeout.
 */
export async function getSyncJobStatus(jobId: number): Promise<{
  job: typeof syncJobs.$inferSelect;
  apifyStatus?: SyncStatus;
}> {
  let [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));

  if (!job) {
    throw new Error(`Sync job ${jobId} not found`);
  }

  let apifyStatus: SyncStatus | undefined;

  if (job.apifyRunId && job.status === "running") {
    // Check for timeout
    if (job.startedAt && Date.now() - job.startedAt.getTime() > SYNC_TIMEOUT_MS) {
      await handleJobTimeout(job);
      [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
      return { job };
    }

    apifyStatus = await pollApifyStatus(job.apifyRunId);

    if (apifyStatus.status === "SUCCEEDED") {
      // Polling fallback: Apify is done but webhook hasn't processed it yet
      try {
        await processSyncResults(jobId);
      } catch (error) {
        console.error(`[Sync Job ${jobId}] Error processing results during polling:`, error);
      }
      [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
    } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(apifyStatus.status)) {
      await handleJobFailure(job, `Apify run ${apifyStatus.status.toLowerCase()}`);
      [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
    }
  }

  return { job, apifyStatus };
}

/**
 * Get active and recent jobs for an account — single endpoint for UI
 */
export async function getAccountSyncData(accountId: number, userId: string) {
  // Active jobs (pending or running, and not already claimed for processing).
  // The completedAt IS NULL check prevents showing jobs that were claimed by
  // processSyncResults but got stuck before status could be updated.
  let activeJobs = await db
    .select()
    .from(syncJobs)
    .where(
      and(
        eq(syncJobs.accountId, accountId),
        eq(syncJobs.userId, userId),
        inArray(syncJobs.status, ["pending", "running"]),
        isNull(syncJobs.completedAt)
      )
    )
    .orderBy(desc(syncJobs.createdAt));

  // Clean up stuck jobs: status is still "running" but completedAt was set
  // (claimed for processing but never finalized). Force-fail them.
  // Grace period: only consider jobs stuck if completedAt was set more than
  // 60 seconds ago, to avoid racing with webhook/polling processors.
  const stuckJobs = await db
    .select()
    .from(syncJobs)
    .where(
      and(
        eq(syncJobs.accountId, accountId),
        eq(syncJobs.userId, userId),
        inArray(syncJobs.status, ["pending", "running"]),
        sql`${syncJobs.completedAt} IS NOT NULL`,
        sql`${syncJobs.completedAt} < NOW() - INTERVAL '60 seconds'`
      )
    );

  for (const stuckJob of stuckJobs) {
    console.warn(`[Sync Job ${stuckJob.id}] Found stuck job (status=${stuckJob.status}, completedAt set). Force-failing.`);
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        error: "Job got stuck during processing",
      })
      .where(eq(syncJobs.id, stuckJob.id));
  }

  // Polling fallback: for any running jobs with an Apify run ID, check if
  // Apify has finished and process results if so. This handles the case where
  // webhooks don't reach the server (e.g. local dev without ngrok).
  // Also enriches running jobs with live dataset item counts for progress tracking.
  let jobsChanged = false;
  const liveItemCounts = new Map<number, number>();
  for (const job of activeJobs) {
    if (job.status === "running" && job.apifyRunId) {
      // Check for timeout
      if (job.startedAt && Date.now() - job.startedAt.getTime() > SYNC_TIMEOUT_MS) {
        await handleJobTimeout(job);
        jobsChanged = true;
        continue;
      }

      try {
        const apifyStatus = await pollApifyStatus(job.apifyRunId);
        if (apifyStatus.status === "SUCCEEDED") {
          await processSyncResults(job.id);
          jobsChanged = true;
        } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(apifyStatus.status)) {
          await handleJobFailure(job, `Apify run ${apifyStatus.status.toLowerCase()}`);
          jobsChanged = true;
        } else if (apifyStatus.status === "RUNNING" && apifyStatus.datasetItemCount != null) {
          liveItemCounts.set(job.id, apifyStatus.datasetItemCount);
        }
      } catch (error) {
        console.error(`[Sync Job ${job.id}] Error checking Apify status during poll:`, error);
        jobsChanged = true;
      }
    }
  }

  // Re-fetch jobs if any were processed so we return accurate state
  if (jobsChanged) {
    activeJobs = await db
      .select()
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.accountId, accountId),
          eq(syncJobs.userId, userId),
          inArray(syncJobs.status, ["pending", "running"]),
          isNull(syncJobs.completedAt)
        )
      )
      .orderBy(desc(syncJobs.createdAt));
  }

  // Recent completed/failed jobs (last 5)
  const recentJobs = await db
    .select()
    .from(syncJobs)
    .where(
      and(
        eq(syncJobs.accountId, accountId),
        eq(syncJobs.userId, userId),
        inArray(syncJobs.status, ["completed", "failed"])
      )
    )
    .orderBy(desc(syncJobs.createdAt))
    .limit(5);

  // Account stats
  const [postStats] = await db
    .select({
      syncedPosts: sql<number>`count(*)`,
    })
    .from(posts)
    .where(eq(posts.accountId, accountId));

  const [commentStats] = await db
    .select({
      syncedComments: sql<number>`count(*)`,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(posts.accountId, accountId));

  const [accountData] = await db
    .select({
      videoCount: tiktokAccounts.videoCount,
      lastSyncedAt: tiktokAccounts.lastSyncedAt,
    })
    .from(tiktokAccounts)
    .where(eq(tiktokAccounts.id, accountId))
    .limit(1);

  // Enrich running jobs with live dataset item counts for progress tracking
  const enrichedActiveJobs = activeJobs.map((job) => {
    const liveCount = liveItemCounts.get(job.id);
    if (liveCount == null) return job;
    return {
      ...job,
      // Set the appropriate count field based on job type so the frontend
      // can show real-time progress (e.g. "42 so far") while Apify runs
      commentsCount: job.type === "comments" ? liveCount : job.commentsCount,
      postsCount: (job.type === "posts" || job.type === "full") ? liveCount : job.postsCount,
    };
  });

  return {
    activeJobs: enrichedActiveJobs,
    recentJobs,
    stats: {
      syncedPosts: Number(postStats?.syncedPosts ?? 0),
      totalPosts: accountData?.videoCount ?? 0,
      syncedComments: Number(commentStats?.syncedComments ?? 0),
      lastSyncedAt: accountData?.lastSyncedAt?.toISOString() ?? null,
    },
  };
}

/**
 * Poll Apify run status
 */
async function pollApifyStatus(runId: string): Promise<SyncStatus> {
  const client = getApifyClient();
  const run = await client.run(runId).get();

  if (!run) {
    throw new Error(`Apify run ${runId} not found`);
  }

  // For running jobs, get live dataset item count for progress tracking
  let datasetItemCount: number | undefined;
  if (run.status === "RUNNING" && run.defaultDatasetId) {
    try {
      const dataset = await client.dataset(run.defaultDatasetId).get();
      datasetItemCount = dataset?.itemCount ?? undefined;
    } catch {
      // Non-critical — progress just won't update this poll cycle
    }
  }

  return {
    status: run.status as SyncStatus["status"],
    startedAt: run.startedAt ? new Date(run.startedAt) : undefined,
    finishedAt: run.finishedAt ? new Date(run.finishedAt) : undefined,
    exitCode: run.exitCode,
    defaultDatasetId: run.defaultDatasetId,
    datasetItemCount,
  };
}

// Also export for use by API routes that need raw polling
export { pollApifyStatus as pollSyncStatus };

// ─── Failure & Timeout Handling ──────────────────────────────────────────────

/**
 * Handle a timed-out job: refund credits and mark failed
 */
async function handleJobTimeout(job: typeof syncJobs.$inferSelect): Promise<void> {
  console.warn(`[Sync Job ${job.id}] Timed out after ${SYNC_TIMEOUT_MS / 60000} minutes`);

  // Try to abort the Apify run
  try {
    const client = getApifyClient();
    await client.run(job.apifyRunId!).abort();
  } catch {
    // Best-effort abort
  }

  await handleJobFailure(job, `Timed out after ${SYNC_TIMEOUT_MS / 60000} minutes`);
}

/**
 * Handle job failure: refund held credits and update status
 */
async function handleJobFailure(
  job: typeof syncJobs.$inferSelect,
  errorMessage: string
): Promise<void> {
  // Refund held credits
  if (job.creditsHeld && job.creditsHeld > 0) {
    await refundHold(
      job.userId,
      job.creditsHeld,
      `Refund: ${errorMessage} for job ${job.id}`
    );
  }

  await db
    .update(syncJobs)
    .set({
      status: "failed",
      error: errorMessage,
      completedAt: new Date(),
    })
    .where(eq(syncJobs.id, job.id));
}

/**
 * Handle Apify webhook callback
 */
export async function handleSyncWebhook(
  runId: string,
  status: "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT"
): Promise<void> {
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.apifyRunId, runId));

  if (!job) {
    console.error(`[Webhook] No sync job found for Apify run: ${runId}`);
    return;
  }

  // Skip if job is already completed/failed (e.g., polling already processed it)
  if (job.status === "completed" || job.status === "failed") {
    console.log(`[Webhook] Job ${job.id} already ${job.status}, skipping`);
    return;
  }

  if (status === "SUCCEEDED") {
    try {
      await processSyncResults(job.id);
    } catch (error) {
      console.error(`[Webhook] Error processing results for job ${job.id}:`, error);
      // processSyncResults already handles failure + refund
    }
  } else {
    await handleJobFailure(job, `Apify run ${status.toLowerCase()}`);
  }
}

/**
 * Cancel a running sync job
 */
export async function cancelSyncJob(jobId: number): Promise<void> {
  const [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));

  if (!job) {
    throw new Error(`Sync job ${jobId} not found`);
  }

  if (job.status !== "running" || !job.apifyRunId) {
    throw new Error("Job is not running or has no Apify run ID");
  }

  const client = getApifyClient();

  try {
    await client.run(job.apifyRunId).abort();
  } catch {
    // Best-effort abort
  }

  await handleJobFailure(job, "Cancelled by user");
}

// ─── Maintenance ─────────────────────────────────────────────────────────────

/**
 * Clean up stuck jobs: any job running longer than SYNC_TIMEOUT_MS
 * Can be called from a cron job or admin endpoint
 */
export async function cleanupStuckJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - SYNC_TIMEOUT_MS);

  const stuckJobs = await db
    .select()
    .from(syncJobs)
    .where(
      and(
        inArray(syncJobs.status, ["pending", "running"]),
        lte(syncJobs.createdAt, cutoff)
      )
    );

  let cleaned = 0;
  for (const job of stuckJobs) {
    await handleJobTimeout(job);
    cleaned++;
  }

  if (cleaned > 0) {
    console.log(`[Cleanup] Cleaned up ${cleaned} stuck sync jobs`);
  }

  return cleaned;
}
