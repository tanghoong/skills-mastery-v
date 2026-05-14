# NoteFlow — Deployment and Architecture Specification

NoteFlow is the capstone portfolio project for the PHP Mastery course. This document is the engineering reference for building and deploying it. Keep it open alongside the course chapters as you work through the implementation.

---

## 1. Project Overview

NoteFlow is a full-featured web note-taking application built in **native PHP 8.4+** with **no framework**. Every architectural decision is made by hand — routing, middleware, dependency injection, templating, and database access — so that the application demonstrates the full PHP curriculum in a single deployable product.

### What It Is

- A multi-user note-taking app with authentication, CRUD operations on notes, tagging, and full-text search
- Built with PHP 8.4+, Twig 3 for templates, and MySQL 8.0 for persistence
- No Laravel, no Symfony, no Slim — every component is purpose-built using course concepts
- A CLI migration runner modeled on artisan-style console commands
- Deployable as a single-server application behind Nginx + PHP-FPM

### Target Deployment

Single VPS on DigitalOcean or Hetzner (2 vCPU, 4 GB RAM is sufficient). The stack runs entirely on one machine:

```
[ Browser ]
    |
[ Nginx (TLS termination, static files) ]
    |
[ PHP-FPM (Unix socket) ]
    |
[ NoteFlow PHP Application ]
    |
[ MySQL 8.0 (local socket) ]
```

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | PHP | 8.4+ |
| Template engine | Twig | 3.x |
| Environment variables | vlucas/phpdotenv | 5.x |
| Unit / feature tests | PHPUnit | 11.x |
| Expressive test syntax | Pest | 2.x |
| Database | MySQL | 8.0 |
| Web server | Nginx | 1.26+ |
| PHP process manager | PHP-FPM | 8.4 |
| Dependency management | Composer | 2.x |

---

## 2. Architecture

### Directory Tree

```
noteflow/
├── public/
│   ├── index.php                  <- Front controller (Ch. 39)
│   └── assets/
│       ├── css/
│       └── js/
├── src/
│   ├── Http/
│   │   ├── Router.php             <- Regex-based URI router (Ch. 39)
│   │   ├── Request.php            <- Value object wrapping $_SERVER, $_GET, $_POST (Ch. 27)
│   │   └── Response.php           <- Value object; sends headers + body (Ch. 27)
│   ├── Middleware/
│   │   ├── MiddlewareInterface.php
│   │   ├── AuthMiddleware.php     <- Redirects unauthenticated users (Ch. 24)
│   │   └── CsrfMiddleware.php     <- Validates CSRF token on mutating requests (Ch. 24, 38)
│   ├── Controllers/
│   │   ├── NoteController.php     <- index, create, store, show, edit, update, destroy, search
│   │   ├── AuthController.php     <- showLogin, login, logout, showRegister, register
│   │   └── HealthController.php   <- check
│   ├── Services/
│   │   ├── NoteService.php        <- Business logic; returns Result<T,E> (Ch. 27)
│   │   └── AuthService.php        <- Registration, login, rate-limit enforcement (Ch. 27, 38)
│   ├── Repository/
│   │   ├── RepositoryInterface.php
│   │   ├── NoteRepository.php     <- PDO queries for notes table (Ch. 27, 32)
│   │   ├── UserRepository.php     <- PDO queries for users table (Ch. 32)
│   │   └── CachingNoteRepository.php <- Decorator over NoteRepository (Ch. 23)
│   ├── Domain/
│   │   ├── Note.php               <- Readonly class + property hooks (Ch. 11, 19)
│   │   ├── User.php               <- Domain user entity (Ch. 8)
│   │   ├── GuestUser.php          <- Null Object implements UserInterface (Ch. 25)
│   │   ├── NoteDto.php            <- Readonly DTO for transfer between layers (Ch. 27)
│   │   └── NoteStatus.php         <- Backed enum: draft | published | archived (Ch. 11)
│   ├── Events/
│   │   ├── EventDispatcher.php    <- Observer / event bus (Ch. 24)
│   │   ├── NoteCreated.php
│   │   └── UserLoggedIn.php
│   ├── Search/
│   │   ├── SearchStrategyInterface.php
│   │   ├── TitleSearchStrategy.php    <- Strategy pattern (Ch. 24)
│   │   ├── TagSearchStrategy.php
│   │   └── FullTextSearchStrategy.php
│   ├── Database/
│   │   ├── Connection.php         <- PDO factory; Factory Method (Ch. 22, 32)
│   │   └── QueryBuilder.php       <- Fluent query builder (Ch. 33)
│   ├── Container/
│   │   └── Container.php          <- Manual PSR-11 DI container (Ch. 26)
│   └── Result.php                 <- Result<T,E> type (Ch. 27)
├── templates/                     <- Twig templates (Ch. 43)
│   ├── layout/
│   │   └── base.html.twig
│   ├── notes/
│   │   ├── index.html.twig
│   │   ├── show.html.twig
│   │   ├── create.html.twig
│   │   └── edit.html.twig
│   └── auth/
│       ├── login.html.twig
│       └── register.html.twig
├── cli/
│   └── console.php                <- CLI runner (Ch. 34)
├── migrations/                    <- Numbered SQL files (Ch. 28–31)
│   ├── 001_create_users.sql
│   ├── 002_create_notes.sql
│   ├── 003_create_tags.sql
│   └── 004_create_note_tags.sql
├── tests/
│   ├── Unit/                      <- PHPUnit / Pest, mocked dependencies (Ch. 40)
│   │   ├── Services/
│   │   └── Domain/
│   └── Integration/               <- Repositories tested against SQLite in-memory (Ch. 40)
│       └── Repository/
├── composer.json
├── phpunit.xml
├── .env
└── .env.example
```

### Request Lifecycle

```
Browser
  |
  | HTTP request
  v
Nginx
  |  matches location ~ \.php$ or falls through try_files
  |  proxies to Unix socket
  v
PHP-FPM
  |  boots PHP process from pool
  v
public/index.php  (front controller)
  |  loads autoloader, .env, builds Container
  v
Router::dispatch($request)
  |  matches URI against registered routes, extracts params
  v
Middleware Pipeline  (Chain of Responsibility)
  |  AuthMiddleware -> CsrfMiddleware -> [next]
  v
Controller::action($request, $params)
  |  validates input, builds command/DTO
  v
Service::method($dto)
  |  applies business rules, returns Result<T,E>
  v
Repository::query($params)
  |  executes PDO prepared statement
  v
MySQL 8.0
  |  returns rows
  v
Repository  -> Domain object(s)
  v
Service     -> Result<DomainObject, ErrorMessage>
  v
Controller  -> renders Twig template or redirects
  v
Response::send()
  |  sets HTTP headers, writes body
  v
Browser
```

### Dependency Graph

```
Container
  |
  +-- Connection (PDO)
  |
  +-- NoteRepository (Connection)
  |     ^
  |     +-- CachingNoteRepository (decorator)
  |
  +-- UserRepository (Connection)
  |
  +-- EventDispatcher
  |
  +-- NoteService (NoteRepository, EventDispatcher)
  +-- AuthService (UserRepository, EventDispatcher)
  |
  +-- Router
  |     +-- NoteController (NoteService)
  |     +-- AuthController (AuthService)
  |     +-- HealthController
  |
  +-- MiddlewarePipeline
        +-- AuthMiddleware
        +-- CsrfMiddleware
```

### Pattern Map

| Pattern | Location in Codebase |
|---------|---------------------|
| Repository | `src/Repository/NoteRepository.php`, `UserRepository.php` |
| Service Layer | `src/Services/NoteService.php`, `AuthService.php` |
| DTO / Value Object | `src/Domain/NoteDto.php`, `src/Http/Request.php`, `Response.php` |
| Result `Result<T,E>` | `src/Result.php`; returned by all Service methods |
| Chain of Responsibility | `src/Middleware/` pipeline in `public/index.php` |
| Strategy | `src/Search/` — three interchangeable search strategies |
| Observer | `src/Events/EventDispatcher.php` wired to domain events |
| Factory Method | `src/Database/Connection::create()` |
| Null Object | `src/Domain/GuestUser.php` implements `UserInterface` |
| Decorator | `src/Repository/CachingNoteRepository.php` wraps `NoteRepository` |

---

## 3. Database Schema

### CREATE TABLE Statements

```sql
CREATE TABLE users (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    name          VARCHAR(100)    NOT NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED    NOT NULL,
    title      VARCHAR(255)    NOT NULL,
    body       MEDIUMTEXT      NOT NULL,
    status     ENUM('draft','published','archived')
                               NOT NULL DEFAULT 'draft',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notes_user_id (user_id),
    FULLTEXT KEY ft_notes_title_body (title, body),
    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tags (
    id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    name VARCHAR(50)   NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_tags (
    note_id INT UNSIGNED NOT NULL,
    tag_id  INT UNSIGNED NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)  REFERENCES tags  (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### ER Diagram

```
users
+----+-------------------+---------------+------+
| id | email             | password_hash | name |
+----+-------------------+---------------+------+
  |
  | 1 ──────────────────────────── N
  |
notes
+----+---------+-------+------+--------+
| id | user_id | title | body | status |
+----+---------+-------+------+--------+
  |
  | N ──────── note_tags ──────── N
  |            +--------+------+
  |            | note_id| tag_id|
  |            +--------+------+
  |                        |
  |                        | N ─── 1
  |                      tags
  |                    +----+------+
  |                    | id | name |
  |                    +----+------+
```

---

## 4. Environment Setup (Local)

### Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| PHP | 8.4 | `php --version` |
| Composer | 2.x | `composer --version` |
| MySQL | 8.0 (or Docker) | `mysql --version` |
| Node (optional, for CSS build) | 20 LTS | `node --version` |

### Step-by-Step Local Setup

```bash
# 1. Clone or navigate to the project
cd noteflow

# 2. Install PHP dependencies
composer install

# 3. Copy environment file and fill in your local values
cp .env.example .env

# 4. Edit .env — minimum required values:
#    DB_HOST=127.0.0.1
#    DB_PORT=3306
#    DB_NAME=noteflow
#    DB_USER=noteflow_user
#    DB_PASS=localpassword
#    APP_ENV=local
#    APP_KEY=<random 32-char string>

# 5. Start MySQL via Docker (skip if you have MySQL installed locally)
docker run -d --name php-mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -e MYSQL_DATABASE=noteflow \
  -e MYSQL_USER=noteflow_user \
  -e MYSQL_PASSWORD=localpassword \
  -p 3306:3306 mysql:8.0

# 6. Run database migrations
php cli/console.php migrate

# 7. (Optional) Seed demo data
php cli/console.php seed

# 8. Start the built-in PHP development server
php -S localhost:8000 -t public/

# App is now at http://localhost:8000
```

### Running Tests

```bash
# PHPUnit
./vendor/bin/phpunit

# Pest
./vendor/bin/pest

# With coverage (requires Xdebug or pcov)
./vendor/bin/phpunit --coverage-text
./vendor/bin/pest --coverage
```

---

## 5. Production Deployment

### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name noteflow.example.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name noteflow.example.com;

    ssl_certificate     /etc/letsencrypt/live/noteflow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noteflow.example.com/privkey.pem;

    root /var/www/noteflow/public;
    index index.php;

    # Serve static assets directly, send everything else to front controller
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM via Unix socket
    location ~ \.php$ {
        fastcgi_pass   unix:/run/php/php8.4-fpm.sock;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }

    # Block access to sensitive files
    location ~ /\.(env|git|htaccess) {
        deny all;
        return 404;
    }

    # Security headers
    add_header X-Frame-Options           "SAMEORIGIN"                always;
    add_header X-Content-Type-Options    "nosniff"                   always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
        always;

    access_log /var/log/nginx/noteflow_access.log;
    error_log  /var/log/nginx/noteflow_error.log;
}
```

### PHP-FPM Pool Configuration

Add to `/etc/php/8.4/fpm/pool.d/noteflow.conf`:

```ini
[noteflow]
user  = www-data
group = www-data

listen = /run/php/php8.4-fpm.sock
listen.owner = www-data
listen.group = www-data
listen.mode  = 0660

pm                   = dynamic
pm.max_children      = 20
pm.start_servers     = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 8
pm.max_requests      = 500

; Slow log — log requests taking more than 5 s
slowlog           = /var/log/php/noteflow-slow.log
request_slowlog_timeout = 5s

; Environment variables passed to the pool
env[APP_ENV]  = production
env[APP_KEY]  = $APP_KEY
env[DB_HOST]  = 127.0.0.1
env[DB_NAME]  = noteflow
env[DB_USER]  = noteflow_user
env[DB_PASS]  = $DB_PASS
```

### Production php.ini Hardening

| Setting | Production Value | Reason |
|---------|----------------|--------|
| `expose_php` | `Off` | Hides PHP version from response headers |
| `display_errors` | `Off` | Never leak error details to the browser |
| `log_errors` | `On` | Errors go to the server log instead |
| `error_log` | `/var/log/php/noteflow-error.log` | Dedicated log file |
| `error_reporting` | `E_ALL` | Capture everything, but log only |
| `opcache.enable` | `1` | Bytecode cache — critical for performance |
| `opcache.memory_consumption` | `128` | MB reserved for opcode cache |
| `opcache.validate_timestamps` | `0` | Disable file-change checks in production |
| `opcache.max_accelerated_files` | `10000` | Enough headroom for vendor + src |
| `session.cookie_httponly` | `1` | Blocks JavaScript access to session cookie |
| `session.cookie_secure` | `1` | Session cookie over HTTPS only |
| `session.cookie_samesite` | `Strict` | CSRF mitigation at cookie level |
| `session.use_strict_mode` | `1` | Reject uninitialized session IDs |
| `allow_url_fopen` | `Off` | Prevent remote file inclusion |
| `allow_url_include` | `Off` | Prevent remote file inclusion |
| `file_uploads` | `Off` | NoteFlow does not use file uploads |
| `max_execution_time` | `30` | Kill runaway scripts |
| `memory_limit` | `128M` | Reasonable cap per request |
| `post_max_size` | `2M` | Note body is text — 2 MB is sufficient |

### Dockerfile (Multi-Stage)

```dockerfile
# ── Stage 1: builder ────────────────────────────────────────────────────────
FROM composer:2 AS builder

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

COPY . .

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM php:8.4-fpm-alpine AS runtime

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql opcache

# Copy hardened php.ini
COPY docker/php/php-production.ini /usr/local/etc/php/conf.d/production.ini

# Copy application from builder
WORKDIR /var/www/noteflow
COPY --from=builder /app ./

# Ensure storage directories exist and are writable
RUN mkdir -p /var/www/noteflow/storage/logs \
 && chown -R www-data:www-data /var/www/noteflow

USER www-data

EXPOSE 9000

CMD ["php-fpm"]
```

### docker-compose.yml (Local Stack)

```yaml
version: "3.9"

services:

  app:
    build:
      context: .
      target: runtime
    volumes:
      - .:/var/www/noteflow
    env_file: .env
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - noteflow

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE:      noteflow
      MYSQL_USER:          noteflow_user
      MYSQL_PASSWORD:      localpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - noteflow

  nginx:
    image: nginx:1.26-alpine
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/noteflow
      - ./docker/nginx/noteflow.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - noteflow

volumes:
  mysql_data:

networks:
  noteflow:
    driver: bridge
```

### Health Check Endpoint

```
GET /health
```

Response (HTTP 200):

```json
{
  "status": "ok",
  "php": "8.4.x",
  "db": "connected"
}
```

`HealthController::check()` pings the database with `SELECT 1` via PDO. Returns HTTP 503 with `{"status":"degraded","db":"unreachable"}` if the query fails.

---

## 6. Security Checklist

### CSRF Protection

- Generate a cryptographically random token with `bin2hex(random_bytes(32))` and store it in `$_SESSION['csrf_token']` on session start.
- `CsrfMiddleware` runs before every POST, PUT, and DELETE request.
- Compare the submitted `_csrf_token` field against the session value using `hash_equals()` to prevent timing attacks.
- Regenerate the token after each successful form submission.
- Embed the token in every Twig form: `<input type="hidden" name="_csrf_token" value="{{ csrf_token }}">`.

### XSS

- Twig auto-escaping is enabled globally (`autoescape: 'html'` in `Environment` config).
- Never use `{{ variable | raw }}` on any data that originates from user input.
- For note body rendering (if Markdown is added), sanitize HTML output with an allowlist library before passing to Twig.

### SQL Injection

- All database queries use PDO prepared statements with named placeholders. String interpolation into SQL is never used anywhere in the codebase.
- The `QueryBuilder` class produces only parameterized queries.
- Reviewed at code review: any `$pdo->query()` call (non-prepared) must have a comment justifying why it is safe (e.g., query contains zero user-controlled values).

### Password Storage

```php
$hash = password_hash($plaintext, PASSWORD_BCRYPT, ['cost' => 12]);
$valid = password_verify($plaintext, $hash);
```

- Cost factor 12 is set explicitly — do not rely on the default.
- `password_needs_rehash()` is called on login to transparently upgrade hashes if the cost factor is raised in future.

### Rate Limiting

- Login attempts are tracked per IP address in APCu (production) or session (development).
- After 5 failed attempts within a 15-minute window, the IP is locked out and must wait.
- `AuthService::recordFailedAttempt(string $ip): void` and `AuthService::isRateLimited(string $ip): bool` encapsulate this logic.

### Secure Headers

Served by Nginx (see config above) and also set in PHP as a fallback:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |

### Session Hardening

```php
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => true,      // HTTPS only
    'httponly' => true,       // No JavaScript access
    'samesite' => 'Strict',  // No cross-site requests
]);
session_start();
session_regenerate_id(true); // After login — prevent session fixation
```

---

## 7. API / Route Map

| Method | Path | Controller#Action | Middleware | Description |
|--------|------|------------------|-----------|-------------|
| GET | `/` | `NoteController#index` | auth | List all notes for the authenticated user |
| GET | `/notes/new` | `NoteController#create` | auth | Show the new-note form |
| POST | `/notes` | `NoteController#store` | auth, csrf | Persist a new note |
| GET | `/notes/{id}` | `NoteController#show` | auth | Display a single note |
| GET | `/notes/{id}/edit` | `NoteController#edit` | auth | Show the edit form for a note |
| PUT | `/notes/{id}` | `NoteController#update` | auth, csrf | Update an existing note |
| DELETE | `/notes/{id}` | `NoteController#destroy` | auth, csrf | Delete a note |
| GET | `/search` | `NoteController#search` | auth | Full-text search across user's notes |
| GET | `/login` | `AuthController#showLogin` | — | Show login form |
| POST | `/login` | `AuthController#login` | csrf | Authenticate user, start session |
| POST | `/logout` | `AuthController#logout` | auth, csrf | Destroy session, redirect to login |
| GET | `/register` | `AuthController#showRegister` | — | Show registration form |
| POST | `/register` | `AuthController#register` | csrf | Create account, redirect to login |
| GET | `/health` | `HealthController#check` | — | Returns JSON health status |

### Route Parameter Matching

The router uses named regex captures:

```php
'/notes/{id}' => '#^/notes/(?P<id>\d+)$#'
```

Path parameters are extracted and passed as an associative array to the controller action.

---

## 8. CLI Commands

The console runner is `cli/console.php`. Invoke with `php cli/console.php <command> [arguments]`.

| Command | Description | Example |
|---------|-------------|---------|
| `migrate` | Run all pending migrations in `migrations/` in filename order | `php cli/console.php migrate` |
| `migrate:rollback` | Roll back the last applied migration | `php cli/console.php migrate:rollback` |
| `seed` | Seed the database with demo users and sample notes | `php cli/console.php seed` |
| `make:migration <name>` | Scaffold a new numbered migration file in `migrations/` | `php cli/console.php make:migration add_archived_status` |

The console runner reads `.env` before dispatching to command classes, so database credentials are available without manual export.

---

## 9. Testing Strategy

### Test Types

**Unit tests** (`tests/Unit/`)

- Test Service classes in isolation.
- All Repository dependencies are replaced with PHPUnit mock objects created via `createMock()`.
- Assert on `Result` return values, not on database state.
- Framework: PHPUnit 11 (with Pest 2 as an optional expressive layer on top).

**Integration tests** (`tests/Integration/`)

- Test Repository classes against a real database connection.
- Use SQLite in-memory (`sqlite::memory:`) via PDO — fast, no external service needed.
- Migrations are re-run before each test class using `setUp()`.
- Assert on rows returned from the database.

**Feature / smoke tests**

- Manual `curl` commands against the running development server.
- No browser automation (Selenium, Playwright) is in scope for this course.

### Coverage Target

| Layer | Target |
|-------|--------|
| `src/Services/` | 80% line coverage |
| `src/Repository/` | 80% line coverage |
| `src/Domain/` | best-effort |
| `src/Http/` | not measured (integration concern) |

### Example Test Commands

```bash
# Run all tests
./vendor/bin/phpunit

# Run only unit tests
./vendor/bin/phpunit --testsuite Unit

# Run only integration tests
./vendor/bin/phpunit --testsuite Integration

# Run with code coverage report (requires pcov or Xdebug)
./vendor/bin/phpunit --coverage-html coverage/

# Pest (runs the same test suite with Pest's output formatter)
./vendor/bin/pest

# Pest with coverage
./vendor/bin/pest --coverage --min=80
```

### phpunit.xml Configuration Sketch

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">

    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
    </testsuites>

    <source>
        <include>
            <directory>src</directory>
        </include>
    </source>
</phpunit>
```

---

## 10. Course Chapter Cross-Reference

| NoteFlow Component | Chapter(s) | Concept Applied |
|-------------------|-----------|----------------|
| `public/index.php` front controller | Ch. 39 | Front controller pattern, URI routing |
| `src/Http/Router.php` | Ch. 39 | Regex-based URI matching |
| `src/Http/Request.php`, `Response.php` | Ch. 27 | Value objects |
| `src/Middleware/AuthMiddleware.php` | Ch. 24 | Chain of Responsibility |
| `src/Middleware/CsrfMiddleware.php` | Ch. 24, 38 | Chain of Responsibility + security |
| `src/Controllers/NoteController.php` | Ch. 8, 39 | Classes, HTTP layer |
| `src/Services/NoteService.php` | Ch. 27 | Service Layer pattern |
| `src/Services/AuthService.php` | Ch. 27, 38 | Service Layer + rate limiting |
| `src/Repository/NoteRepository.php` | Ch. 27, 32 | Repository pattern + PDO |
| `src/Repository/CachingNoteRepository.php` | Ch. 23 | Decorator pattern |
| `src/Domain/Note.php` | Ch. 11, 19 | Readonly class, property hooks |
| `src/Domain/NoteStatus.php` | Ch. 11 | Backed enum |
| `src/Domain/GuestUser.php` | Ch. 25 | Null Object pattern |
| `src/Domain/NoteDto.php` | Ch. 27 | DTO / readonly constructor promotion |
| `src/Events/EventDispatcher.php` | Ch. 24 | Observer pattern |
| `src/Search/*Strategy.php` | Ch. 24 | Strategy pattern |
| `src/Database/Connection.php` | Ch. 22, 32 | Factory Method + PDO setup |
| `src/Database/QueryBuilder.php` | Ch. 33 | Fluent query builder |
| `src/Container/Container.php` | Ch. 26 | Manual DI container, PSR-11 |
| `src/Result.php` | Ch. 27 | Result pattern for typed error handling |
| `templates/` | Ch. 43 | Twig template engine, inheritance, auto-escaping |
| `cli/console.php` | Ch. 34 | CLI scripting, `$argv`, command dispatch |
| `migrations/` | Ch. 28–31 | DDL, normalization, indexes, transactions |
| `tests/Unit/` | Ch. 40 | PHPUnit, mocking, Pest |
| `tests/Integration/` | Ch. 40 | Repository tests, SQLite in-memory |
| CSRF token generation | Ch. 38 | `random_bytes`, `hash_equals` |
| Password hashing | Ch. 38 | `password_hash` / `password_verify` |
| Session hardening | Ch. 38 | `session_set_cookie_params`, `session_regenerate_id` |
| Rate limiting via APCu | Ch. 38, 41 | APCu in-memory cache |
| Nginx + PHP-FPM config | Ch. 42 | Deployment, PHP-FPM pools |
| OPcache hardening | Ch. 41, 42 | Performance + production php.ini |
| Docker multi-stage build | Ch. 42 | Containerization |
| Health check endpoint | Ch. 42 | Operational readiness probe |
