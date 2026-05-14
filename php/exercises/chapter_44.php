<?php
declare(strict_types=1);
/**
 * Chapter 44 — Laravel (High-Level Tour)
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_44.php
 *
 * No Laravel installed — we build stubs that mirror Laravel's API shape.
 * Goal: understand the "feel" of Laravel, not to run a real app.
 */

// ── TODO 1: Laravel-style Route facade and response() helper ─────────────────
// Implement stub versions of:
//   Route::get(string $path, callable $handler): void
//   Route::post(string $path, callable $handler): void
//   response()->json(mixed $data, int $status = 200): JsonResponse
// Demonstrate registering routes and "dispatching" a fake GET /users request.

echo "── TODO 1: Route facade + response() stub ──────────────────────────────\n";

final class JsonResponse
{
    public function __construct(
        public readonly mixed $data,
        public readonly int   $status = 200,
    ) {}

    public function send(): void
    {
        printf("[%d] %s\n", $this->status, json_encode($this->data, JSON_PRETTY_PRINT));
    }
}

final class ResponseFactory
{
    public function json(mixed $data, int $status = 200): JsonResponse
    {
        return new JsonResponse($data, $status);
    }
}

function response(): ResponseFactory
{
    return new ResponseFactory();
}

final class Route
{
    /** @var array<string, array<string, callable>> */
    private static array $routes = [];

    public static function get(string $path, callable $handler): void
    {
        self::$routes['GET'][$path] = $handler;
    }

    public static function post(string $path, callable $handler): void
    {
        self::$routes['POST'][$path] = $handler;
    }

    public static function dispatch(string $method, string $path): void
    {
        $handler = self::$routes[$method][$path] ?? null;
        if ($handler === null) {
            printf("[404] No route for %s %s\n", $method, $path);
            return;
        }
        $result = $handler();
        if ($result instanceof JsonResponse) {
            $result->send();
        }
    }
}

// Register routes
Route::get('/ping', fn() => response()->json(['pong' => true]));

Route::get('/users', fn() => response()->json([
    ['id' => 1, 'name' => 'Alice', 'role' => 'admin'],
    ['id' => 2, 'name' => 'Bob',   'role' => 'user'],
]));

Route::post('/users', fn() => response()->json(['id' => 3, 'created' => true], status: 201));

// Simulate dispatch
Route::dispatch('GET', '/ping');
Route::dispatch('GET', '/users');
Route::dispatch('POST', '/users');
Route::dispatch('GET', '/missing');   // 404

// ── TODO 2: Eloquent-style model with method chaining ────────────────────────
// Stub User::where('active', true)->orderBy('name')->get()
// Implement a fluent query builder (no DB needed — use a static array as the "table").
// Support: where(string $col, mixed $val), orderBy(string $col), get(): array, first(): mixed

echo "\n── TODO 2: Eloquent-style model stub ───────────────────────────────────\n";

final class QueryBuilder
{
    /** @var array<int, array<string, mixed>> */
    private array $records;

    /** @var array<int, array{col: string, val: mixed}> */
    private array $wheres = [];

    private ?string $orderByCol = null;

    /**
     * @param array<int, array<string, mixed>> $records
     */
    public function __construct(array $records)
    {
        $this->records = $records;
    }

    public function where(string $col, mixed $val): static
    {
        $this->wheres[] = ['col' => $col, 'val' => $val];
        return $this;
    }

    public function orderBy(string $col): static
    {
        $this->orderByCol = $col;
        return $this;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function get(): array
    {
        $results = $this->records;

        foreach ($this->wheres as $where) {
            $results = array_values(array_filter(
                $results,
                fn(array $row): bool => ($row[$where['col']] ?? null) === $where['val'],
            ));
        }

        if ($this->orderByCol !== null) {
            $col = $this->orderByCol;
            usort($results, fn(array $a, array $b): int => ($a[$col] ?? '') <=> ($b[$col] ?? ''));
        }

        return $results;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function first(): ?array
    {
        $results = $this->get();
        return $results[0] ?? null;
    }
}

final class User
{
    /** @var array<int, array<string, mixed>> */
    private static array $table = [
        ['id' => 1, 'name' => 'Carol', 'active' => true,  'role' => 'admin'],
        ['id' => 2, 'name' => 'Alice', 'active' => true,  'role' => 'user'],
        ['id' => 3, 'name' => 'Bob',   'active' => false, 'role' => 'user'],
        ['id' => 4, 'name' => 'Dave',  'active' => true,  'role' => 'user'],
    ];

    public static function where(string $col, mixed $val): QueryBuilder
    {
        return (new QueryBuilder(self::$table))->where($col, $val);
    }

    public static function all(): QueryBuilder
    {
        return new QueryBuilder(self::$table);
    }
}

$activeUsers = User::where('active', true)->orderBy('name')->get();
printf("Active users (%d):\n", count($activeUsers));
foreach ($activeUsers as $u) {
    printf("  #%d %-8s [%s]\n", $u['id'], $u['name'], $u['role']);
}

$firstAdmin = User::where('active', true)->where('role', 'admin')->first();
printf("First admin: %s\n", $firstAdmin['name'] ?? 'none');

// ── TODO 3: Blade-style template as heredoc ───────────────────────────────────
// Show a Blade template as a PHP heredoc string — don't execute it as PHP.
// Include: @extends, @section, @forelse/@empty/@endforelse, {{ }}, {!! !!}
// Print it to stdout and add inline comments noting differences from Twig.

echo "\n── TODO 3: Blade template (heredoc) ────────────────────────────────────\n";

$bladeTemplate = <<<'BLADE'
{{-- resources/views/users/index.blade.php --}}
{{-- Blade: comments use {{-- --}} not {# #} like Twig --}}

@extends('layouts.app')

{{-- @section replaces Twig's {% block %} --}}
@section('title', 'User List')

@section('content')
    <h1>Users</h1>

    {{-- @forelse = for + empty in one directive; Twig uses {% for %}...{% else %} --}}
    @forelse($users as $user)
        <div class="user">
            {{-- {{ }} auto-escapes — same as Twig --}}
            <strong>{{ $user->name }}</strong>
            <span>{{ $user->email }}</span>

            @if($user->role === 'admin')
                {{-- {!! !!} = Twig's |raw filter — outputs unescaped HTML --}}
                {!! '<span class="badge">Admin</span>' !!}
            @endif
        </div>
    @empty
        <p>No users found.</p>
    @endforelse

    {{ $users->links() }}  {{-- Blade: pagination links built in --}}
@endsection

{{-- KEY DIFFERENCES FROM TWIG:
     Blade        | Twig
     @extends     | {% extends %}
     @section     | {% block %}
     @yield       | {{ block('name') }}
     @forelse     | {% for %}...{% else %}
     @if / @endif | {% if %} / {% endif %}
     {{ }}        | {{ }}          (both auto-escape)
     {!! !!}      | {{ value|raw }}
     {{-- --}}    | {# #}
     @include     | {% include %}
     @component   | {% embed %}
--}}
BLADE;

echo $bladeTemplate . "\n";

// ── TODO 4: Artisan::call stub ────────────────────────────────────────────────
// Write a stub Artisan class with a static call(string $command): void method.
// Log the command name to stdout as if running it.
// In a comment below, explain what Artisan::call('migrate') actually does in Laravel.

echo "\n── TODO 4: Artisan stub ─────────────────────────────────────────────────\n";

final class Artisan
{
    public static function call(string $command, string ...$args): void
    {
        $argStr = $args !== [] ? ' ' . implode(' ', $args) : '';
        printf("[Artisan] Running: php artisan %s%s\n", $command, $argStr);

        // In a real app, this would resolve the command from the IoC container,
        // instantiate it, and call its handle() method via the ConsoleKernel.
    }
}

Artisan::call('migrate');
Artisan::call('queue:work', '--queue=default,mail', '--timeout=60');
Artisan::call('cache:clear');

/*
 * What Artisan::call('migrate') does in real Laravel:
 * ────────────────────────────────────────────────────
 * 1. Resolves 'MigrateCommand' from the IoC container.
 * 2. Reads all *.php files from database/migrations/ in chronological order.
 * 3. Checks the 'migrations' table in the database to see which have already run.
 * 4. Runs the up() method of each pending migration inside a transaction.
 * 5. Records each successful migration in the 'migrations' table with its batch number.
 * 6. Rolls back the transaction on failure — no partial migrations.
 *
 * You can also call Artisan commands programmatically in tests or seeders:
 *   Artisan::call('db:seed', ['--class' => 'UserSeeder']);
 */

echo "Artisan::call explanation in comment above.\n";

// ── TODO 5: When to choose Laravel vs scratch ─────────────────────────────────
// In a comment block, describe 3 scenarios where you'd pick Laravel
// and 3 scenarios where you'd build from scratch (or use a microframework).

/*
 * ── When to choose Laravel ──────────────────────────────────────────────────
 *
 * 1. Full-product web app with auth, user management, email, and an admin panel.
 *    Laravel provides all of this out of the box (Sanctum, Breeze, Nova/Filament).
 *    Building it from scratch would take weeks before writing business logic.
 *
 * 2. Small team, rapid iteration, tight deadline.
 *    Laravel conventions mean every developer knows where to put things — routes,
 *    controllers, models, jobs. Onboarding a new engineer is fast.
 *
 * 3. Long-lived SaaS product that will grow.
 *    Laravel's ecosystem (queues, broadcasting, Horizon, Telescope, Octane)
 *    covers every growth stage without requiring architectural rewrites.
 *
 * ── When to build from scratch / use a microframework ───────────────────────
 *
 * 1. A single-purpose microservice (e.g., PDF generator, image resizer).
 *    You only need routing and HTTP — Slim adds ~5 ms boot time vs Laravel's ~150 ms.
 *    No need for an ORM, queues, or session management.
 *
 * 2. Embedding PHP in an existing architecture where you control the stack.
 *    Legacy monolith with its own conventions — you add a Slim app as a new service
 *    rather than fighting Laravel's opinionated structure against the existing code.
 *
 * 3. Learning or prototyping a specific pattern.
 *    Building your own DI container, router, or ORM from scratch as a learning
 *    exercise is far more educational than using Laravel's magic.
 *    (Exactly what this course has been doing!)
 */

echo "Laravel vs scratch: reasoning documented in comment block above.\n";
