<?php
declare(strict_types=1);
/**
 * Chapter 41 — Performance & Caching
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_41.php
 */

// ── TODO 1: Benchmark naive vs optimised string concatenation ────────────────
// Use microtime(true) to time two approaches over 10,000 iterations:
//   Naive:     $s = ''; for ($i = 0; $i < 200; $i++) { $s .= $i; }
//   Optimised: implode('', range(0, 199))
// Print results as: "[label]   X.XXX ms (N iterations)"

function benchmark(string $label, callable $fn, int $iterations = 10_000): void
{
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        $fn();
    }
    $elapsed = (microtime(true) - $start) * 1000;
    printf("%-35s %8.3f ms (%d iterations)\n", $label, $elapsed, $iterations);
}

echo "── TODO 1: Benchmark string building ───────────────────────────────────\n";

benchmark('Naive concatenation (loop)', function (): void {
    $s = '';
    for ($i = 0; $i < 200; $i++) {
        $s .= (string) $i;
    }
});

benchmark('Optimised: implode + range', function (): void {
    implode('', range(0, 199));
});

// ── TODO 2: Cache-aside pattern with array cache ─────────────────────────────
// Implement cacheAside(string $key, callable $compute, array &$cache): mixed
// - If $key exists in $cache, return it (cache hit)
// - Otherwise call $compute(), store in $cache[$key], return the value
// - Add a $callCount variable to verify compute is called only once per key

echo "\n── TODO 2: Cache-aside pattern ─────────────────────────────────────────\n";

/**
 * @param array<string, mixed> $cache
 */
function cacheAside(string $key, callable $compute, array &$cache): mixed
{
    if (array_key_exists($key, $cache)) {
        echo "  [HIT]  $key\n";
        return $cache[$key];
    }

    echo "  [MISS] $key — computing...\n";
    $value       = $compute();
    $cache[$key] = $value;
    return $value;
}

$store      = [];
$callCount  = 0;

$expensiveQuery = function () use (&$callCount): array {
    $callCount++;
    // Simulate a 10 ms database call
    usleep(10_000);
    return ['id' => 1, 'name' => 'Alice', 'role' => 'admin'];
};

$user1 = cacheAside('user:1', $expensiveQuery, $store);
$user2 = cacheAside('user:1', $expensiveQuery, $store); // should HIT
$user3 = cacheAside('user:1', $expensiveQuery, $store); // should HIT

printf("compute() called %d time(s) — expected 1\n", $callCount);
printf("Cached user: %s\n", $user1['name']);

// ── TODO 3: Compare memory usage — range() array vs generator ────────────────
// Measure memory_get_peak_usage(true) before and after:
//   a) $data = range(1, 100_000)     — stores all values in memory
//   b) A generator that yields 1..100000 — holds only one value at a time
// Print peak memory for each approach.

echo "\n── TODO 3: Memory — array vs generator ─────────────────────────────────\n";

function measureMemory(string $label, callable $fn): void
{
    gc_collect_cycles();
    $before = memory_get_usage(true);
    $fn();
    $peak  = memory_get_peak_usage(true);
    $delta = $peak - $before;
    printf("%-30s peak: %s  delta: %s\n",
        $label,
        number_format($peak),
        number_format($delta),
    );
}

measureMemory('range(1, 100_000) array', function (): void {
    $data = range(1, 100_000);
    $sum  = array_sum($data);
    unset($data);
});

measureMemory('Generator 1..100_000', function (): void {
    $gen = (function (): \Generator {
        for ($i = 1; $i <= 100_000; $i++) {
            yield $i;
        }
    })();
    $sum = 0;
    foreach ($gen as $v) {
        $sum += $v;
    }
});

// ── TODO 4: SimpleCache class with TTL ───────────────────────────────────────
// Implement a SimpleCache class with:
//   set(string $key, mixed $value, int $ttl = 60): void
//   get(string $key, mixed $default = null): mixed   — returns $default on miss/expired
//   has(string $key): bool
//   delete(string $key): void
// Use time() to compare against the stored expiry timestamp.

echo "\n── TODO 4: SimpleCache with TTL ────────────────────────────────────────\n";

final class SimpleCache
{
    /** @var array<string, array{value: mixed, expires_at: int}> */
    private array $store = [];

    public function set(string $key, mixed $value, int $ttl = 60): void
    {
        $this->store[$key] = [
            'value'      => $value,
            'expires_at' => time() + $ttl,
        ];
    }

    public function get(string $key, mixed $default = null): mixed
    {
        if (!$this->has($key)) {
            return $default;
        }
        return $this->store[$key]['value'];
    }

    public function has(string $key): bool
    {
        if (!array_key_exists($key, $this->store)) {
            return false;
        }
        if (time() > $this->store[$key]['expires_at']) {
            // Lazy eviction — delete on access
            $this->delete($key);
            return false;
        }
        return true;
    }

    public function delete(string $key): void
    {
        unset($this->store[$key]);
    }
}

$cache = new SimpleCache();
$cache->set('token', 'abc123', ttl: 3600);
$cache->set('expired_key', 'gone', ttl: -1); // already expired

printf("token   → %s\n", $cache->get('token', 'not found'));
printf("expired → %s\n", $cache->get('expired_key', 'not found'));
printf("has(token)       = %s\n", $cache->has('token') ? 'true' : 'false');
printf("has(expired_key) = %s\n", $cache->has('expired_key') ? 'true' : 'false');

$cache->delete('token');
printf("after delete(token) = %s\n", $cache->get('token', 'not found'));

// ── TODO 5: OPcache status / config recommendation ───────────────────────────
// If the Zend OPcache extension is loaded, call opcache_get_status(false) and
// print: number of cached scripts, used memory (MB), free memory (MB).
// If OPcache is not available, print the recommended opcache.ini settings instead.

echo "\n── TODO 5: OPcache status ──────────────────────────────────────────────\n";

if (extension_loaded('Zend OPcache') && function_exists('opcache_get_status')) {
    $status = opcache_get_status(false);
    if ($status !== false && $status['opcache_enabled']) {
        $mem = $status['memory_usage'];
        printf("OPcache enabled\n");
        printf("  Cached scripts : %d\n", $status['opcache_statistics']['num_cached_scripts']);
        printf("  Used memory    : %.2f MB\n", $mem['used_memory'] / 1_048_576);
        printf("  Free memory    : %.2f MB\n", $mem['free_memory'] / 1_048_576);
    } else {
        echo "OPcache is loaded but not enabled. Check opcache.enable=1 in php.ini.\n";
    }
} else {
    echo "OPcache not available. Recommended opcache.ini settings:\n\n";
    $recommended = <<<'INI'
    opcache.enable=1
    opcache.enable_cli=0
    opcache.memory_consumption=256
    opcache.interned_strings_buffer=16
    opcache.max_accelerated_files=20000
    opcache.validate_timestamps=0   ; set to 1 in development
    opcache.revalidate_freq=0
    opcache.fast_shutdown=1
    opcache.jit=tracing
    opcache.jit_buffer_size=100M
    INI;
    echo $recommended . "\n";
}
