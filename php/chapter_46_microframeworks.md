# Chapter 46 — Microframeworks

> **Goal:** Know when a microframework is the right fit, understand PSR-7/PSR-15 middleware pipelines, and build a Slim 4-style app from first principles.

## 46.1 The Case for Lightweight

Laravel and Symfony solve every problem upfront — routing, ORM, queuing, auth, mail, templating — at the cost of complexity and startup overhead. A microframework solves only routing and the HTTP request/response cycle. That is exactly what you need for:

- **Microservices**: a single-purpose service (image resize, webhook processor, PDF generator) has no need for an ORM or queue system.
- **Internal APIs**: simple JSON endpoints consumed by a frontend or another service.
- **Prototype or proof-of-concept**: get a working API in 30 lines, no boilerplate.
- **Embedding in legacy code**: wrap a Slim app around a section of a monolith without rewriting everything.

## 46.2 PSR-7 — HTTP Message Interfaces

PSR-7 defines standard interfaces for HTTP messages so middleware and frameworks can interoperate:

| Interface | Represents |
|---|---|
| `ServerRequestInterface` | Incoming HTTP request (read-only) |
| `ResponseInterface` | Outgoing HTTP response |
| `StreamInterface` | Message body as a stream |

Because these are interfaces, you can swap the underlying implementation (Slim uses `nyholm/psr7`; you could use `laminas/diactoros`) without changing any application code.

```php
<?php
declare(strict_types=1);

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

// PSR-7 request is immutable — methods return new instances
function handler(Request $request, Response $response): Response
{
    $body = $response->getBody();
    $body->write(json_encode(['hello' => 'world'], JSON_THROW_ON_ERROR));

    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus(200);
}
```

## 46.3 PSR-15 — Middleware Interface

PSR-15 defines the middleware contract. A middleware receives a `Request` and a `RequestHandlerInterface`, optionally modifies the request, calls the next handler, and can modify the response before returning it:

```php
<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class JsonContentTypeMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $response = $handler->handle($request); // call next
        return $response->withHeader('Content-Type', 'application/json');
    }
}
```

Middleware composes into a pipeline: each layer wraps the next, like an onion. The outermost middleware runs first on the way in and last on the way out.

## 46.4 Slim 4 — Routing and Middleware

Slim 4 is a thin router built on PSR-7 and PSR-15. Install it:

```bash
composer require slim/slim slim/psr7
```

A complete Slim 4 application:

```php
<?php
declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

$app = AppFactory::create();

// Global middleware (runs on every request)
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(displayErrorDetails: true, logErrors: true, logErrorDetails: true);

// Routes
$app->get('/ping', function (Request $request, Response $response): Response {
    $response->getBody()->write(json_encode(['pong' => true]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/users/{id:\d+}', function (Request $request, Response $response, array $args): Response {
    $id   = (int) $args['id'];
    $user = ['id' => $id, 'name' => 'Alice']; // replace with DB call
    $response->getBody()->write(json_encode($user));
    return $response->withHeader('Content-Type', 'application/json');
});

// Route group with shared middleware
$app->group('/admin', function (\Slim\Routing\RouteCollectorProxy $group): void {
    $group->get('/stats', function (Request $req, Response $res): Response {
        $res->getBody()->write(json_encode(['users' => 42]));
        return $res->withHeader('Content-Type', 'application/json');
    });
})->add(new AuthMiddleware());

$app->run();
```

## 46.5 Middleware Pipeline in Slim

Middleware in Slim is added with `->add()` at the app or route level. Execution order is LIFO (last added = first executed):

```php
<?php
declare(strict_types=1);

// Request flows: CorsMiddleware → AuthMiddleware → handler
// Response flows back: handler → AuthMiddleware → CorsMiddleware
$app->add(new AuthMiddleware());   // added second → runs second on request
$app->add(new CorsMiddleware());   // added first  → runs first on request
```

This matches the behaviour of Express middleware (`app.use()`) — the stack is identical in concept.

## 46.6 Lumen — Laravel-Lite for Microservices

Lumen is a stripped-down Laravel built specifically for microservices and APIs. It boots faster than full Laravel (~50 ms vs ~150 ms), retains Eloquent and the service container, but drops Blade, sessions, cookies, and many Artisan commands.

```bash
composer create-project --prefer-dist laravel/lumen my-service
```

A Lumen route:

```php
<?php
// routes/web.php
$router->get('/health', fn() => response()->json(['status' => 'ok']));

$router->group(['prefix' => 'api/v1', 'middleware' => 'auth'], function () use ($router) {
    $router->get('users',      'UserController@index');
    $router->post('users',     'UserController@store');
    $router->get('users/{id}', 'UserController@show');
});
```

Lumen still uses the Laravel Facade system and `$app->register()` for service providers. If a Lumen service grows into a full product, migrating to Laravel is straightforward because the API is intentionally compatible.

## 46.7 When Lightweight Wins

Use a microframework (Slim, Lumen) over a full-stack framework when:

1. **The service has a single responsibility** — one domain, a handful of endpoints, no admin UI.
2. **Cold-start time matters** — serverless deployments (AWS Lambda, Google Cloud Run) penalise heavy boot times.
3. **You are wrapping an external library** — the framework is just the HTTP transport; the real logic is in a vendor package.
4. **Team prefers explicit wiring** — all services, middleware, and config are declared in code, nothing is magic.

Conversely, choose Laravel or Symfony when you need the full ecosystem: auth, queues, mail, broadcasting, admin panels, or when a large team benefits from the framework's guardrails.

## Key Takeaways

- PSR-7 (HTTP messages) and PSR-15 (middleware) are the contracts that make microframeworks interoperable.
- Slim 4 provides routing and a middleware pipeline with minimal boot overhead.
- Lumen is Laravel-compatible API scaffolding with a faster startup profile — ideal for microservices that may later grow into full Laravel apps.
- Middleware pipelines work the same way as Express `app.use()`: LIFO stack, each layer wraps the next.
- Reach for a microframework when your service has a single responsibility or cold-start time is a constraint.

## What's Next

Chapter 47 surveys high-performance PHP runtimes — Swoole, RoadRunner, and FrankenPHP — and closes the course with the NoteFlow capstone architecture overview.
