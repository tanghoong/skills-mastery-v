<?php
declare(strict_types=1);
/**
 * Chapter 42 — Deployment & Tooling
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_42.php
 */

// ── TODO 1: HealthCheck class ────────────────────────────────────────────────
// Implement a HealthCheck class with a check(): array method that returns:
//   php_version   — PHP_VERSION constant
//   memory_limit  — from ini_get('memory_limit')
//   extensions    — associative array of extension_name => bool (loaded?)
//     Check: pdo, pdo_mysql, pdo_pgsql, opcache, redis, mbstring, json
//   status        — 'ok' if all required extensions are loaded, 'degraded' otherwise
// Required extensions for 'ok': pdo, mbstring, json (others are optional)

echo "── TODO 1: HealthCheck ─────────────────────────────────────────────────\n";

final class HealthCheck
{
    private const REQUIRED_EXTENSIONS = ['pdo', 'mbstring', 'json'];

    /** @return array<string, mixed> */
    public function check(): array
    {
        $extensionsToCheck = ['pdo', 'pdo_mysql', 'pdo_pgsql', 'opcache', 'redis', 'mbstring', 'json'];

        $extensions = [];
        foreach ($extensionsToCheck as $ext) {
            // OPcache reports as 'Zend OPcache' in extension_loaded()
            $loaded           = $ext === 'opcache'
                ? extension_loaded('Zend OPcache')
                : extension_loaded($ext);
            $extensions[$ext] = $loaded;
        }

        $requiredLoaded = array_reduce(
            self::REQUIRED_EXTENSIONS,
            fn(bool $carry, string $ext): bool => $carry && ($extensions[$ext] ?? false),
            true,
        );

        return [
            'php_version'  => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'extensions'   => $extensions,
            'status'       => $requiredLoaded ? 'ok' : 'degraded',
        ];
    }
}

$health = (new HealthCheck())->check();
printf("PHP Version  : %s\n", $health['php_version']);
printf("Memory Limit : %s\n", $health['memory_limit']);
printf("Status       : %s\n", $health['status']);
echo "Extensions:\n";
foreach ($health['extensions'] as $name => $loaded) {
    printf("  %-12s %s\n", $name, $loaded ? 'loaded' : 'missing');
}

// ── TODO 2: Manual .env parser ───────────────────────────────────────────────
// Write parseEnvFile(string $content): array<string, string> that:
//   - Splits content into lines
//   - Ignores blank lines and lines starting with '#'
//   - Splits each line on the first '=' — left is key, right is value
//   - Strips surrounding quotes (single or double) from values
//   - Returns an associative array of key => value
// Then write loadEnv(string $content): void that populates $_ENV

echo "\n── TODO 2: .env file parser ────────────────────────────────────────────\n";

/**
 * @return array<string, string>
 */
function parseEnvFile(string $content): array
{
    $result = [];
    $lines  = explode("\n", $content);

    foreach ($lines as $line) {
        $line = trim($line);

        // Skip blanks and comments
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        // Split on the first '=' only
        $pos = strpos($line, '=');
        if ($pos === false) {
            continue;
        }

        $key   = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1));

        // Strip surrounding quotes
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if ($key !== '') {
            $result[$key] = $value;
        }
    }

    return $result;
}

function loadEnv(string $content): void
{
    $vars = parseEnvFile($content);
    foreach ($vars as $key => $value) {
        $_ENV[$key] = $value;
    }
}

$envContent = <<<'ENV'
# Application configuration
APP_ENV=production
APP_NAME="NoteFlow API"
APP_DEBUG=false

# Database
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=noteflow
DB_USER='noteflow_user'
DB_PASS='s3cr3t!'

# Blank line above should be ignored
REDIS_URL=redis://localhost:6379
ENV;

$parsed = parseEnvFile($envContent);
foreach ($parsed as $key => $val) {
    printf("  %-12s = %s\n", $key, $val);
}
loadEnv($envContent);
printf("\n\$_ENV['APP_NAME'] = %s\n", $_ENV['APP_NAME'] ?? 'not set');

// ── TODO 3: config() helper ──────────────────────────────────────────────────
// Write config(string $key, mixed $default = null): mixed
//   - Reads from $_ENV[$key]
//   - Returns $default if the key does not exist
// Test it with keys loaded from TODO 2 and a missing key.

echo "\n── TODO 3: config() helper ─────────────────────────────────────────────\n";

function config(string $key, mixed $default = null): mixed
{
    return $_ENV[$key] ?? $default;
}

printf("DB_HOST   = %s\n", config('DB_HOST', 'localhost'));
printf("DB_PORT   = %s\n", config('DB_PORT', '5432'));
printf("CACHE_TTL = %s\n", config('CACHE_TTL', '300'));  // not in .env — uses default
printf("APP_ENV   = %s\n", config('APP_ENV', 'development'));

// ── TODO 4: Recommended production php.ini settings ──────────────────────────
// Print a formatted string listing the most important production php.ini settings.
// Group them under: Security, Limits, Sessions, OPcache.
// Use printf or heredoc — no external file needed.

echo "\n── TODO 4: Recommended production php.ini settings ─────────────────────\n";

$phpIni = <<<'INI'
; ──────────────────────────────────────────────────────
; Recommended production php.ini settings
; ──────────────────────────────────────────────────────

; [Security]
expose_php            = Off      ; hide PHP version from headers
display_errors        = Off      ; never show errors to end users
log_errors            = On
error_log             = /var/log/php/error.log
error_reporting       = E_ALL

; [Limits]
memory_limit          = 256M
max_execution_time    = 30
upload_max_filesize   = 20M
post_max_size         = 21M

; [Sessions]
session.cookie_httponly = 1
session.cookie_secure   = 1
session.cookie_samesite = Strict
session.use_strict_mode = 1

; [OPcache]
opcache.enable              = 1
opcache.validate_timestamps = 0
opcache.memory_consumption  = 256
opcache.jit                 = tracing
opcache.jit_buffer_size     = 100M
; ──────────────────────────────────────────────────────
INI;

echo $phpIni . "\n";

// ── TODO 5: Dockerfile as a comment block ────────────────────────────────────
// Write a multi-stage Dockerfile as a PHP block comment.
// Stage 1 (builder): FROM composer:2, install dependencies with --no-dev
// Stage 2 (runtime): FROM php:8.4-fpm-alpine, install extensions,
//   copy php-production.ini, copy built app from stage 1, expose 9000, CMD php-fpm
// Explain in a comment above why multi-stage builds keep the final image small.

echo "\n── TODO 5: Dockerfile (multi-stage build) ───────────────────────────────\n";

/*
 * WHY MULTI-STAGE?
 * ─────────────────
 * The builder stage contains Composer, all dev dependencies, and build tooling.
 * None of that belongs in a production image — it inflates size and increases
 * the attack surface. The COPY --from=builder directive cherry-picks only the
 * compiled vendor directory and application code, leaving Composer itself behind.
 * Result: a ~80 MB Alpine image instead of a ~500 MB Debian image.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * # ── Stage 1: Install Composer dependencies ────────────────────────────────
 * FROM composer:2 AS builder
 * WORKDIR /app
 * COPY composer.json composer.lock ./
 * RUN composer install \
 *       --no-dev \
 *       --optimize-autoloader \
 *       --no-interaction \
 *       --prefer-dist
 * COPY . .
 *
 * # ── Stage 2: Production runtime ────────────────────────────────────────────
 * FROM php:8.4-fpm-alpine AS runtime
 *
 * # Install required OS libs and PHP extensions
 * RUN apk add --no-cache libpq-dev \
 *     && docker-php-ext-install pdo_pgsql opcache
 *
 * # Harden PHP
 * COPY docker/php/php-production.ini /usr/local/etc/php/conf.d/99-production.ini
 * COPY docker/php/www.conf           /usr/local/etc/php-fpm.d/www.conf
 *
 * # Copy application from builder (no Composer binary, no dev packages)
 * WORKDIR /var/www/app
 * COPY --from=builder /app /var/www/app
 *
 * # Permissions
 * RUN chown -R www-data:www-data /var/www/app/storage /var/www/app/bootstrap/cache
 *
 * USER www-data
 * EXPOSE 9000
 * HEALTHCHECK --interval=30s --timeout=5s \
 *     CMD php-fpm -t || exit 1
 * CMD ["php-fpm"]
 * ──────────────────────────────────────────────────────────────────────────────
 */

echo "Dockerfile printed as comment block above this line.\n";
echo "See the source of this file to read the full multi-stage Dockerfile.\n";
