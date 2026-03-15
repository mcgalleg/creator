CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "comments" ADD COLUMN "sentiment" text;
ALTER TABLE "comments" ADD COLUMN "sentiment_category" text;
ALTER TABLE "comments" ADD COLUMN "sentiment_score" real;
ALTER TABLE "comments" ADD COLUMN "text_embedding" vector(256);

CREATE INDEX "comments_sentiment_idx" ON "comments" ("sentiment");
CREATE INDEX "comments_sentiment_category_idx" ON "comments" ("sentiment_category");

-- HNSW index for cosine similarity search
CREATE INDEX "comments_embedding_idx" ON "comments"
  USING hnsw ("text_embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
