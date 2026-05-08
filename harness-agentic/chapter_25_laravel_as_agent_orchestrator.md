# Chapter 25 — Laravel as Agent Orchestrator

## Learning Objectives

By the end of this chapter you will be able to:
- Implement a ReAct-style agent loop in PHP/Laravel
- Define and dispatch tools from a Laravel service layer
- Build a multi-step agent that calls tools across multiple iterations
- Handle tool errors gracefully with retry logic in PHP
- Persist agent state between requests using Laravel queues and cache

---

## 25.1 The ReAct Loop in PHP

The same observe → think → act pattern from Chapter 5 applies in PHP:

```php
<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;

class AgentLoop
{
    private const MAX_STEPS = 6;

    public function run(string $message, array $tools): string
    {
        $messages = [
            ['role' => 'system',  'content' => $this->systemPrompt(array_keys($tools))],
            ['role' => 'user',    'content' => $message],
        ];

        for ($step = 0; $step < self::MAX_STEPS; $step++) {
            $response = OpenAI::chat()->create([
                'model'      => AriaService::FAST,
                'messages'   => $messages,
                'tools'      => $this->formatTools($tools),
                'max_tokens' => 500,
            ]);

            $choice = $response->choices[0];

            // Terminal: model replied with text
            if ($choice->finishReason === 'stop') {
                return $choice->message->content;
            }

            // Tool call step
            if ($choice->finishReason === 'tool_calls') {
                $messages[] = ['role' => 'assistant', 'content' => null,
                               'tool_calls' => $choice->message->toolCalls];

                foreach ($choice->message->toolCalls as $toolCall) {
                    $result = $this->executeToolCall($toolCall, $tools);
                    $messages[] = [
                        'role'         => 'tool',
                        'tool_call_id' => $toolCall->id,
                        'content'      => json_encode($result),
                    ];
                }
            }
        }

        return "I've reached the maximum number of steps. Please try a simpler request.";
    }

    private function executeToolCall(object $toolCall, array $tools): mixed
    {
        $name = $toolCall->function->name;
        $args = json_decode($toolCall->function->arguments, true);

        if (!array_key_exists($name, $tools)) {
            return ['error' => "Tool not found: {$name}"];
        }

        try {
            return $tools[$name]($args);
        } catch (\Throwable $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private function formatTools(array $tools): array { /* ... */ }
    private function systemPrompt(array $toolNames): string { /* ... */ }
}
```

---

## 25.2 Defining Tools in PHP

A tool is a callable with a JSON Schema description:

```php
<?php

namespace App\Agent\Tools;

class OrderTools
{
    public static function definitions(): array
    {
        return [
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'lookup_order',
                    'description' => 'Look up an order by its ID',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'order_id' => [
                                'type'        => 'string',
                                'description' => 'The order identifier, e.g. A8812',
                            ],
                        ],
                        'required'   => ['order_id'],
                    ],
                ],
            ],
        ];
    }

    public static function callables(): array
    {
        return [
            'lookup_order' => function (array $args): array {
                $orderId  = preg_replace('/[^A-Z0-9\-]/i', '', $args['order_id'] ?? '');
                if (strlen($orderId) < 2) {
                    return ['error' => 'Invalid order ID'];
                }
                // Real implementation: DB query
                return [
                    'id'     => $orderId,
                    'status' => 'shipped',
                    'eta'    => '2 business days',
                ];
            },
        ];
    }
}
```

---

## 25.3 Background Agent Jobs with Laravel Queues

For long-running agent tasks, use a queued job:

```php
<?php

namespace App\Jobs;

use App\Services\AgentLoop;
use App\Agent\Tools\OrderTools;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Cache;

class RunAgentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;

    public function __construct(
        private readonly string $jobId,
        private readonly string $message,
    ) {}

    public function handle(AgentLoop $loop): void
    {
        Cache::put("agent_job_{$this->jobId}_status", 'running', now()->addMinutes(5));

        try {
            $tools  = array_merge(
                OrderTools::callables(),
                // ... more tool sets
            );
            $result = $loop->run($this->message, $tools);

            Cache::put("agent_job_{$this->jobId}_result", $result,    now()->addMinutes(10));
            Cache::put("agent_job_{$this->jobId}_status", 'complete', now()->addMinutes(10));
        } catch (\Throwable $e) {
            Cache::put("agent_job_{$this->jobId}_status", 'failed',   now()->addMinutes(5));
            Cache::put("agent_job_{$this->jobId}_error",  $e->getMessage(), now()->addMinutes(5));
        }
    }
}
```

Dispatch and poll:

```php
// Dispatch
$jobId = Str::uuid()->toString();
RunAgentJob::dispatch($jobId, $message);
return response()->json(['job_id' => $jobId]);

// Poll endpoint
Route::get('/agent/jobs/{jobId}', function (string $jobId) {
    $status = Cache::get("agent_job_{$jobId}_status", 'pending');
    $result = Cache::get("agent_job_{$jobId}_result");
    return response()->json(compact('status', 'result'));
});
```

---

## 25.4 Multi-Agent Orchestration (Parallel HTTP Calls)

PHP does not have native async/await, but you can use Guzzle concurrent requests:

```php
<?php

use GuzzleHttp\Client;
use GuzzleHttp\Promise\Utils;

class ParallelSubAgents
{
    public function __construct(private Client $http) {}

    public function dispatch(array $agentTasks): array
    {
        $promises = [];
        foreach ($agentTasks as $name => $task) {
            $promises[$name] = $this->http->postAsync('/api/agent', [
                'json' => ['message' => $task],
                'headers' => ['Authorization' => 'Bearer ' . config('services.aria.key')],
            ]);
        }

        $results = Utils::settle($promises)->wait();

        $replies = [];
        foreach ($results as $name => $result) {
            if ($result['state'] === 'fulfilled') {
                $body = json_decode($result['value']->getBody(), true);
                $replies[$name] = $body['reply'] ?? '';
            } else {
                $replies[$name] = '[Agent failed]';
            }
        }

        return $replies;
    }
}
```

---

## 25.5 Cost Tracking in PHP

```php
<?php

namespace App\Services;

class CostTracker
{
    private array $entries = [];

    private const PRICING = [
        'anthropic/claude-3-haiku'    => ['input' => 0.25,  'output' => 1.25 ],
        'anthropic/claude-3-5-sonnet' => ['input' => 3.00,  'output' => 15.00],
    ];

    public function record(string $model, int $inputTokens, int $outputTokens, string $label = ''): float
    {
        $price  = self::PRICING[$model] ?? ['input' => 0, 'output' => 0];
        $costUsd = ($inputTokens  / 1_000_000 * $price['input'])
                 + ($outputTokens / 1_000_000 * $price['output']);

        $this->entries[] = compact('model', 'inputTokens', 'outputTokens', 'costUsd', 'label');
        return $costUsd;
    }

    public function total(): float
    {
        return array_sum(array_column($this->entries, 'costUsd'));
    }

    public function entries(): array
    {
        return $this->entries;
    }
}
```

---

## 25.6 Error Handling and Retries

```php
function withRetry(callable $fn, int $maxAttempts = 3, int $baseDelayMs = 500): mixed
{
    $attempt = 0;
    while (true) {
        try {
            return $fn();
        } catch (\OpenAI\Exceptions\TransientErrorException $e) {
            $attempt++;
            if ($attempt >= $maxAttempts) throw $e;
            $jitter  = random_int(0, 200);
            $delayMs = $baseDelayMs * (2 ** ($attempt - 1)) + $jitter;
            usleep($delayMs * 1000);
        }
    }
}

// Usage
$result = withRetry(fn() => OpenAI::chat()->create([...]), maxAttempts: 3);
```

---

## 25.7 Session State for Multi-Turn Agents

```php
// Store full agent state (messages + metadata) in Redis-backed cache
class AgentSession
{
    public function load(string $sessionId): array
    {
        return Cache::get("agent_session_{$sessionId}", [
            'messages'   => [],
            'cost_total' => 0.0,
            'turn_count' => 0,
        ]);
    }

    public function save(string $sessionId, array $state): void
    {
        Cache::put("agent_session_{$sessionId}", $state, now()->addHours(2));
    }
}
```

---

## Chapter Summary

| Concept | PHP/Laravel approach |
|---------|---------------------|
| ReAct loop | `AgentLoop::run()` with `for` loop + `finish_reason` check |
| Tool definitions | PHP associative array with JSON Schema + callable |
| Tool execution | `executeToolCall()` — dispatch by name, catch errors |
| Async agents | Guzzle `postAsync` + `Utils::settle` |
| Background jobs | `RunAgentJob implements ShouldQueue` |
| State persistence | `Cache::put/get` (Redis-backed) |
| Cost tracking | `CostTracker::record()` after each API call |
| Retries | `withRetry()` with exponential backoff + jitter |

---

*Next: Chapter 26 — The Hybrid Architecture (TypeScript Agents + Laravel API)*
