import { generateObject, gateway } from "ai";
import { z } from "zod";

const classificationSchema = z.object({
  results: z.array(z.object({
    id: z.number(),
    sentiment: z.enum(["supportive", "neutral", "unsupportive"]),
    category: z.enum([
      "praise", "encouragement", "question", "feature_request",
      "sarcasm", "spam", "negative_experience", "form_safety", "general",
    ]),
    score: z.number().min(0).max(1),
  })),
});

export type ClassificationResult = z.infer<typeof classificationSchema>["results"][number];

const CLASSIFICATION_PROMPT = `Classify each TikTok comment's sentiment toward the content creator.
Return a JSON object with a "results" array containing one entry per comment.

sentiment: "supportive" | "neutral" | "unsupportive"
  - "supportive" = positive toward the creator (praise, encouragement, excitement)
  - "neutral" = neither positive nor negative (questions, factual observations, general chat)
  - "unsupportive" = negative toward the creator (criticism, sarcasm, complaints)

category:
  - "praise" = compliments, appreciation, admiration
  - "encouragement" = motivational, supportive suggestions
  - "question" = asking something (about content, techniques, products, etc.)
  - "feature_request" = suggesting the creator make specific content
  - "sarcasm" = ironic or mocking comments
  - "spam" = promotional, irrelevant, or bot-like comments
  - "negative_experience" = sharing a bad experience or complaint
  - "form_safety" = concerning content (threats, harassment, etc.)
  - "general" = doesn't fit other categories (reactions, emoji-only, etc.)

score: confidence 0.0–1.0

For emoji-only comments, classify as "neutral" / "general" unless the emoji clearly conveys sentiment.
For empty or unintelligible text, classify as "neutral" / "general" with low confidence.`;

/**
 * Batch classify comments using Claude Haiku via generateObject().
 * Accepts up to 200 comments per batch.
 */
export async function classifyComments(
  comments: { id: number; text: string }[]
): Promise<ClassificationResult[]> {
  if (comments.length === 0) return [];

  const model = gateway("anthropic/claude-haiku-4-5");

  const { object } = await generateObject({
    model,
    schema: classificationSchema,
    prompt: `${CLASSIFICATION_PROMPT}\n\nComments:\n${JSON.stringify(
      comments.map((c) => ({ id: c.id, text: c.text }))
    )}`,
  });

  return object.results;
}
