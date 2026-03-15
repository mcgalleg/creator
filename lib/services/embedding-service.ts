import { embed, embedMany, gateway } from "ai";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "google/gemini-embedding-001";

function getModel() {
  return gateway.embeddingModel(EMBEDDING_MODEL);
}

/**
 * Generate 256-dimensional embeddings for a batch of texts.
 * Uses the Vercel AI Gateway — configure model via EMBEDDING_MODEL env var.
 * Default: google/text-embedding-004 (768d, truncated to 256d via providerOptions).
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const model = getModel();
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: {
      google: { outputDimensionality: 256 },
      openai: { dimensions: 256 },
    },
  });
  return embeddings;
}

/**
 * Generate a single embedding for a search query.
 */
export async function generateQueryEmbedding(
  query: string
): Promise<number[]> {
  const model = getModel();
  const { embedding } = await embed({
    model,
    value: query,
    providerOptions: {
      google: { outputDimensionality: 256 },
      openai: { dimensions: 256 },
    },
  });
  return embedding;
}
