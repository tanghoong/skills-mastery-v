# Chapter 47 — High-Performance PHP & Capstone

> **Goal:** Understand how Swoole, RoadRunner, and FrankenPHP break PHP's request-per-process model to deliver Node.js-level concurrency; then survey the NoteFlow capstone architecture you have built towards throughout this course.

## 47.1 The Problem with Traditional PHP

The classical PHP model is stateless by design: Nginx or Apache forks a new PHP-FPM worker per request, that worker loads your application, handles the request, and exits. This is simple and safe — memory leaks die with the process — but it has a ceiling. Under high concurrency, every request pays the boot tax (class autoloading, DI container construction, database connection setup) and I/O operations block the entire worker.

Three runtimes attack this problem differently.

## 47.2 Swoole — Coroutines in PHP

Swoole is a C extension that adds event-loop-based I/O, coroutines, and persistent in-memory state directly to PHP:

```php
<?php
declare(strict_types=1);

use Swoole\Coroutine;
use Swoole\Http\Server;
use Swoole\Http\Request;
use Swoole\Http\Response;

$server = new Server('0.0.0.0', 9501);

$server->on('request', function (Request $request, Response $response): void {
    // Each request runs in its own coroutine — non-blocking I/O
    $result = Coroutine\run(function (): array {
        // These run concurrently within the same coroutine context
        $userData = Coroutine::create(fn() => fetchUserFromDb());
        $feedData = Coroutine::create(fn() => fetchFeedFromRedis());
        return [$userData, $feedData];
    });

    $response->header('Content-Type', 'application/json');
    $response->end(json_encode($result));
});

$server->start();
```

Swoole coroutines are cooperative: when a coroutine hits an I/O call (database, HTTP, Redis), it yields the event loop to another coroutine. This is identical to Node.js's event loop model. A single Swoole process can handle thousands of concurrent connections.

The trade-off: your application is now stateful. Global state, singletons, and static properties persist across requests. You must be deliberate about resetting state per-request (connection pools, request-scoped services).

## 47.3 RoadRunner — Persistent PHP Workers

RoadRunner is a Go-based application server. It starts PHP workers once and keeps them alive, passing requests to them over a Unix socket. Your PHP code runs inside a long-lived process:

```php
<?php
declare(strict_types=1);

use Spiral\RoadRunner\Worker;
use Spiral\RoadRunner\Http\PSR7Worker;
use Nyholm\Psr7\Factory\Psr17Factory;

$worker  = Worker::create();
$factory = new Psr17Factory();
$psr7    = new PSR7Worker($worker, $factory, $factory, $factory);

// The event loop — worker stays alive between requests
while ($request = $psr7->waitRequest()) {
    try {
        $response = $factory->createResponse(200);
        $response->getBody()->write('Hello from RoadRunner');
        $psr7->respond($response);
    } catch (\Throwable $e) {
        $psr7->getWorker()->error((string) $e);
    }
}
```

Because the worker is persistent, DI container construction and class autoloading happen once on startup. Response times drop dramatically. RoadRunner works with standard PSR-7, so you can drop it in under Slim or Symfony with minimal changes.

RoadRunner also has plugins for queues (like Temporal workflows), gRPC, key-value, and WebSocket — making it a general PHP application server, not just an HTTP runtime.

## 47.4 FrankenPHP — PHP Inside Caddy

FrankenPHP embeds PHP directly into the Caddy web server as a module. It combines the web server, PHP runtime, TLS termination, HTTP/2, HTTP/3, and worker mode in a single binary:

```dockerfile
FROM dunglas/frankenphp

COPY . /app

# Worker mode: PHP boots once, Caddy dispatches requests
ENV FRANKENPHP_CONFIG="worker /app/public/index.php"
```

FrankenPHP supports Early Hints (103), Mercure (server-sent events), and Vulcain (resource hints) out of the box. Its worker mode gives persistent worker performance without the operational complexity of RoadRunner's separate Go binary. For greenfield projects that want a single Docker image with everything included, FrankenPHP is compelling.

## 47.5 NoteFlow Capstone — Architecture Overview

NoteFlow is a PHP 8.4 note-taking API that you have been building towards throughout this course. It is not implemented here in full — you will build it as your portfolio project — but this chapter provides the architecture map.

### Domain

A user creates, tags, and searches notes. Notes can be exported to Markdown or HTML. Webhooks notify external services on note creation.

### Component Map

```
NoteFlow/
├── src/
│   ├── Application/
│   │   ├── Command/           # CLI commands (Ch. 34, Ch. 45 Console)
│   │   └── Http/
│   │       ├── Kernel.php     # PSR-15 middleware pipeline (Ch. 46)
│   │       └── Controllers/   # thin PSR-7 handlers
│   ├── Domain/
│   │   ├── Note.php           # entity with readonly properties (Ch. 11)
│   │   ├── NoteId.php         # branded type (Ch. 15-style pattern)
│   │   ├── Tag.php            # value object
│   │   └── Events/
│   │       └── NoteCreated.php # domain event (Ch. 24 Observer)
│   ├── Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── PdoNoteRepository.php   # implements NoteRepository (Ch. 29)
│   │   │   └── NoteRepository.php      # interface (Ch. 10)
│   │   ├── Cache/
│   │   │   └── RedisNoteCache.php      # cache-aside (Ch. 41)
│   │   ├── Queue/
│   │   │   └── WebhookDispatcher.php   # async webhook delivery
│   │   └── Template/
│   │       └── TwigRenderer.php        # Twig integration (Ch. 43)
│   └── Shared/
│       ├── Result.php         # Result<T, E> pattern (Ch. 14)
│       ├── Container.php      # PSR-11 DI container (Ch. 15)
│       └── EventDispatcher.php # (Ch. 24, Ch. 45)
├── templates/                 # Twig templates
├── tests/                     # PHPUnit test suite
├── public/
│   └── index.php              # front controller
├── Dockerfile                 # multi-stage build (Ch. 42)
└── composer.json
```

### Chapter Coverage Map

| Component | Primary Chapters |
|---|---|
| `Note` entity, readonly props | 8, 11 |
| `NoteRepository` interface | 10 |
| `PdoNoteRepository` | 13 (PDO), 29 (SQL) |
| `Result<T, E>` | 7 (errors), 14 |
| `EventDispatcher` | 24 |
| `TwigRenderer` | 43 |
| `RedisNoteCache` | 41 |
| PSR-15 Kernel / middleware | 46 |
| CLI commands | 34, 45 |
| Dockerfile / php.ini | 42 |
| PHPUnit tests | 31 (if covered) |

## Key Takeaways

- Swoole, RoadRunner, and FrankenPHP all eliminate the per-request boot cost; they differ in runtime model (coroutines vs. persistent workers vs. embedded server).
- Swoole is most powerful but requires coroutine-safe code; RoadRunner is the most ecosystem-compatible; FrankenPHP is the simplest to deploy.
- NoteFlow demonstrates that every pattern from this course — interfaces, traits, Result type, DI container, PDO, caching, templates, middleware, CLI, Docker — works together in a real application.
- High-performance PHP is no longer niche: Swoole and RoadRunner are used in production at scale by companies processing millions of requests per day.

## Congratulations — you have completed the PHP Mastery course.

You have covered 47 chapters spanning language fundamentals, object-oriented design, functional patterns, database access, HTTP, CLI tooling, testing, deployment, caching, templating, and the full landscape of PHP frameworks and runtimes. The NoteFlow capstone is yours to build — take what you have learned and ship it.
