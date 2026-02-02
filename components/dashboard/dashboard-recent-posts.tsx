'use client';

import * as React from 'react';
import Image from 'next/image';
import { FileVideo, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RecentPost {
  id: number;
  tiktokId: string;
  description: string | null;
  thumbnailUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
  saves: number;
  postedAt: string | null;
  engagementRate: number;
}

interface DashboardRecentPostsProps {
  data: {
    posts: RecentPost[];
    total: number;
  } | null;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return `${Math.floor(diffDays / 365)} years ago`;
}

function truncateText(text: string | null, maxLength: number = 50): string {
  if (!text) return 'No description';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

function TableSkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileVideo className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium text-muted-foreground">
        No posts found
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Your recent posts will appear here once data is available.
      </p>
    </div>
  );
}

function RecentPostRow({ post }: { post: RecentPost }) {
  const [imageError, setImageError] = React.useState(false);
  const showFallback = !post.thumbnailUrl || imageError;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {showFallback ? (
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={post.thumbnailUrl!}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded object-cover"
              unoptimized
              onError={() => setImageError(true)}
            />
          )}
          <span
            className="max-w-[200px] truncate text-sm"
            title={post.description || undefined}
          >
            {truncateText(post.description)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatNumber(post.plays)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatNumber(post.likes)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatNumber(post.comments)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatNumber(post.shares)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatRelativeDate(post.postedAt)}
      </TableCell>
      <TableCell>
        <span className="font-medium">
          {post.engagementRate.toFixed(2)}%
        </span>
      </TableCell>
    </TableRow>
  );
}

export function DashboardRecentPosts({
  data,
  isLoading = false,
}: DashboardRecentPostsProps) {
  const hasData = data && data.posts && data.posts.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Plays</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeletonRows rows={5} />
            </TableBody>
          </Table>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Plays</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.posts.map((post) => (
                <RecentPostRow key={post.id} post={post} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
