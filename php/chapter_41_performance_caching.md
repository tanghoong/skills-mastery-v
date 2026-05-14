# Chapter 41 — Performance & Caching

> **Goal:** Understand how PHP caches bytecode and data, how to measure real performance costs, and how to implement cache-aside with APCu or Redis.

## 41.1 OPcache — Bytecode Caching

Every time PHP runs a script without OPcache it parses the source, compiles it to opcodes, executes, and discards the result. OPcache stores the compiled opcodes in shared memory so subsequent requests skip parse and compile entirely.

```ini
; /etc/php/8.4/fpm/conf.d/10-opcache.ini
opcache.enable=1
opcache.enable_cli=0            ; disable on CLI to avoid cache poisoning during deploys
opcache.memory_consumption=256  ; MB of shared memory
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0   ; production: reload only on restart
opcache.revalidate_freq=0
opcache.fast_shutdown=1
opcache.jit=tracing             ; PHP 8.x JIT — enables native code compilation
opcache.jit_buffer_size=100M
```

Set `validate_timestamps=0` in production and trigger an FPM graceful reload (`kill -USR2 $(cat /run/php-fpm.pid)`) after every deploy. In development keep it at `1` so changes are visible immediately.

At runtime you can inspect the cache:

```php
<?php
declare(strict_types=1);

$status = opcache_get_status(false);
if ($status !== false) {
    $mem = $status['memory_usage'];
    printf(
        "OPcache: %d scripts cached, %.1f MB used / %.1f MB free\n",
        $status['opcache_statistics']['num_cached_scripts'],
        $mem['used_memory'] / 1_048_576,
        $mem['free_memory'] / 1_048_576,
    );
}
```

## 41.2 APCu — In-Process Key/Value Store

APCu (APC User Cache) shares memory across all PHP-FPM workers in a single pool. It survives across requests but is wiped on FPM restart. Ideal for small, hot data: configuration arrays, feature flags, aggregate counts.

```php
<?php
declare(strict_types=1);

function getPopularTags(): array
{
    $key = 'popular_tags_v1';

    // Cache-aside pattern: check → compute → store
    $cached = apcu_fetch($key, $success);
    if ($success) {
        return $cached;
    }

    // Simulated DB call
    $tags = ['php', 'performance', 'caching'];

    apcu_store($key, $tags, ttl: 300); // 5-minute TTL
    return $tags;
}

$tags = getPopularTags();
print_r($tags);
```

APCu is per-process on CLI, so it is not useful for CLI scripts. For worker-to-worker sharing, use Redis.

## 41.3 Redis from PHP

Install the driver of your choice:

```bash
# Pure PHP (works everywhere, slightly slower)
composer require predis/predis

# C extension (faster, requires pecl install redis)
pecl install redis
```

Cache-aside with `predis`:

```php
<?php
declare(strict_types=1);

use Predis\Client;

$redis = new Client(['host' => '127.0.0.1', 'port' => 6379]);

function getUserById(Client $redis, int $id): array
{
    $key = "user:{$id}";
    $hit = $redis->get($key);

    if ($hit !== null) {
        return json_decode($hit, true, flags: JSON_THROW_ON_ERROR);
    }

    // Simulate DB fetch
    $user = ['id' => $id, 'name' => 'Alice', 'role' => 'admin'];

    $redis->setex($key, 600, json_encode($user, JSON_THROW_ON_ERROR));
    return $user;
}
```

Use `SETEX` (set with expiry) rather than `SET` + `EXPIRE` to avoid the race window between the two calls.

## 41.4 Benchmarking with `microtime`

```php
<?php
declare(strict_types=1);

function benchmark(string $label, callable $fn, int $iterations = 10_000): void
{
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        $fn();
    }
    $elapsed = (microtime(true) - $start) * 1000;
    printf("%-30s %8.3f ms (%d iterations)\n", $label, $elapsed, $iterations);
}

// Naive string build
benchmark('String concatenation', function (): void {
    $s = '';
    for ($i = 0; $i < 100; $i++) {
        $s .= (string) $i;
    }
});

// Faster alternative
benchmark('implode + range', function (): void {
    implode('', range(0, 99));
});
```

## 41.5 Memory Profiling

```php
<?php
declare(strict_types=1);

function measureMemory(string $label, callable $fn): void
{
    gc_collect_cycles();
    $before = memory_get_usage(true);
    $fn();
    $peak = memory_get_peak_usage(true);
    printf("%-25s before: %s  peak: %s\n",
        $label,
        number_format($before),
        number_format($peak),
    );
}

measureMemory('range(1, 100_000)', function (): void {
    $data = range(1, 100_000);
    unset($data);
});

measureMemory('Generator equivalent', function (): void {
    $gen = (function () {
        for ($i = 1; $i <= 100_000; $i++) {
            yield $i;
        }
    })();
    foreach ($gen as $v) { /* consume */ }
});
```

A generator holds only one value in memory at a time; the array version allocates the entire range upfront.

## 41.6 Xdebug Profiling

For line-level profiling, enable the Xdebug profiler:

```ini
; php.ini or xdebug.ini
xdebug.mode=profile
xdebug.output_dir=/tmp/xdebug
xdebug.profiler_output_name=cachegrind.out.%p
```

Then open the `cachegrind.out.*` file in KCachegrind or Webgrind. For production-safe sampling, prefer Blackfire or Tideways.

## Key Takeaways

- OPcache eliminates parse/compile overhead; set `validate_timestamps=0` in production and reload FPM on deploy.
- APCu is a fast in-process store for hot, small data; Redis is the right choice when data must be shared across workers or machines.
- The cache-aside pattern (check → compute → store) is the standard way to integrate any cache layer.
- `microtime(true)` and `memory_get_peak_usage(true)` give you real numbers without external tools.
- Generator functions have near-zero memory overhead compared to building full arrays.

## What's Next

Chapter 42 covers the infrastructure around PHP: PHP-FPM pools, Nginx configuration, Docker multi-stage builds, and hardening `php.ini` for production.
