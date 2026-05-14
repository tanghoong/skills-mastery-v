<?php
declare(strict_types=1);
/**
 * Chapter 47 — High-Performance PHP & Capstone
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_47.php
 */

// ── TODO 1: Swoole coroutine model — stub + explanation ───────────────────────
// Describe Swoole's coroutine model in a comment block.
// Then write a stub Coroutine::create(callable $fn) that simulates cooperative
// scheduling using a simple round-robin queue of callables (no real coroutines).
// Run 3 "coroutines" that each print a step, demonstrating interleaving.

echo "── TODO 1: Swoole coroutine simulation ─────────────────────────────────\n";

/*
 * ── Swoole Coroutine Model ──────────────────────────────────────────────────
 *
 * Traditional PHP-FPM model:
 *   One OS thread per request. If the request waits for a DB query (10 ms),
 *   the thread is blocked — it cannot serve another request during that time.
 *   Under high concurrency, all workers are sitting idle waiting for I/O.
 *
 * Swoole coroutine model:
 *   A single OS thread runs an event loop. Multiple coroutines are scheduled
 *   cooperatively on that loop. When a coroutine hits an I/O call (DB, HTTP,
 *   Redis), it YIELDS the event loop — another coroutine runs in its place.
 *   When the I/O completes, the original coroutine is RESUMED.
 *
 *   This is identical to Node.js async/await or Python asyncio.
 *   The key difference from PHP generators (Ch. 18) is that Swoole patches
 *   standard PHP I/O functions (PDO, cURL, file_get_contents) so they yield
 *   transparently — you write sequential-looking PHP and get async behaviour.
 *
 * Memory model concern:
 *   Because the PHP process is persistent (not killed after each request),
 *   class static properties, singletons, and global state persist across
 *   requests. You MUST reset per-request state explicitly.
 *   Swoole provides a request-scoped context via Swoole\Coroutine::getContext().
 *
 * When to use Swoole:
 *   - High-concurrency APIs where most time is spent in I/O (DB, Redis, HTTP).
 *   - Real-time features: WebSocket, Server-Sent Events.
 *   - You need Node.js-level throughput but want to stay in PHP.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * Stub that simulates cooperative scheduling using a simple task queue.
 * Real Swoole uses kernel-level context switching — this is a conceptual model.
 */
final class Coroutine
{
    /** @var list<\Generator> */
    private static array $queue = [];

    public static function create(callable $fn): void
    {
        // Wrap the callable in a generator so we can step through it
        self::$queue[] = (function () use ($fn): \Generator {
            yield from $fn();
        })();
    }

    public static function run(): void
    {
        // Round-robin: advance each coroutine one step at a time
        while (self::$queue !== []) {
            $remaining = [];
            foreach (self::$queue as $coro) {
                if ($coro->valid()) {
                    $coro->current(); // consume one yield
                    $coro->next();    // advance
                    if ($coro->valid()) {
                        $remaining[] = $coro;
                    }
                }
            }
            self::$queue = $remaining;
        }
    }
}

// Simulate 3 concurrent coroutines
Coroutine::create(function (): \Generator {
    echo "  [Coro A] step 1 — fetch user from DB\n";
    yield; // simulate I/O wait
    echo "  [Coro A] step 2 — user returned\n";
    yield;
    echo "  [Coro A] step 3 — done\n";
});

Coroutine::create(function (): \Generator {
    echo "  [Coro B] step 1 — fetch config from Redis\n";
    yield;
    echo "  [Coro B] step 2 — config returned\n";
    yield;
    echo "  [Coro B] step 3 — done\n";
});

Coroutine::create(function (): \Generator {
    echo "  [Coro C] step 1 — call external API\n";
    yield;
    echo "  [Coro C] step 2 — response received\n";
    yield;
    echo "  [Coro C] step 3 — done\n";
});

// Notice the interleaved output — each "step" advances all coroutines
Coroutine::run();

// ── TODO 2: NoteFlow architecture as a structured comment block ───────────────
// Write the NoteFlow capstone architecture as a structured comment block.
// List every class (or interface), its responsibility, and the design pattern it uses.

echo "\n── TODO 2: NoteFlow architecture ───────────────────────────────────────\n";

/*
 * ── NoteFlow Capstone — Full Architecture Map ────────────────────────────────
 *
 * NoteFlow is an AI-powered note-taking REST API built with PHP 8.4.
 *
 * Domain Layer (pure PHP, no framework dependencies)
 * ───────────────────────────────────────────────────
 * Note                  Entity. Holds id, title, body, tags, timestamps.
 *                       Pattern: Entity (DDD)
 *
 * NoteId                Branded integer type (int & {__brand: NoteId}).
 *                       Prevents mixing user IDs with note IDs.
 *                       Pattern: Value Object / Branded Type
 *
 * Tag                   Immutable value object wrapping a tag string.
 *                       Pattern: Value Object
 *
 * NoteRepository        Interface. Defines find/save/delete/search contract.
 *                       Pattern: Repository Interface (DDD)
 *
 * NoteCreatedEvent      Emitted after a note is persisted.
 *                       Pattern: Domain Event
 *
 * Application Layer
 * ───────────────────────────────────────────────────
 * CreateNoteCommand     Carries validated input for note creation.
 *                       Pattern: Command (CQRS)
 *
 * CreateNoteHandler     Orchestrates note creation: validate → save → emit event.
 *                       Returns Result<Note, ValidationError>.
 *                       Pattern: Command Handler, Result type
 *
 * SearchNotesQuery      Carries search criteria (keyword, tags, page).
 *                       Pattern: Query (CQRS)
 *
 * SearchNotesHandler    Reads from repository (cache-aside via RedisNoteCache).
 *                       Returns Result<NotePage, Error>.
 *                       Pattern: Query Handler, Cache-aside
 *
 * Infrastructure Layer
 * ───────────────────────────────────────────────────
 * PdoNoteRepository     Implements NoteRepository using PDO + SQL.
 *                       Pattern: Repository (concrete), Adapter
 *
 * RedisNoteCache        Wraps PdoNoteRepository with Redis cache-aside logic.
 *                       Pattern: Decorator, Cache-aside
 *
 * WebhookDispatcher     Sends HTTP POST to registered webhook URLs on NoteCreated.
 *                       Pattern: Observer / Event Listener
 *
 * TwigRenderer          Wraps Twig\Environment for rendering note export templates.
 *                       Pattern: Adapter, Facade
 *
 * SimpleContainer       PSR-11 DI container — binds interfaces to implementations.
 *                       Pattern: IoC Container
 *
 * EventDispatcher       addListener/dispatch — decouples domain events from handlers.
 *                       Pattern: Observer / Mediator
 *
 * HTTP Layer (Slim 4 / PSR-15)
 * ───────────────────────────────────────────────────
 * Kernel                PSR-15 middleware pipeline. Wires routing + middleware.
 *                       Pattern: Pipeline, Front Controller
 *
 * NoteController        Thin PSR-7 handler. Delegates to Application handlers.
 *                       Pattern: Controller
 *
 * AuthMiddleware        Validates Bearer token. Attaches user to request attributes.
 *                       Pattern: Middleware, Chain of Responsibility
 *
 * RateLimitMiddleware   Checks Redis for request count per IP per minute.
 *                       Pattern: Middleware, Token Bucket
 *
 * JsonErrorHandler      Catches exceptions, returns structured JSON error responses.
 *                       Pattern: Middleware, Error Handler
 *
 * Shared
 * ───────────────────────────────────────────────────
 * Result<T, E>          Union type for success/failure without exceptions.
 *                       Pattern: Result / Either monad
 *
 * ValidationError       Structured error with field-level messages.
 *                       Pattern: Value Object
 *
 * CLI
 * ───────────────────────────────────────────────────
 * ExportNotesCommand    Console command: exports notes to Markdown files via Twig.
 *                       Pattern: Command, Template Method (via Command base class)
 *
 * PruneOrphanTagsCommand Console command: deletes tags with no associated notes.
 *                        Pattern: Command
 * ──────────────────────────────────────────────────────────────────────────────
 */

echo "NoteFlow architecture documented in comment block above.\n";

// ── TODO 3: Chapter coverage mapping ─────────────────────────────────────────
// Create a $coverage array mapping each NoteFlow component to the chapters
// that taught the skills needed to build it.

echo "\n── TODO 3: Chapter coverage map ────────────────────────────────────────\n";

/** @var array<string, list<int>> $coverage */
$coverage = [
    'Note entity + readonly props'   => [8, 11],
    'NoteId branded type'            => [11, 15],
    'Tag value object'               => [8, 11],
    'NoteRepository interface'       => [10],
    'NoteCreatedEvent'               => [24],
    'CreateNoteCommand/Handler'      => [7, 14, 21],
    'SearchNotesQuery/Handler'       => [14, 21, 29],
    'PdoNoteRepository'              => [13, 28, 29],
    'RedisNoteCache'                 => [41],
    'WebhookDispatcher'              => [24, 45],
    'TwigRenderer'                   => [43],
    'SimpleContainer (PSR-11)'       => [15, 21],
    'EventDispatcher'                => [24, 45],
    'Kernel (PSR-15 pipeline)'       => [46],
    'NoteController (PSR-7)'         => [46],
    'AuthMiddleware'                 => [46],
    'RateLimitMiddleware'            => [41, 46],
    'JsonErrorHandler'               => [7, 46],
    'Result<T, E> type'              => [7, 14],
    'ValidationError'                => [7, 11],
    'ExportNotesCommand'             => [34, 45],
    'PruneOrphanTagsCommand'         => [29, 34],
    'Dockerfile / FPM config'        => [42],
    'php.ini hardening'              => [42],
    'Benchmarking / profiling'       => [41],
];

printf("%-38s %s\n", 'Component', 'Chapters');
printf("%s\n", str_repeat('-', 60));
foreach ($coverage as $component => $chapters) {
    printf("%-38s Ch. %s\n", $component, implode(', ', $chapters));
}

// ── TODO 4: Production hardening — $productionTodo ────────────────────────────
// Define a $productionTodo array of strings listing the 3 most important
// things to add if shipping NoteFlow to real users.
// Each entry should be: "Feature — why it matters"

echo "\n── TODO 4: Production todo list ────────────────────────────────────────\n";

$productionTodo = [
    'Auth hardening (JWT rotation + refresh token invalidation) — stolen access tokens '
    . 'are valid until expiry; refresh token blacklisting via Redis limits the damage window.',

    'Rate limiting per user + IP (Redis sliding window counter) — prevents brute-force '
    . 'on login, API scraping, and webhook spam without blocking legitimate traffic.',

    'Redis caching for search results with cache invalidation on write — search queries '
    . 'hit a full-text index on every request; caching frequent searches (hot tags, '
    . 'recent notes) reduces DB load by 80%+ under real traffic patterns.',
];

foreach ($productionTodo as $i => $item) {
    printf("%d. %s\n\n", $i + 1, wordwrap($item, 78, "\n   "));
}

// ── TODO 5: Skills summary — $skillsSummary ────────────────────────────────────
// Create a $skillsSummary array listing every major PHP skill covered in
// the 47-chapter course. Group by phase. Print it as a formatted list.

echo "\n── TODO 5: PHP Mastery skills summary ──────────────────────────────────\n";

/** @var array<string, list<string>> $skillsSummary */
$skillsSummary = [
    'Phase 1 — Language Fundamentals (Ch. 1–8)' => [
        'PHP 8.4 setup, CLI execution, strict_types',
        'Scalar types, type coercion, casting, type juggling rules',
        'Control flow: match, nullsafe operator, short-circuit evaluation',
        'Functions: named args, variadic args, first-class callables',
        'Arrays: associative, multidimensional, spread operator, array functions',
        'String manipulation: mb_ functions, heredoc, nowdoc, sprintf',
        'Error handling: try/catch/finally, custom exceptions, exception hierarchy',
        'Classes: visibility, constructor promotion, static, constants',
    ],

    'Phase 2 — OOP Deep Dive (Ch. 9–12)' => [
        'Inheritance, abstract classes, method overriding, parent::',
        'Interfaces: multiple implementation, type contracts',
        'Traits: conflict resolution, abstract traits, property requirements',
        'Constructor promotion, readonly properties, readonly classes',
        'Backed enums: cases(), from(), tryFrom(), methods on enums',
        'Magic methods: __get, __set, __call, __invoke, __toString, __clone',
    ],

    'Phase 3 — Advanced Patterns (Ch. 13–20)' => [
        'PDO: prepared statements, transactions, fetch modes',
        'Generics-via-docblocks, template pattern, covariance',
        'Result<T,E> pattern: eliminating exceptions from business logic',
        'Closures: binding, scope, use by value vs reference',
        'Functional PHP: array_map/filter/reduce, pure functions, immutability',
        'match expressions: exhaustiveness, no-fallthrough, complex conditions',
        'Fibers: suspend/resume, cooperative multitasking from userland',
        'Generators: yield, send(), lazy evaluation, memory-efficient pipelines',
    ],

    'Phase 4 — Design Principles (Ch. 21–24)' => [
        'SOLID: SRP, OCP, LSP, ISP, DIP — applied to PHP classes',
        'Creational patterns: Singleton, Factory, Builder, Prototype',
        'Structural patterns: Adapter, Decorator, Facade, Proxy, Composite',
        'Behavioural patterns: Observer, Strategy, Command, Iterator, Chain of Responsibility',
    ],

    'Phase 5 — Database (Ch. 28–30)' => [
        'SQL fundamentals: DDL (CREATE, ALTER, DROP), normalisation',
        'Advanced SQL: JOINs, subqueries, CTEs, window functions, EXPLAIN',
        'Database architecture: connection pooling, migrations, seeders, repository pattern',
    ],

    'Phase 6 — HTTP & APIs (Ch. 31–33)' => [
        'HTTP fundamentals: request/response cycle, methods, status codes, headers',
        'REST API design: resource naming, versioning, pagination, HATEOAS',
        'JSON API responses: serialisation, validation, error envelopes',
    ],

    'Phase 7 — CLI & Tooling (Ch. 34–40)' => [
        'CLI scripting: argv, stdin/stdout, exit codes, signal handling',
        'Composer: autoloading, version constraints, scripts, lock file',
        'Testing: PHPUnit, TDD, mocking, code coverage, data providers',
        'Static analysis: PHPStan, Psalm, type inference, generics annotations',
        'Security: SQL injection, XSS, CSRF, password hashing, input validation',
    ],

    'Phase 8 — Performance & Infrastructure (Ch. 41–42)' => [
        'OPcache: bytecode caching, JIT compiler, production configuration',
        'APCu: in-process cache, TTL, cache warming strategies',
        'Redis: cache-aside pattern, SETEX, pub/sub, connection pools',
        'Benchmarking: microtime(), memory_get_peak_usage(), Xdebug profiler',
        'Generators vs arrays: memory footprint, lazy evaluation trade-offs',
        'PHP-FPM: pool configuration, pm strategies, slow log',
        'Nginx + PHP-FPM: fastcgi_pass, front controller, security headers',
        'Docker: multi-stage builds, Alpine images, health checks',
        'Environment management: phpdotenv, required variable validation',
        'Production php.ini: expose_php, display_errors, session hardening',
    ],

    'Phase 9 — Twig (Ch. 43)' => [
        'Template inheritance: extends, block, parent()',
        'Control structures: for (with loop variable), if/elseif/else',
        'Filters: pipe syntax, built-in filters, custom filter registration',
        'Macros: reusable template functions, import syntax',
        'Auto-escaping: default XSS protection, |raw for trusted HTML',
        'include vs embed: partials vs slotted components',
    ],

    'Phase 10 — PHP Frameworks (Ch. 44–47)' => [
        'Laravel: routing, Eloquent ORM, Blade templates, Artisan, queues, Sanctum',
        'Symfony: DI container, HttpFoundation, Doctrine, Console, EventDispatcher, Security',
        'Slim 4: PSR-7 request/response, PSR-15 middleware, route groups',
        'Lumen: Laravel-compatible microservice scaffolding, startup performance',
        'Swoole: event loop, coroutines, persistent process model',
        'RoadRunner: Go-based persistent workers, PSR-7 integration',
        'FrankenPHP: embedded PHP in Caddy, worker mode, single binary deployment',
        'NoteFlow capstone: end-to-end application of every phase',
    ],
];

foreach ($skillsSummary as $phase => $skills) {
    printf("\n%s\n", $phase);
    printf("%s\n", str_repeat('─', strlen($phase)));
    foreach ($skills as $skill) {
        printf("  - %s\n", $skill);
    }
}

$totalSkills = array_sum(array_map('count', $skillsSummary));
printf("\nTotal skills catalogued: %d across 10 phases\n", $totalSkills);

echo "\n══════════════════════════════════════════════════════════════════════════\n";
echo "Congratulations — you have completed the PHP Mastery course.\n";
echo "47 chapters. 10 phases. One language, mastered.\n";
echo "══════════════════════════════════════════════════════════════════════════\n";
