import { Gift, TrendingUp, TrendingDown } from "lucide-react";

export interface CreditTransaction {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

export const TRANSACTION_TYPE_MAP: Record<string, string> = {
  sync_posts: "Posts Sync",
  sync_comments: "Comments Sync",
  purchase: "Purchase",
  credit_pack_purchase: "Credit Pack",
  ai_token_pack_purchase: "AI Token Pack",
  refund: "Refund",
  signup_bonus: "Signup Bonus",
  ai_chat: "AI Chat",
  subscription_renewal: "Subscription Renewal",
};

export const TRANSACTION_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "sync_posts", label: "Posts Sync" },
  { value: "sync_comments", label: "Comments Sync" },
  { value: "ai_chat", label: "AI Chat" },
  { value: "purchase", label: "Purchases" },
  { value: "credit_pack_purchase", label: "Credit Packs" },
  { value: "ai_token_pack_purchase", label: "AI Token Packs" },
  { value: "refund", label: "Refunds" },
  { value: "subscription_renewal", label: "Subscription Renewal" },
  { value: "signup_bonus", label: "Signup Bonus" },
] as const;

export function formatTransactionType(type: string): string {
  return TRANSACTION_TYPE_MAP[type] || type;
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getTransactionIcon(type: string, amount: number) {
  if (type === "signup_bonus" || type === "refund") {
    return { icon: Gift, className: "h-4 w-4 text-green-500" };
  }
  if (amount > 0) {
    return { icon: TrendingUp, className: "h-4 w-4 text-green-500" };
  }
  return { icon: TrendingDown, className: "h-4 w-4 text-red-500" };
}
