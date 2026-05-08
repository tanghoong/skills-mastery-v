# Chapter 26 — The Hybrid Architecture: TypeScript Agents + Laravel API

## Learning Objectives

By the end of this chapter you will be able to:
- Design a production system where a TypeScript agent service and a Laravel API coexist
- Define the right boundaries: which logic lives in each layer
- Pass authenticated requests between Laravel and the TypeScript agent service
- Synchronise session state across both services
- Build a deployment-ready topology with health checks, rate limiting, and observability on both sides

---

## 26.1 Why a Hybrid Architecture?

Most production teams have existing Laravel applications and want to add AI agents without rewriting their backend. The hybrid pattern solves this:

| Concern | Where it lives | Why |
|---------|---------------|-----|
| Business logic, database, auth | Laravel | Mature ORM, migration system, auth packages |
| AI agent loops, tool execution | TypeScript (Node.js) | Vercel AI SDK, streaming, async/await |
| Session storage, job queues | Laravel (Redis) | Existing infrastructure |
| Security, rate limiting | Laravel API gateway | Single enforced entry point |
| Observability traces | TypeScript service → Langfuse | Richer AI metadata |

---

## 26.2 Topology

```
┌────────────────────────────────────────────────────────┐
│  Client (Browser / Mobile)                             │
└───────────────────────┬────────────────────────────────┘
                        │  HTTPS
                        ▼
┌────────────────────────────────────────────────────────┐
│  Laravel API Gateway                                   │
│  ├─ JWT authentication (Sanctum)                       │
│  ├─ Rate limiting (throttle:20,1)                      │
│  ├─ Input validation (ValidateLlmInput middleware)     │
│  ├─ Session load/save (Redis)                          │
│  └─ POST /api/chat → forward to Agent Service          │
└───────────────────────┬────────────────────────────────┘
                        │  Internal HTTP (mTLS or shared secret)
                        ▼
┌────────────────────────────────────────────────────────┐
│  TypeScript Agent Service (Node.js / Express)          │
│  ├─ Receives { message, sessionId, customerId }        │
│  ├─ classifyIntents → routeToSubAgents (parallel)      │
│  ├─ RAG, tool execution, escalation logic              │
│  ├─ CostTracker, Tracer → Langfuse                     │
│  └─ Returns { reply, traceId, costUSD }                │
└───────────────────────┬────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
     OpenRouter API           Supabase/pgvector
     (LLM calls)              (RAG embeddings)
```

---

## 26.3 Laravel → TypeScript Communication

### Laravel side — forwarding the request

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

class AgentGateway
{
    private const AGENT_URL    = 'http://agent-service:3000';
    private const AGENT_SECRET = ''; // filled from env

    public function __construct()
    {
        self::AGENT_SECRET = config('services.agent.secret');
    }

    public function chat(string $message, string $sessionId, string $customerId): array
    {
        $response = Http::withHeaders([
            'X-Agent-Secret' => config('services.agent.secret'),
            'Content-Type'   => 'application/json',
        ])
        ->timeout(30)
        ->post(self::AGENT_URL . '/internal/chat', [
            'message'    => $message,
            'session_id' => $sessionId,
            'customer_id' => $customerId,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('Agent service error: ' . $response->status());
        }

        return $response->json();
    }
}
```

### TypeScript side — internal endpoint with secret validation

```typescript
// Express route — internal only, validated by shared secret
app.post("/internal/chat", (req, res, next) => {
  const secret = req.headers["x-agent-secret"];
  if (secret !== process.env.AGENT_INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}, async (req, res) => {
  const { message, session_id, customer_id } = req.body;
  const result = await handleCustomerMessage(message, session_id, customer_id);
  res.json(result);
});
```

---

## 26.4 Shared Session State

Session history is stored in Redis and read by both services:

```typescript
// TypeScript — Redis session adapter
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });

async function loadSession(sessionId: string): Promise<ChatMessage[]> {
  const raw = await redis.get(`agent_session:${sessionId}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveSession(sessionId: string, history: ChatMessage[]): Promise<void> {
  const trimmed = history.slice(-20); // keep last 20 messages
  await redis.setEx(`agent_session:${sessionId}`, 7200, JSON.stringify(trimmed));
}
```

```php
// Laravel — reading the same session key
public function loadSession(string $sessionId): array
{
    $raw = Redis::get("agent_session:{$sessionId}");
    return $raw ? json_decode($raw, true) : [];
}
```

---

## 26.5 Streaming Across the Boundary

For streaming responses, the TypeScript service uses SSE, and Laravel acts as a transparent proxy:

```php
// Laravel — stream proxy
public function streamChat(Request $request): StreamedResponse
{
    $payload = $request->only(['message', 'session_id', 'customer_id']);

    return response()->stream(function () use ($payload) {
        $client   = new \GuzzleHttp\Client();
        $response = $client->post(config('services.agent.url') . '/internal/stream', [
            'json'    => $payload,
            'headers' => ['X-Agent-Secret' => config('services.agent.secret')],
            'stream'  => true,
        ]);

        $body = $response->getBody();
        while (!$body->eof()) {
            echo $body->read(1024);
            ob_flush();
            flush();
        }
    }, 200, [
        'Content-Type'  => 'text/event-stream',
        'Cache-Control' => 'no-cache',
    ]);
}
```

---

## 26.6 Health Checks

Both services expose health endpoints:

```typescript
// TypeScript
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "agent", timestamp: new Date().toISOString() });
});
```

```php
// Laravel
Route::get('/health', fn () => response()->json([
    'status'    => 'ok',
    'service'   => 'laravel-api',
    'timestamp' => now()->toISOString(),
]));
```

Laravel also pings the agent service health during its own check:

```php
public function check(): JsonResponse
{
    $agentOk = false;
    try {
        $res     = Http::timeout(3)->get(config('services.agent.url') . '/health');
        $agentOk = $res->ok();
    } catch (\Throwable) {}

    return response()->json([
        'status'        => $agentOk ? 'ok' : 'degraded',
        'agent_service' => $agentOk ? 'ok' : 'unreachable',
    ], $agentOk ? 200 : 503);
}
```

---

## 26.7 Deployment Topology (Docker Compose)

```yaml
# docker-compose.yml (development)
services:
  laravel:
    build: ./laravel
    ports: ["8000:8000"]
    environment:
      AGENT_SERVICE_URL: http://agent:3000
      AGENT_INTERNAL_SECRET: ${AGENT_INTERNAL_SECRET}
      REDIS_URL: redis://redis:6379
    depends_on: [redis, agent]

  agent:
    build: ./agent
    environment:
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      AGENT_INTERNAL_SECRET: ${AGENT_INTERNAL_SECRET}
      REDIS_URL: redis://redis:6379
      LANGFUSE_SECRET_KEY: ${LANGFUSE_SECRET_KEY}
    depends_on: [redis]

  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]

volumes:
  redis_data:
```

---

## 26.8 The Full Request Lifecycle

```
1.  Client      →  POST /api/chat (JWT)
2.  Laravel     →  authenticateJWT + validateLlmInput + throttle
3.  Laravel     →  loadSession(sessionId) from Redis
4.  Laravel     →  POST http://agent:3000/internal/chat (shared secret)
5.  Agent       →  validateInput → classifyIntents → routeToSubAgents
6.  Agent       →  [parallel] orderAgent + catalogueAgent
7.  Agent       →  mergeResponses → validateOutput
8.  Agent       →  saveSession(sessionId) to Redis
9.  Agent       →  emit trace to Langfuse
10. Agent       →  return { reply, traceId, costUSD }
11. Laravel     →  return reply to client
12. Laravel     →  log { traceId, customerId, costUSD } to DB
```

---

## 26.9 Security at Each Boundary

| Boundary | Mechanism |
|----------|----------|
| Client → Laravel | JWT (Sanctum), HTTPS |
| Laravel → Agent | Shared secret header, internal network only |
| Agent → OpenRouter | API key (env var), never in prompts |
| Agent → Redis | Auth via Redis password (env var) |
| Agent → Langfuse | Secret key (env var) |
| Agent → Supabase | Service role key (env var) |

---

## Chapter Summary

| Component | Role |
|-----------|------|
| Laravel | Auth, rate limiting, input validation, routing, DB, job queues |
| TypeScript Agent | LLM calls, tool execution, RAG, multi-agent orchestration, tracing |
| Redis | Shared session state between both services |
| OpenRouter | Unified LLM gateway (cost visibility + model routing) |
| Langfuse | Agent observability (traces, costs, evaluation) |

The hybrid architecture lets you ship AI agents quickly without rewriting your existing Laravel backend, while keeping the AI-specific complexity in a purpose-built TypeScript service.

---

> **Course complete.** You have built and understood every layer of a production-grade AI agent platform — from the first `generateText` call in Chapter 1 to a fully deployed, authenticated, observable, cost-controlled hybrid architecture in Chapter 26.

---

*End of Harness Agentic Course*
