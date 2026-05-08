# Chapter 13 — RAG — Retrieval-Augmented Generation

## Learning Objectives

By the end of this chapter you will be able to:
- Explain why RAG is needed and what problems it solves
- Generate embeddings for documents using an embedding model
- Store and query embeddings with Supabase pgvector
- Build a full RAG pipeline: ingest → retrieve → augment → generate
- Apply RAG to the product catalogue and knowledge base use cases

---

## 13.1 Why RAG?

LLMs have fixed training data. They do not know about:
- Your product catalogue (items, prices, compatibility)
- Your company's support knowledge base
- Events after the training cutoff

RAG solves this by:
1. **Ingesting** your documents into a vector store at ingest time
2. **Retrieving** the most relevant chunks at query time
3. **Augmenting** the LLM prompt with those chunks
4. **Generating** an answer grounded in your actual data

```
Query: "Does XR-200 hinge set fit the XR-210?"
         ↓
  Embed query → search vector store → retrieve top-3 relevant product docs
         ↓
  Augment prompt: "Using the following catalogue data: [retrieved docs] — answer the question"
         ↓
  LLM generates a grounded, accurate answer
```

---

## 13.2 Embeddings — What They Are

An embedding is a dense vector (array of ~1000–3000 numbers) that represents the semantic meaning of text. Texts with similar meaning have vectors that are close together in vector space.

```typescript
import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Single embedding
const { embedding } = await embed({
  model: openrouter.embedding("openai/text-embedding-3-small"),
  value: "XR-200 door hinge replacement set",
});
console.log(embedding.length);  // 1536 dimensions

// Multiple embeddings (more efficient)
const { embeddings } = await embedMany({
  model: openrouter.embedding("openai/text-embedding-3-small"),
  values: [
    "XR-200 door hinge replacement set",
    "Spare parts for XR-200 appliance",
    "How to replace a door hinge",
  ],
});
```

---

## 13.3 Embedding Models

| Model | Dimensions | Cost per 1M tokens | Notes |
|-------|-----------|-------------------|-------|
| `openai/text-embedding-3-small` | 1536 | $0.02 | Best price/quality ratio |
| `openai/text-embedding-3-large` | 3072 | $0.13 | Higher accuracy, 6× cost |
| `openai/text-embedding-ada-002` | 1536 | $0.10 | Legacy, use 3-small instead |

For most RAG use cases, `text-embedding-3-small` is the right choice — 90%+ of the accuracy of `3-large` at 15% of the cost.

---

## 13.4 Document Chunking

Before embedding, split large documents into chunks:

```typescript
interface DocumentChunk {
  id:       string;
  docId:    string;
  content:  string;
  metadata: Record<string, unknown>;
}

function chunkDocument(
  text: string,
  docId: string,
  chunkSize: number  = 500,
  overlap:   number  = 50,
): DocumentChunk[] {
  const words  = text.split(/\s+/);
  const chunks: DocumentChunk[] = [];
  let i = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push({
      id:       crypto.randomUUID(),
      docId,
      content:  chunkWords.join(" "),
      metadata: { startWord: i, endWord: i + chunkWords.length },
    });
    i += chunkSize - overlap;
  }

  return chunks;
}
```

**Overlap** ensures that relevant context at chunk boundaries isn't lost. 10% overlap (50 words for 500-word chunks) is a good starting point.

---

## 13.5 Ingestion Pipeline

```typescript
import { embedMany } from "ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function ingestDocuments(documents: Array<{ id: string; content: string; metadata: object }>): Promise<void> {
  for (const doc of documents) {
    const chunks = chunkDocument(doc.content, doc.id);

    // Embed all chunks in this document in one batch call
    const { embeddings } = await embedMany({
      model: openrouter.embedding("openai/text-embedding-3-small"),
      values: chunks.map(c => c.content),
    });

    // Store in Supabase with pgvector
    const rows = chunks.map((chunk, i) => ({
      id:        chunk.id,
      doc_id:    chunk.docId,
      content:   chunk.content,
      metadata:  { ...doc.metadata, ...chunk.metadata },
      embedding: embeddings[i],
    }));

    const { error } = await supabase.from("document_chunks").insert(rows);
    if (error) throw new Error(`Ingest failed: ${error.message}`);
  }
}
```

---

## 13.6 Supabase pgvector Setup

Create the table and similarity search function in Supabase:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chunks table
CREATE TABLE document_chunks (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id    TEXT NOT NULL,
  content   TEXT NOT NULL,
  metadata  JSONB DEFAULT '{}',
  embedding VECTOR(1536)   -- matches text-embedding-3-small dimensions
);

-- Create index for fast similarity search
CREATE INDEX ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536),
  match_count     INT DEFAULT 5,
  filter          JSONB DEFAULT '{}'
) RETURNS TABLE (
  id         UUID,
  doc_id     TEXT,
  content    TEXT,
  metadata   JSONB,
  similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.doc_id, c.content, c.metadata,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM document_chunks c
  WHERE c.metadata @> filter
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 13.7 Retrieval

```typescript
interface RetrievedChunk {
  id:         string;
  docId:      string;
  content:    string;
  metadata:   Record<string, unknown>;
  similarity: number;
}

async function retrieve(
  query: string,
  topK:  number = 5,
  filter: Record<string, unknown> = {}
): Promise<RetrievedChunk[]> {
  // Embed the query
  const { embedding } = await embed({
    model: openrouter.embedding("openai/text-embedding-3-small"),
    value: query,
  });

  // Search the vector store
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: topK,
    filter,
  });

  if (error) throw new Error(`Retrieval failed: ${error.message}`);
  return (data ?? []) as RetrievedChunk[];
}
```

---

## 13.8 Generation — Augmenting the Prompt

```typescript
async function ragQuery(
  question: string,
  filter: Record<string, unknown> = {}
): Promise<{ answer: string; sources: RetrievedChunk[] }> {
  // Retrieve relevant chunks
  const chunks = await retrieve(question, 5, filter);

  if (chunks.length === 0) {
    return {
      answer: "I couldn't find any relevant information to answer your question. Please contact support.",
      sources: [],
    };
  }

  // Filter by minimum similarity
  const relevant = chunks.filter(c => c.similarity >= 0.7);
  if (relevant.length === 0) {
    return { answer: "I don't have specific information about that in our knowledge base.", sources: [] };
  }

  // Build augmented context
  const context = relevant
    .map((c, i) => `[Source ${i + 1}] ${c.content}`)
    .join("\n\n");

  // Generate grounded answer
  const { text } = await generateText({
    model: openrouter(MODELS.balanced),
    system: `You are Aria, Acme Corp customer service AI.
Answer questions using ONLY the provided catalogue/knowledge base excerpts.
If the answer is not in the excerpts, say so honestly.
Do not make up information.`,
    prompt: `Context:\n${context}\n\nQuestion: ${question}`,
    maxTokens: 400,
  });

  return { answer: text, sources: relevant };
}
```

---

## 13.9 Product Catalogue RAG

Applying RAG to the product catalogue use case:

```typescript
const CATALOGUE_DOCS = [
  {
    id: "prod-xr200-hinge",
    content: `XR-200 Hinge Set (Part No: HS-XR200)
Compatible models: XR-200, XR-210 (NOT compatible with XR-300)
Price: $29.99 | In Stock
Installation: Requires Phillips screwdriver. See installation guide for torque specs.
Note: XR-210 requires adaptor plate AP-200 (sold separately).`,
    metadata: { category: "spare_parts", model: "XR-200" },
  },
  // ... more products
];

// Ingest on startup (or via a separate ingest script)
await ingestDocuments(CATALOGUE_DOCS);

// Query at runtime
const result = await ragQuery(
  "Can I use XR-200 hinges on my XR-210 door?",
  { category: "spare_parts" }  // filter to spare parts only
);
```

---

## 13.10 Cost Awareness — RAG

RAG has two cost components:

| Component | Cost | Notes |
|-----------|------|-------|
| Embedding (ingest) | $0.02/1M tokens | One-time; re-run only when catalogue changes |
| Embedding (query) | $0.02/1M tokens | Every query, but queries are short (~50 tokens) |
| Generation (augmented) | Same as standard LLM | Context is larger (retrieval chunks added) |

For a 1,000-product catalogue (avg 200 tokens/product): ~$0.004 to embed the whole catalogue. Query embedding: ~$0.000001 per query. The dominant cost is generation.

**Optimisation:** Pre-warm the query embedding for common questions (e.g. most-searched products). Cache the embeddings and retrieved chunks for repeated identical queries.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Embedding | Dense vector representing semantic meaning |
| `embedMany` | Batch embed — more efficient than one-at-a-time |
| Chunking | Split large docs; use overlap to avoid boundary blindness |
| pgvector | Supabase extension for vector similarity search |
| Retrieval | Embed query, find top-K similar chunks |
| Augmentation | Inject retrieved chunks into the prompt as context |
| Similarity threshold | Filter out low-relevance chunks (< 0.7) |
| Ingest cost | Cheap one-time; dominant cost is generation |

---

> **Python Sidebar**
>
> LlamaIndex is the dominant Python RAG framework:
> ```python
> from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
> documents = SimpleDirectoryReader("catalogue/").load_data()
> index = VectorStoreIndex.from_documents(documents)
> query_engine = index.as_query_engine()
> response = query_engine.query("Do XR-200 hinges fit the XR-210?")
> ```
> LlamaIndex handles chunking, embedding, storage, and retrieval automatically. The TypeScript implementation above gives you full control over each step.

---

*Next: Chapter 14 — Code Execution Agents*
