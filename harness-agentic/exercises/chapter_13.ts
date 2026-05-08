/**
 * Chapter 13 — RAG — Retrieval-Augmented Generation
 *
 * Run: tsx exercises/chapter_13.ts
 *
 * Note: Exercises 1–3 use in-memory storage (no Supabase needed).
 * Exercises 4–5 require SUPABASE_URL and SUPABASE_ANON_KEY in .env
 * (and the pgvector table/function from section 13.6 to be created).
 */

import { embed, embedMany, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const BALANCED        = "anthropic/claude-3-5-sonnet";

// =============================================================================
// MOCK CATALOGUE (no DB required for first exercises)
// =============================================================================

const CATALOGUE = [
  { id: "P001", content: "XR-200 Door Handle (DH-XR200) — $49.99 — In Stock — Compatible: XR-200, XR-210", category: "handles" },
  { id: "P002", content: "Hinge Set XR-200 (HS-XR200) — $29.99 — In Stock — Compatible: XR-200. Note: XR-210 requires adaptor AP-200.", category: "hinges" },
  { id: "P003", content: "Door Seal Kit (DSK-001) — $19.99 — Out of Stock — Compatible: XR-200, XR-300", category: "seals" },
  { id: "P004", content: "Adaptor Plate AP-200 — $9.99 — In Stock — Required when fitting HS-XR200 hinges to XR-210 doors.", category: "accessories" },
  { id: "P005", content: "XR-300 Complete Hinge Assembly (HA-XR300) — $59.99 — In Stock — Compatible: XR-300 only. Not compatible with XR-200 series.", category: "hinges" },
];

// =============================================================================
// EXERCISE 1 — Generate embeddings
// =============================================================================
//
// TODO: Implement `embedTexts(texts)` that calls embedMany with the embedding model
//       and returns the array of embeddings (each is number[]).

async function embedTexts(texts: string[]): Promise<number[][]> {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 2 — Cosine similarity + in-memory retrieval
// =============================================================================
//
// TODO: Implement `cosineSimilarity(a, b)` that computes the cosine similarity
//       between two vectors. Returns a number between -1 and 1.
//       Formula: dot(a,b) / (|a| * |b|)

function cosineSimilarity(a: number[], b: number[]): number {
  // TODO
  return 0;
}

// TODO: Implement `buildInMemoryIndex(docs)` that:
//   - Embeds all document contents using embedTexts()
//   - Returns an array of { id, content, category, embedding } objects

interface IndexedDoc {
  id:        string;
  content:   string;
  category:  string;
  embedding: number[];
}

async function buildInMemoryIndex(
  docs: typeof CATALOGUE
): Promise<IndexedDoc[]> {
  // TODO
  return [];
}

// TODO: Implement `searchIndex(index, query, topK, minSimilarity)` that:
//   - Embeds the query text
//   - Computes cosine similarity against all indexed docs
//   - Returns the top-K results with similarity >= minSimilarity
//   - Sorted by similarity descending
//   - Returns { doc: IndexedDoc, similarity: number }[]

async function searchIndex(
  index:         IndexedDoc[],
  query:         string,
  topK:          number = 3,
  minSimilarity: number = 0.5
): Promise<Array<{ doc: IndexedDoc; similarity: number }>> {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 3 — RAG pipeline (in-memory)
// =============================================================================
//
// TODO: Implement `ragQuery(index, question)` that:
//   1. Retrieves top-3 relevant chunks (min similarity 0.5)
//   2. If no results found, returns a "no information" message
//   3. Builds a context string from the retrieved docs
//   4. Calls generateText (BALANCED model, maxTokens: 300) with the context + question
//   5. Returns { answer: string, sources: Array<{id: string, similarity: number}> }

async function ragQuery(
  index: IndexedDoc[],
  question: string
): Promise<{ answer: string; sources: Array<{ id: string; similarity: number }> }> {
  // TODO
  return { answer: "", sources: [] };
}

// =============================================================================
// EXERCISE 4 — Chunking
// =============================================================================
//
// TODO: Implement `chunkText(text, chunkSize, overlap)` that:
//   - Splits text into word-based chunks of `chunkSize` words
//   - Each chunk overlaps the previous by `overlap` words
//   - Returns string[]

function chunkText(
  text:      string,
  chunkSize: number = 100,
  overlap:   number = 20
): string[] {
  // TODO
  return [text];
}

// =============================================================================
// EXERCISE 5 — Catalogue ingestion script (full pipeline)
// =============================================================================
//
// TODO: Implement `ingestAndQuery(docs, question)` that uses ONLY in-memory
//       storage (no Supabase) to:
//   1. Build the index from docs
//   2. Run ragQuery with the given question
//   3. Return the result
//   This simulates the full ingest → retrieve → generate pipeline.

async function ingestAndQuery(
  docs: typeof CATALOGUE,
  question: string
): Promise<{ answer: string; sources: Array<{ id: string; similarity: number }> }> {
  // TODO
  return { answer: "", sources: [] };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("Building in-memory catalogue index...");
  const index = await buildInMemoryIndex(CATALOGUE);
  console.log(`Indexed ${index.length} products\n`);

  const questions = [
    "Can I use XR-200 hinges on my XR-210 door?",
    "What's the cheapest spare part available?",
    "Do you have anything compatible with the XR-300?",
    "What do I need to install the hinge set on an XR-210?",
  ];

  for (const q of questions) {
    console.log(`${"─".repeat(60)}`);
    console.log(`Q: ${q}`);
    const { answer, sources } = await ragQuery(index, q);
    console.log(`A: ${answer.trim()}`);
    console.log(`Sources: ${sources.map(s => `${s.id}(${s.similarity.toFixed(2)})`).join(", ")}`);
    console.log();
  }

  // Exercise 4 — chunking
  const longDoc = "The XR-200 appliance series requires specific spare parts. ".repeat(5) + "Contact support for custom orders.";
  const chunks = chunkText(longDoc, 20, 5);
  console.log(`\nChunking test: ${chunks.length} chunks from ${longDoc.split(" ").length}-word doc`);
  console.assert(chunks.length > 1, "Exercise 4: should produce more than 1 chunk");
}

main().catch(console.error);
