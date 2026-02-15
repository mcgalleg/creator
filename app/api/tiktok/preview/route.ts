import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { validateUsername, estimateSyncCost, estimateCommentSyncCost } from "@/lib/services/sync-service";

// Simple in-memory cache for preview results
// In production, consider using Redis or a proper caching solution
const previewCache = new Map<string, { data: PreviewResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PreviewResponse {
  profile: {
    username: string;
    displayName: string;
    avatarUrl: string;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
    bio: string;
    isVerified: boolean;
    bioUrl?: string;
    profileCategory?: string;
  };
  costEstimates: {
    profileOnly: number;
    profilePosts: number;
    profilePostsComments: number;
  };
}

/**
 * GET /api/tiktok/preview?username=creator
 * Fetches a TikTok profile preview without creating an account.
 * Returns profile data and cost estimates for different import options.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username query parameter is required" },
        { status: 400 }
      );
    }

    // Clean the username (remove @ if present)
    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Invalid username" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = previewCache.get(cleanUsername);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Validate and fetch profile data
    const validation = await validateUsername(cleanUsername);

    if (!validation.valid || !validation.profile) {
      return NextResponse.json(
        { error: validation.error || "Username not found on TikTok" },
        { status: 404 }
      );
    }

    // Calculate cost estimates for different import options
    const profile = validation.profile;

    // Profile only: FREE - just stores reference, no additional Apify call needed
    // (validateUsername already fetched the profile data)
    const profileOnlyCost = 0;

    // Profile + Posts: Use estimateSyncCost for 50 posts
    const profilePostsEstimate = estimateSyncCost({
      postsLimit: 50,
      includeComments: false,
    });

    // Profile + Posts + Comments: Posts cost + estimated comment cost
    // Estimate ~50 comments per post average, cap at 100 per post
    const estimatedCommentsPerPost = 100;
    const estimatedTotalComments = Math.min(profile.videoCount, 50) * estimatedCommentsPerPost;

    const postsEstimate = estimateSyncCost({
      postsLimit: 50,
      includeComments: false,
    });

    const commentsEstimate = estimateCommentSyncCost({
      postCount: Math.min(profile.videoCount, 50),
      commentsPerPost: estimatedCommentsPerPost,
      totalComments: estimatedTotalComments,
    });

    const profilePostsCommentsCost = postsEstimate.credits + commentsEstimate.credits;

    const response: PreviewResponse = {
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        likesCount: profile.likesCount,
        videoCount: profile.videoCount,
        bio: profile.bio,
        isVerified: profile.isVerified,
        bioUrl: profile.bioUrl,
        profileCategory: profile.profileCategory,
      },
      costEstimates: {
        profileOnly: profileOnlyCost,
        profilePosts: profilePostsEstimate.credits,
        profilePostsComments: profilePostsCommentsCost,
      },
    };

    // Cache the result
    previewCache.set(cleanUsername, { data: response, timestamp: Date.now() });

    // Clean up old cache entries periodically
    if (previewCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of previewCache) {
        if (now - value.timestamp > CACHE_TTL) {
          previewCache.delete(key);
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching TikTok preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile preview" },
      { status: 500 }
    );
  }
}
