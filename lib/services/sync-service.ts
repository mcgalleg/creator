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
    bioUrl?: string;
    profileCategory?: string;
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

// ApiDojo TikTok data types
interface ApiDojoPostData {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  hashtags: string[];
  uploadedAtFormatted: string;
  postPage: string;
  channel: {
    username: string;
    name: string;
    avatar: string;
    followers: number;
    following: number;
    videos: number;
    bio: string;
    verified: boolean;
  };
  video: {
    duration: number;
    cover: string;
    url: string;
    ratio: string;
  };
  song: {
    title: string;
  };
}

interface ApiDojoCommentData {
  id: string;
  text: string;
  createdAt: string; // ISO string
  likeCount: number;
  replyCount: number;
  commentLanguage: string;
  isAuthorLiked: boolean;
  awemeId: string; // video ID directly
  user: {
    username: string;
    nickname: string;
    avatarUrl: string;
    region: string;
  };
}

interface ApiDojoUserData {
  id: string;
  username: string;
  nickname: string;
  bio: string;
  bioUrl: string;
  followers: number;
  following: number;
  likes: number;
  videos: number;
  verified: boolean;
  profileCategory: string;
  avatar: string;
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
  const cleanUsername = username.replace("@", "");

  try {
    // Run profile scraper and user scraper in parallel
    const [profileRun, userRun] = await Promise.all([
      client.actor("apidojo/tiktok-profile-scraper").call({
        usernames: [cleanUsername],
        maxItems: 1,
      }),
      client.actor("apidojo/tiktok-user-scraper").call({
        startUrls: [`https://www.tiktok.com/@${cleanUsername}`],
        maxItems: 1,
        getFollowers: false,
        getFollowing: false,
      }).catch(() => null), // Graceful degradation
    ]);

    const { items: profileItems } = await client.dataset(profileRun.defaultDatasetId).listItems();

    if (!profileItems || profileItems.length === 0) {
      return { valid: false, error: "Username not found or no public content available" };
    }

    const post = profileItems[0] as unknown as ApiDojoPostData;
    const channel = post?.channel;
    if (!channel) {
      return { valid: false, error: "Could not retrieve profile information" };
    }

    // Get user scraper data if available
    let userData: ApiDojoUserData | null = null;
    if (userRun) {
      try {
        const { items: userItems } = await client.dataset(userRun.defaultDatasetId).listItems();
        if (userItems && userItems.length > 0) {
          userData = userItems[0] as unknown as ApiDojoUserData;
        }
      } catch {
        // User scraper data unavailable — continue with profile data only
      }
    }

    return {
      valid: true,
      profile: {
        username: channel.username,
        displayName: channel.name,
        followerCount: Math.round(channel.followers || 0),
        followingCount: Math.round(channel.following || 0),
        likesCount: Math.round(userData?.likes || 0),
        videoCount: Math.round(channel.videos || 0),
        avatarUrl: channel.avatar || "",
        bio: channel.bio || "",
        isVerified: channel.verified || false,
        bioUrl: userData?.bioUrl,
        profileCategory: userData?.profileCategory,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error validating username",
    };
  }
}

/**
 * Fetch user profile data from ApiDojo User Scraper
 */
export async function fetchUserProfile(username: string): Promise<ApiDojoUserData | null> {
  const client = getApifyClient();
  const cleanUsername = username.replace("@", "");

  try {
    const run = await client.actor("apidojo/tiktok-user-scraper").call({
      startUrls: [`https://www.tiktok.com/@${cleanUsername}`],
      maxItems: 1,
      getFollowers: false,
      getFollowing: false,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (items && items.length > 0) {
      return items[0] as unknown as ApiDojoUserData;
    }
    return null;
  } catch {
    return null;
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
    usernames: [username.replace("@", "")],
    maxItems: config.postsLimit ?? 50,
  };

  if (config.oldestPostDate) {
    actorInput.since = config.oldestPostDate;
  }
  if (config.newestPostDate) {
    actorInput.until = config.newestPostDate;
  }

  // Build webhook options
  const webhooks = buildWebhooks();

  const run = await client.actor("apidojo/tiktok-profile-scraper").start(actorInput, {
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

  const maxCommentsPerPost = config.maxCommentsPerPost ?? 100;
  const actorInput: Record<string, unknown> = {
    startUrls: postUrls,
    maxItems: postUrls.length * maxCommentsPerPost,
    includeReplies: false,
  };

  const webhooks = buildWebhooks();

  const run = await client.actor("apidojo/tiktok-comments-scraper").start(actorInput, {
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
      requestUrl: `${appUrl}/api/webhooks/apify`,
      headersTemplate: `{"X-Apify-Webhook-Secret": "${webhookSecret}"}`,
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
      result = await processPostResults(job, items as unknown as ApiDojoPostData[]);
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
  typedItems: ApiDojoPostData[]
): Promise<ProcessedSyncResults> {
  let profileUpdated = false;

  // Update profile from channel data of the first result
  const channel = typedItems[0]?.channel;
  if (channel) {
    await db
      .update(tiktokAccounts)
      .set({
        displayName: channel.name,
        avatarUrl: channel.avatar,
        followerCount: Math.round(channel.followers || 0),
        followingCount: Math.round(channel.following || 0),
        videoCount: Math.round(channel.videos || 0),
        bio: channel.bio,
        isVerified: channel.verified,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tiktokAccounts.id, job.accountId));

    await db.insert(accountMetricsHistory).values({
      accountId: job.accountId,
      followerCount: Math.round(channel.followers || 0),
      followingCount: Math.round(channel.following || 0),
      likesCount: 0, // Not available from channel; updated via User Scraper
      videoCount: Math.round(channel.videos || 0),
      recordedAt: new Date(),
    });

    profileUpdated = true;
  }

  // Pre-query existing posts for this account
  const existingPosts = await db
    .select({ id: posts.id, tiktokId: posts.tiktokId })
    .from(posts)
    .where(eq(posts.accountId, job.accountId));
  const existingPostMap = new Map(existingPosts.map(p => [p.tiktokId, p.id]));

  // Build values array for batch upsert, deduplicating by tiktokId
  // (ApiDojo can return the same video multiple times in one dataset)
  const seenTiktokIds = new Set<string>();
  const postValues = typedItems
    .filter(item => {
      if (!item.id) return false;
      if (seenTiktokIds.has(item.id)) return false;
      seenTiktokIds.add(item.id);
      return true;
    })
    .map(item => ({
      accountId: job.accountId,
      tiktokId: item.id,
      description: item.title || "",
      likes: Math.round(item.likes || 0),
      comments: Math.round(item.comments || 0),
      shares: Math.round(item.shares || 0),
      plays: Math.round(item.views || 0),
      saves: Math.round(item.bookmarks || 0),
      duration: Math.round(item.video?.duration || 0),
      thumbnailUrl: item.video?.cover || "",
      videoUrl: item.postPage || "",
      postedAt: item.uploadedAtFormatted ? new Date(item.uploadedAtFormatted) : undefined,
      updatedAt: new Date(),
      // New ApiDojo fields
      hashtags: Array.isArray(item.hashtags)
        ? item.hashtags.filter((h): h is string => typeof h === "string")
        : null,
      videoDirectUrl: item.video?.url || null,
      aspectRatio: item.video?.ratio || null,
      songTitle: item.song?.title || null,
    }));

  let upsertedPosts: { id: number; tiktokId: string }[] = [];
  if (postValues.length > 0) {
    upsertedPosts = await db
      .insert(posts)
      .values(postValues)
      .onConflictDoUpdate({
        target: [posts.accountId, posts.tiktokId],
        set: {
          description: sql`excluded.description`,
          likes: sql`excluded.likes`,
          comments: sql`excluded.comments`,
          shares: sql`excluded.shares`,
          plays: sql`excluded.plays`,
          saves: sql`excluded.saves`,
          duration: sql`excluded.duration`,
          thumbnailUrl: sql`excluded.thumbnail_url`,
          videoUrl: sql`excluded.video_url`,
          updatedAt: sql`excluded.updated_at`,
          hashtags: sql`excluded.hashtags`,
          videoDirectUrl: sql`excluded.video_direct_url`,
          aspectRatio: sql`excluded.aspect_ratio`,
          songTitle: sql`excluded.song_title`,
        },
      })
      .returning({ id: posts.id, tiktokId: posts.tiktokId });
  }

  const postsCount = upsertedPosts.length;
  const newPostsCount = upsertedPosts.filter(p => !existingPostMap.has(p.tiktokId)).length;
  const updatedPostsCount = postsCount - newPostsCount;

  const actualCredits = calculateActualCredits(postsCount, 0);
  await finalizeAndComplete(job, { postsCount, commentsCount: 0, newPostsCount, updatedPostsCount, newCommentsCount: 0, updatedCommentsCount: 0 }, actualCredits, profileUpdated);

  // Two-phase "full" sync: after posts complete, auto-trigger comment sync
  if (job.type === "full" && upsertedPosts.length > 0) {
    try {
      await startSync({
        accountId: job.accountId,
        userId: job.userId,
        type: "comments",
        config: {
          commentMode: "selection",
          selectedPostIds: upsertedPosts.map(p => p.tiktokId),
          maxCommentsPerPost: job.syncConfig?.maxCommentsPerPost ?? 100,
        },
      });
      console.log(`[Sync Job ${job.id}] Auto-triggered comment sync for ${upsertedPosts.length} posts (full sync phase 2)`);
    } catch (commentError) {
      console.error(`[Sync Job ${job.id}] Failed to auto-trigger comment sync:`, commentError);
      // Don't fail the post sync — comments are best-effort in full sync
    }
  }

  return { postsCount, commentsCount: 0, newPostsCount, updatedPostsCount, newCommentsCount: 0, updatedCommentsCount: 0, creditsUsed: actualCredits, profileUpdated };
}

/**
 * Process comment-only sync results
 */
async function processCommentResults(
  job: typeof syncJobs.$inferSelect,
  items: Record<string, unknown>[]
): Promise<ProcessedSyncResults> {
  const postsWithCommentChanges = new Set<number>();

  // Pre-query all posts for this account to build videoId -> postId map
  const accountPosts = await db
    .select({ id: posts.id, tiktokId: posts.tiktokId })
    .from(posts)
    .where(eq(posts.accountId, job.accountId));
  const postIdMap = new Map(accountPosts.map(p => [p.tiktokId, p.id]));

  // Collect all valid comment values
  const allCommentValues: Array<{
    postId: number;
    tiktokId: string;
    text: string;
    authorUsername: string;
    authorAvatarUrl: string;
    likes: number;
    postedAt: Date | undefined;
    authorDisplayName: string | null;
    authorRegion: string | null;
    commentLanguage: string | null;
    replyCount: number;
    isAuthorLiked: boolean;
  }> = [];

  // Deduplicate by (postId, tiktokId) — ApiDojo can return duplicate comments
  const seenCommentKeys = new Set<string>();

  for (const item of items) {
    const comment = item as unknown as ApiDojoCommentData;
    if (!comment.id) continue;

    // ApiDojo provides awemeId directly — no URL parsing needed
    const videoId = comment.awemeId;
    if (!videoId) continue;

    const postId = postIdMap.get(videoId);
    if (!postId) continue;

    const dedupKey = `${postId}:${comment.id}`;
    if (seenCommentKeys.has(dedupKey)) continue;
    seenCommentKeys.add(dedupKey);

    allCommentValues.push({
      postId,
      tiktokId: comment.id,
      text: comment.text || "",
      authorUsername: comment.user?.username || "",
      authorAvatarUrl: comment.user?.avatarUrl || "",
      likes: Math.round(comment.likeCount || 0),
      postedAt: comment.createdAt ? new Date(comment.createdAt) : undefined,
      authorDisplayName: comment.user?.nickname || null,
      authorRegion: comment.user?.region || null,
      commentLanguage: comment.commentLanguage || null,
      replyCount: Math.round(comment.replyCount || 0),
      isAuthorLiked: comment.isAuthorLiked || false,
    });
    postsWithCommentChanges.add(postId);
  }

  // Pre-query existing comments for counting
  const affectedPostIds = [...postsWithCommentChanges];
  let existingCommentSet = new Set<string>();
  if (affectedPostIds.length > 0) {
    const existingComments = await db
      .select({ tiktokId: comments.tiktokId, postId: comments.postId })
      .from(comments)
      .where(inArray(comments.postId, affectedPostIds));
    existingCommentSet = new Set(existingComments.map(c => `${c.postId}:${c.tiktokId}`));
  }

  // Batch upsert in chunks
  const CHUNK_SIZE = 500;
  for (let i = 0; i < allCommentValues.length; i += CHUNK_SIZE) {
    const chunk = allCommentValues.slice(i, i + CHUNK_SIZE);
    await db
      .insert(comments)
      .values(chunk)
      .onConflictDoUpdate({
        target: [comments.postId, comments.tiktokId],
        set: {
          text: sql`excluded.text`,
          likes: sql`excluded.likes`,
          authorUsername: sql`excluded.author_username`,
          authorAvatarUrl: sql`excluded.author_avatar_url`,
          authorDisplayName: sql`excluded.author_display_name`,
          authorRegion: sql`excluded.author_region`,
          commentLanguage: sql`excluded.comment_language`,
          replyCount: sql`excluded.reply_count`,
          isAuthorLiked: sql`excluded.is_author_liked`,
        },
      });
  }

  const commentsCount = allCommentValues.length;
  const newCommentsCount = allCommentValues.filter(c => !existingCommentSet.has(`${c.postId}:${c.tiktokId}`)).length;
  const updatedCommentsCount = commentsCount - newCommentsCount;

  // Batch update comment sync metadata (single query instead of N+1)
  if (postsWithCommentChanges.size > 0) {
    const affectedIds = [...postsWithCommentChanges];
    await db.execute(sql`
      UPDATE posts
      SET comments_synced_at = NOW(),
          synced_comment_count = sub.cnt,
          updated_at = NOW()
      FROM (
        SELECT post_id, COUNT(*)::int AS cnt
        FROM comments
        WHERE post_id IN ${sql`(${sql.join(affectedIds.map(id => sql`${id}`), sql`, `)})`}
        GROUP BY post_id
      ) sub
      WHERE posts.id = sub.post_id
    `);
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
    if (stuckJob.creditsHeld && stuckJob.creditsHeld > 0) {
      try {
        await refundHold(
          stuckJob.userId,
          stuckJob.creditsHeld,
          `Refund: stuck job ${stuckJob.id} force-failed`
        );
      } catch (refundError) {
        console.error(`[Sync Job ${stuckJob.id}] Failed to refund credits for stuck job:`, refundError);
      }
    }
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

  // Last completed sync job (not limited by recentJobs window)
  const [lastCompletedJob] = await db
    .select({ completedAt: syncJobs.completedAt })
    .from(syncJobs)
    .where(
      and(
        eq(syncJobs.accountId, accountId),
        eq(syncJobs.userId, userId),
        eq(syncJobs.status, "completed")
      )
    )
    .orderBy(desc(syncJobs.completedAt))
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
      lastCompletedJobAt: lastCompletedJob?.completedAt?.toISOString() ?? null,
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
  if (job.creditsHeld && job.creditsHeld > 0) {
    try {
      await refundHold(
        job.userId,
        job.creditsHeld,
        `Refund: ${errorMessage} for job ${job.id}`
      );
    } catch (refundError) {
      console.error(`[Sync Job ${job.id}] Failed to refund credits during failure handling:`, refundError);
    }
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

  if (!["pending", "running"].includes(job.status)) {
    throw new Error("Job is not pending or running");
  }

  if (job.apifyRunId) {
    const client = getApifyClient();
    try {
      await client.run(job.apifyRunId).abort();
    } catch {
      // Best-effort abort
    }
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
