import { ApifyClient } from "apify-client";
import { db } from "@/lib/db";
import {
  syncJobs,
  tiktokAccounts,
  posts,
  comments,
  accountMetricsHistory,
} from "@/lib/db/schema";
import { deductCredits } from "@/lib/services/credit-service";
import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";

// Initialize Apify client
const getApifyClient = () => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("APIFY_API_TOKEN environment variable is not set");
  }
  return new ApifyClient({ token });
};

// Constants for credit calculations
const CREDITS = {
  PROFILE_SYNC_BASE: 25, // Profile + basic info
  POSTS_PER_50: 25, // 25 credits per 50 posts
  COMMENTS_PER_100: 15, // 15 credits per 100 comments
  ACTOR_START_FEE: 6, // ~$0.006 converted to credits
  PER_RESULT_FEE: 4, // ~$0.0037 converted to credits
  PER_COMMENT_FEE: 1, // ~$0.00125 converted to credits
} as const;

// Types
export interface SyncOptions {
  accountId: number;
  username: string;
  postsLimit?: number;
  includeComments?: boolean;
  commentsLimit?: number;
}

export interface CommentSyncConfig {
  mode: "selection" | "top_performers" | "date_range" | "budget";
  selectedPostIds?: string[];
  topCount?: number;
  dateRange?: { start: Date; end: Date };
  maxPerPost?: number;
  creditBudget?: number;
}

export interface CostEstimate {
  credits: number;
  description: string;
  breakdown: {
    profile: number;
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

export interface SyncJobResult {
  jobId: number;
  runId: string;
}

export interface SyncStatus {
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "READY" | "ABORTING" | "ABORTED" | "TIMING-OUT" | "TIMED-OUT";
  startedAt?: Date;
  finishedAt?: Date;
  exitCode?: number;
  defaultDatasetId?: string;
  statsItemCount?: number;
}

export interface ProcessedSyncResults {
  postsCount: number;
  commentsCount: number;
  creditsUsed: number;
  profileUpdated: boolean;
}

// TikTok data types from Apify
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

/**
 * Estimate the cost in credits for a sync operation
 */
export function estimateSyncCost(options: {
  postsLimit?: number;
  includeComments?: boolean;
  commentsLimit?: number;
}): CostEstimate {
  const postsLimit = options.postsLimit ?? 50;
  const includeComments = options.includeComments ?? false;
  const commentsLimit = options.commentsLimit ?? 0;

  // Base cost for profile sync
  const profileCost = CREDITS.PROFILE_SYNC_BASE;

  // Posts cost (based on number of posts)
  const postsCost = Math.ceil(postsLimit / 50) * CREDITS.POSTS_PER_50;

  // Comments cost (if included)
  let commentsCost = 0;
  if (includeComments && commentsLimit > 0) {
    commentsCost = Math.ceil(commentsLimit / 100) * CREDITS.COMMENTS_PER_100;
  }

  const totalCredits = profileCost + postsCost + commentsCost;

  const descriptionParts = [`Profile sync (${profileCost} credits)`, `${postsLimit} posts (~${postsCost} credits)`];
  if (includeComments && commentsLimit > 0) {
    descriptionParts.push(`${commentsLimit} comments (~${commentsCost} credits)`);
  }

  return {
    credits: totalCredits,
    description: descriptionParts.join(", "),
    breakdown: {
      profile: profileCost,
      posts: postsCost,
      comments: commentsCost,
    },
  };
}

/**
 * Estimate the cost in credits for a comment-only sync operation
 */
export function estimateCommentSyncCost(options: {
  postCount: number;
  commentsPerPost?: number;
  totalComments?: number;
}): CostEstimate {
  const { postCount, commentsPerPost = 100, totalComments } = options;

  // Calculate total comments to sync
  const estimatedComments = totalComments ?? (postCount * commentsPerPost);

  // Comments cost (based on number of comments)
  // Each post also incurs a small actor start fee
  const commentsCost = Math.ceil(estimatedComments / 100) * CREDITS.COMMENTS_PER_100;
  const actorFees = postCount * CREDITS.ACTOR_START_FEE;

  const totalCredits = commentsCost + actorFees;

  return {
    credits: totalCredits,
    description: `Comments for ${postCount} posts (~${estimatedComments} comments, ${totalCredits} credits)`,
    breakdown: {
      profile: 0,
      posts: actorFees, // Actor fees grouped under posts
      comments: commentsCost,
    },
  };
}

/**
 * Validate that a TikTok username exists and return basic profile data
 */
export async function validateUsername(username: string): Promise<ValidationResult> {
  const client = getApifyClient();

  try {
    // Run the actor with minimal settings to just validate the profile
    const run = await client.actor("clockworks/tiktok-scraper").call({
      profiles: [username.replace("@", "")],
      resultsPerPage: 1, // Just get 1 result to validate
    });

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return {
        valid: false,
        error: "Username not found or no public content available",
      };
    }

    // Extract profile data from the first result
    const firstResult = items[0] as unknown as TikTokPostData;
    const authorMeta = firstResult?.authorMeta;

    if (!authorMeta) {
      return {
        valid: false,
        error: "Could not retrieve profile information",
      };
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
    const message = error instanceof Error ? error.message : "Unknown error validating username";
    return {
      valid: false,
      error: message,
    };
  }
}

/**
 * Start a profile sync job
 */
export async function startProfileSync(options: SyncOptions & { userId: string }): Promise<SyncJobResult> {
  const { accountId, username, postsLimit = 50, includeComments = false, commentsLimit = 0, userId } = options;

  // Estimate credits for this sync
  const costEstimate = estimateSyncCost({ postsLimit, includeComments, commentsLimit });

  // Create sync job record
  const [syncJob] = await db
    .insert(syncJobs)
    .values({
      accountId,
      userId,
      type: includeComments ? "full" : "posts",
      status: "pending",
      creditsEstimated: costEstimate.credits,
    })
    .returning();

  try {
    const client = getApifyClient();

    // Build input for the actor
    const actorInput: Record<string, unknown> = {
      profiles: [username.replace("@", "")],
      resultsPerPage: postsLimit,
      profileScrapeSections: ["videos"],
      profileSorting: "latest",
    };

    // Add comments if requested
    if (includeComments && commentsLimit > 0) {
      actorInput.commentsPerPost = Math.min(Math.ceil(commentsLimit / postsLimit), 100);
    }

    // Start the actor run (don't wait for completion)
    const run = await client.actor("clockworks/tiktok-scraper").start(actorInput);

    // Update sync job with run ID and status
    await db
      .update(syncJobs)
      .set({
        apifyRunId: run.id,
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJob.id));

    return {
      jobId: syncJob.id,
      runId: run.id,
    };
  } catch (error) {
    // Update job status to failed
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
 * Start a comment-only sync job with configurable modes
 */
export async function startCommentSync(options: {
  accountId: number;
  userId: string;
  config: CommentSyncConfig;
}): Promise<SyncJobResult> {
  const { accountId, userId, config } = options;

  // Get posts to sync based on the config mode
  const postsToSync = await getPostsForCommentSync(accountId, config);

  if (postsToSync.length === 0) {
    throw new Error("No posts found matching the specified criteria");
  }

  // Calculate comments per post based on mode
  const commentsPerPost = config.maxPerPost ?? 100;
  const totalEstimatedComments = postsToSync.length * commentsPerPost;

  // Estimate credits for this sync
  const costEstimate = estimateCommentSyncCost({
    postCount: postsToSync.length,
    commentsPerPost,
    totalComments: totalEstimatedComments,
  });

  // Convert config to serializable format for storage
  const configForStorage = {
    ...config,
    dateRange: config.dateRange
      ? {
          start: config.dateRange.start.toISOString(),
          end: config.dateRange.end.toISOString(),
        }
      : undefined,
  };

  // Create sync job record with comment config
  const [syncJob] = await db
    .insert(syncJobs)
    .values({
      accountId,
      userId,
      type: "comments",
      status: "pending",
      creditsEstimated: costEstimate.credits,
      commentSyncConfig: configForStorage,
    })
    .returning();

  try {
    const client = getApifyClient();

    // Build input for the TikTok comments scraper actor
    // The actor expects an array of video URLs or IDs
    const postUrls = postsToSync.map((post) => post.videoUrl || `https://www.tiktok.com/@user/video/${post.tiktokId}`);

    const actorInput: Record<string, unknown> = {
      postURLs: postUrls,
      commentsPerPost: commentsPerPost,
      maxRepliesPerComment: 0, // Don't fetch replies by default
    };

    // Start the actor run (don't wait for completion)
    const run = await client.actor("clockworks/tiktok-comments-scraper").start(actorInput);

    // Update sync job with run ID and status
    await db
      .update(syncJobs)
      .set({
        apifyRunId: run.id,
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(syncJobs.id, syncJob.id));

    return {
      jobId: syncJob.id,
      runId: run.id,
    };
  } catch (error) {
    // Update job status to failed
    const errorMessage = error instanceof Error ? error.message : "Unknown error starting comment sync";
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
 * Get posts to sync comments for based on the config mode
 */
async function getPostsForCommentSync(
  accountId: number,
  config: CommentSyncConfig
): Promise<Array<{ id: number; tiktokId: string; videoUrl: string | null; engagement: number }>> {
  switch (config.mode) {
    case "selection": {
      // Sync comments only for specifically selected posts
      if (!config.selectedPostIds || config.selectedPostIds.length === 0) {
        throw new Error("selectedPostIds required for selection mode");
      }
      return db
        .select({
          id: posts.id,
          tiktokId: posts.tiktokId,
          videoUrl: posts.videoUrl,
          engagement: sql<number>`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`.as("engagement"),
        })
        .from(posts)
        .where(
          and(
            eq(posts.accountId, accountId),
            inArray(posts.tiktokId, config.selectedPostIds)
          )
        );
    }

    case "top_performers": {
      // Query top N posts by engagement
      const limit = config.topCount ?? 10;
      return db
        .select({
          id: posts.id,
          tiktokId: posts.tiktokId,
          videoUrl: posts.videoUrl,
          engagement: sql<number>`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`.as("engagement"),
        })
        .from(posts)
        .where(eq(posts.accountId, accountId))
        .orderBy(desc(sql`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`))
        .limit(limit);
    }

    case "date_range": {
      // Filter posts by date range
      if (!config.dateRange) {
        throw new Error("dateRange required for date_range mode");
      }
      return db
        .select({
          id: posts.id,
          tiktokId: posts.tiktokId,
          videoUrl: posts.videoUrl,
          engagement: sql<number>`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`.as("engagement"),
        })
        .from(posts)
        .where(
          and(
            eq(posts.accountId, accountId),
            gte(posts.postedAt, config.dateRange.start),
            lte(posts.postedAt, config.dateRange.end)
          )
        )
        .orderBy(desc(sql`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`))
        .limit(100); // Default reasonable limit for date range queries
    }

    case "budget": {
      // Calculate how many comments fit in the credit budget
      if (!config.creditBudget || config.creditBudget <= 0) {
        throw new Error("creditBudget required for budget mode");
      }

      const commentsPerPost = config.maxPerPost ?? 100;

      // Calculate how many posts we can afford
      // Cost per post = (commentsPerPost / 100) * CREDITS.COMMENTS_PER_100 + CREDITS.ACTOR_START_FEE
      const costPerPost = Math.ceil(commentsPerPost / 100) * CREDITS.COMMENTS_PER_100 + CREDITS.ACTOR_START_FEE;
      const maxPosts = Math.floor(config.creditBudget / costPerPost);

      if (maxPosts <= 0) {
        throw new Error("Credit budget too low for any comment syncs");
      }

      // Prioritize high-engagement posts
      return db
        .select({
          id: posts.id,
          tiktokId: posts.tiktokId,
          videoUrl: posts.videoUrl,
          engagement: sql<number>`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`.as("engagement"),
        })
        .from(posts)
        .where(eq(posts.accountId, accountId))
        .orderBy(desc(sql`(${posts.likes} + ${posts.comments} + ${posts.shares} + ${posts.saves})`))
        .limit(maxPosts);
    }

    default:
      throw new Error(`Unknown comment sync mode: ${(config as CommentSyncConfig).mode}`);
  }
}

/**
 * Poll the status of an Apify run
 */
export async function pollSyncStatus(runId: string): Promise<SyncStatus> {
  const client = getApifyClient();

  try {
    const run = await client.run(runId).get();

    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    return {
      status: run.status as SyncStatus["status"],
      startedAt: run.startedAt ? new Date(run.startedAt) : undefined,
      finishedAt: run.finishedAt ? new Date(run.finishedAt) : undefined,
      exitCode: run.exitCode,
      defaultDatasetId: run.defaultDatasetId,
      statsItemCount: run.stats?.inputBodyLen,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error polling status";
    throw new Error(`Failed to poll sync status: ${message}`);
  }
}

/**
 * Process the results of a completed sync job
 */
export async function processSyncResults(jobId: number, runId: string): Promise<ProcessedSyncResults> {
  const client = getApifyClient();

  // Get the sync job
  const [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
  if (!job) {
    throw new Error(`Sync job ${jobId} not found`);
  }

  try {
    // Get the run details to get dataset ID
    const run = await client.run(runId).get();
    if (!run || !run.defaultDatasetId) {
      throw new Error("Could not retrieve run dataset");
    }

    // Fetch all items from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error("No data returned from sync");
    }

    const typedItems = items as unknown as TikTokPostData[];

    // Extract profile data from the first result
    const firstResult = typedItems[0];
    const authorMeta = firstResult?.authorMeta;

    let profileUpdated = false;

    if (authorMeta) {
      // Update the TikTok account with latest profile data
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

      // Record metrics snapshot
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

    // Process posts
    let postsCount = 0;
    let commentsCount = 0;

    for (const item of typedItems) {
      if (!item.id) continue;

      // Upsert the post
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.tiktokId, item.id))
        .limit(1);

      if (existingPost.length > 0) {
        // Update existing post
        await db
          .update(posts)
          .set({
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
          })
          .where(eq(posts.tiktokId, item.id));
      } else {
        // Insert new post
        await db.insert(posts).values({
          accountId: job.accountId,
          tiktokId: item.id,
          description: item.text || "",
          likes: item.diggCount || 0,
          comments: item.commentCount || 0,
          shares: item.shareCount || 0,
          plays: item.playCount || 0,
          saves: item.collectCount || 0,
          duration: item.videoMeta?.duration || 0,
          thumbnailUrl: item.videoMeta?.coverUrl || "",
          videoUrl: item.webVideoUrl || "",
          postedAt: item.createTimeISO ? new Date(item.createTimeISO) : undefined,
        });
      }
      postsCount++;

      // Process comments if available (from a separate comments dataset if included)
      // Note: Comments come in a different structure from Apify
      const itemWithComments = item as TikTokPostData & { comments?: TikTokCommentData[] };
      if (itemWithComments.comments && Array.isArray(itemWithComments.comments)) {
        // Get the post ID
        const [postRecord] = await db
          .select()
          .from(posts)
          .where(eq(posts.tiktokId, item.id));

        if (postRecord) {
          for (const comment of itemWithComments.comments) {
            if (!comment.cid) continue;

            // Check if comment already exists
            const existingComment = await db
              .select()
              .from(comments)
              .where(eq(comments.tiktokId, comment.cid))
              .limit(1);

            if (existingComment.length === 0) {
              await db.insert(comments).values({
                postId: postRecord.id,
                tiktokId: comment.cid,
                text: comment.text || "",
                authorUsername: comment.user?.uniqueId || "",
                authorAvatarUrl: comment.user?.avatarThumb || "",
                likes: comment.diggCount || 0,
                postedAt: comment.createTime ? new Date(comment.createTime * 1000) : undefined,
              });
              commentsCount++;
            }
          }
        }
      }
    }

    // Calculate actual credits used
    const actualCredits = calculateActualCredits(postsCount, commentsCount);

    // Update sync job with results
    await db
      .update(syncJobs)
      .set({
        status: "completed",
        postsCount,
        commentsCount,
        creditsUsed: actualCredits,
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, jobId));

    // Deduct credits from user balance
    await deductCredits(
      job.userId,
      actualCredits,
      commentsCount > 0 ? "sync_comments" : "sync_posts",
      `Synced ${postsCount} posts${commentsCount > 0 ? ` and ${commentsCount} comments` : ""} for TikTok account`
    );

    return {
      postsCount,
      commentsCount,
      creditsUsed: actualCredits,
      profileUpdated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error processing results";

    // Update job status to failed
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
 * Calculate actual credits used based on results
 */
function calculateActualCredits(postsCount: number, commentsCount: number): number {
  // Base profile cost
  let credits = CREDITS.PROFILE_SYNC_BASE;

  // Add cost for posts
  credits += Math.ceil(postsCount / 50) * CREDITS.POSTS_PER_50;

  // Add cost for comments
  if (commentsCount > 0) {
    credits += Math.ceil(commentsCount / 100) * CREDITS.COMMENTS_PER_100;
  }

  return credits;
}

/**
 * Record sync completion and finalize the job
 */
export async function recordSyncCompletion(
  jobId: number,
  actualCredits: number
): Promise<void> {
  const [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));

  if (!job) {
    throw new Error(`Sync job ${jobId} not found`);
  }

  // Update the job with final credits if different from estimated
  if (job.creditsUsed !== actualCredits) {
    await db
      .update(syncJobs)
      .set({
        creditsUsed: actualCredits,
      })
      .where(eq(syncJobs.id, jobId));
  }
}

/**
 * Get the status of a sync job by ID
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
    apifyStatus = await pollSyncStatus(job.apifyRunId);

    // If Apify run is complete, process the results and update job status
    if (apifyStatus.status === "SUCCEEDED") {
      try {
        await processSyncResults(jobId, job.apifyRunId);
        // Refresh job from database after processing
        [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
      } catch (error) {
        console.error("Error processing sync results:", error);
        // processSyncResults already updates job status to failed on error
        [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
      }
    } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(apifyStatus.status)) {
      // Update job as failed
      await db
        .update(syncJobs)
        .set({
          status: "failed",
          error: `Apify run ${apifyStatus.status.toLowerCase()}`,
          completedAt: new Date(),
        })
        .where(eq(syncJobs.id, jobId));
      // Refresh job from database
      [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, jobId));
    }
  }

  return { job, apifyStatus };
}

/**
 * Handle a webhook callback from Apify when a run completes
 */
export async function handleSyncWebhook(
  runId: string,
  status: "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED-OUT"
): Promise<void> {
  // Find the sync job by run ID
  const [job] = await db.select().from(syncJobs).where(eq(syncJobs.apifyRunId, runId));

  if (!job) {
    console.error(`No sync job found for run ID: ${runId}`);
    return;
  }

  if (status === "SUCCEEDED") {
    // Process the results
    await processSyncResults(job.id, runId);
  } else {
    // Update job as failed
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        error: `Apify run ${status.toLowerCase()}`,
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, job.id));
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
    // Abort the Apify run
    await client.run(job.apifyRunId).abort();

    // Update job status
    await db
      .update(syncJobs)
      .set({
        status: "failed",
        error: "Cancelled by user",
        completedAt: new Date(),
      })
      .where(eq(syncJobs.id, jobId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error cancelling job";
    throw new Error(`Failed to cancel sync job: ${message}`);
  }
}

/**
 * Get recent sync jobs for an account
 */
export async function getRecentSyncJobs(accountId: number, limit = 10) {
  return db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.accountId, accountId))
    .orderBy(syncJobs.createdAt)
    .limit(limit);
}
