import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment Analysis — Not a Bot",
  description:
    "AI-powered sentiment analysis and theme detection across your TikTok comments.",
};

export default function CommentsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <Badge variant="secondary">
          <MessageSquare className="size-3" />
          Comment Analysis
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Comment Analysis
        </h1>
        <p className="text-lg text-muted-foreground">
          Understand what your audience is saying with AI-powered comment
          analysis. Automatically categorize sentiment and surface key themes
          across thousands of comments.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">
            AI-Powered Sentiment Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Every comment is analyzed for positive, negative, or neutral
            sentiment using advanced AI models. Track sentiment trends over time
            to understand how your audience reacts to different types of content.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Theme Detection</h2>
          <p className="text-sm text-muted-foreground">
            The AI groups related comments together and identifies recurring
            themes, questions, and feedback patterns. Use these insights to guide
            your content strategy and engage with your community more
            effectively.
          </p>
        </div>
      </div>
    </div>
  );
}
