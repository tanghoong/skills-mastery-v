# Chapter 42 — Deployment & Tooling

> **Goal:** Ship a PHP application confidently — understand PHP-FPM pool tuning, Nginx integration, Docker packaging, environment management, and production `php.ini` hardening.

## 42.1 PHP-FPM Pool Configuration

PHP-FPM manages a pool of worker processes that handle requests. The default pool is named `www`. A typical production pool config:

```ini
; /etc/php/8.4/fpm/pool.d/www.conf
[www]
user  = www-data
group = www-data

listen = /run/php/php8.4-fpm.sock   ; Unix socket is faster than TCP for same-host Nginx

; Worker process management
pm = dynamic
pm.max_children      = 50
pm.start_servers     = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests      = 500          ; recycle workers after N requests to prevent memory leaks

; Logging
slowlog                    = /var/log/php-fpm/slow.log
request_slowlog_timeout    = 5s
php_admin_value[error_log] = /var/log/php-fpm/error.log
php_admin_flag[log_errors] = on
```

Choose the `pm` strategy:

| Strategy | When to use |
|---|---|
| `dynamic` | Variable traffic; FPM scales workers up and down |
| `static` | Predictable load; simpler, uses more memory at idle |
| `ondemand` | Very low traffic; workers start on request (high cold-start cost) |

## 42.2 Nginx + PHP-FPM

```nginx
# /etc/nginx/sites-available/app.conf
server {
    listen 80;
    server_name app.example.com;
    root /var/www/app/public;
    index index.php;

    # Route everything through the front controller
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass  unix:/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include       fastcgi_params;

        # Security
        fastcgi_hide_header X-Powered-By;
    }

    # Never serve dot-files
    location ~ /\. { deny all; }
}
```

After editing, validate and reload without dropping connections:

```bash
nginx -t && nginx -s reload
```

## 42.3 Dockerfile — Multi-Stage Build

```dockerfile
# ── Stage 1: Composer install ──────────────────────────────────────────────
FROM composer:2 AS builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .

# ── Stage 2: Runtime image ─────────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS runtime

# Install extensions
RUN apk add --no-cache libpq-dev \
    && docker-php-ext-install pdo_pgsql opcache

# Harden php.ini
COPY docker/php/php-production.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/php/www.conf           /usr/local/etc/php-fpm.d/www.conf

WORKDIR /var/www/app
COPY --from=builder /app /var/www/app

RUN chown -R www-data:www-data /var/www/app/storage

USER www-data
EXPOSE 9000
CMD ["php-fpm"]
```

The builder stage keeps Composer and dev dependencies out of the final image. The runtime image is Alpine-based (~60 MB vs ~400 MB for the Debian variant).

## 42.4 Environment Management with `vlucas/phpdotenv`

```bash
composer require vlucas/phpdotenv
```

```php
<?php
declare(strict_types=1);

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Validate required variables at boot — fail fast before the app starts
$dotenv->required(['APP_ENV', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS']);
$dotenv->required(['APP_ENV'])->allowedValues(['production', 'staging', 'development']);

$dbHost = $_ENV['DB_HOST'];
```

Never commit `.env` files. Commit `.env.example` with placeholder values as documentation. In CI/CD, inject secrets via environment variables directly (no `.env` file needed).

## 42.5 Health Check Endpoint

A health endpoint lets load balancers and orchestrators (Kubernetes, ECS) verify that the PHP process is alive and ready:

```php
<?php
declare(strict_types=1);

// public/health.php
header('Content-Type: application/json');

$checks = [
    'php_version' => PHP_VERSION,
    'memory_limit' => ini_get('memory_limit'),
    'extensions'  => [
        'pdo'     => extension_loaded('pdo'),
        'opcache' => extension_loaded('Zend OPcache'),
        'redis'   => extension_loaded('redis'),
    ],
];

$healthy = !in_array(false, $checks['extensions'], strict: true);

http_response_code($healthy ? 200 : 503);
echo json_encode(['status' => $healthy ? 'ok' : 'degraded', ...$checks], JSON_PRETTY_PRINT);
```

## 42.6 Production `php.ini` Hardening

```ini
; docker/php/php-production.ini

; --- Security ---
expose_php        = Off          ; hide version from HTTP headers
display_errors    = Off          ; never show errors to users
log_errors        = On
error_log         = /var/log/php/error.log
error_reporting   = E_ALL

; --- Limits ---
memory_limit      = 256M
max_execution_time = 30
upload_max_filesize = 20M
post_max_size     = 21M

; --- Sessions ---
session.cookie_httponly = 1
session.cookie_secure   = 1
session.cookie_samesite = Strict
session.use_strict_mode = 1

; --- OPcache ---
opcache.enable              = 1
opcache.validate_timestamps = 0
opcache.memory_consumption  = 256
opcache.jit                 = tracing
opcache.jit_buffer_size     = 100M
```

## Key Takeaways

- PHP-FPM pools let you tune concurrency independently per application; `pm.max_requests` prevents gradual memory leaks.
- Multi-stage Docker builds separate build-time tooling from the slim runtime image.
- `vlucas/phpdotenv` handles `.env` parsing and required-variable validation at boot time.
- A `/health` endpoint returning JSON is the standard contract for orchestrators and load balancers.
- Production `php.ini` must disable `expose_php` and `display_errors`, enable session hardening, and lock down OPcache `validate_timestamps`.

## What's Next

Chapter 43 introduces Twig, PHP's most popular template engine, covering inheritance, filters, macros, and auto-escaping.
