# Chapter 39 — REST API in Native PHP

> **Goal:** Build a front controller, URI router, middleware pipeline, and JSON response system in native PHP — understanding the patterns that frameworks like Slim and Laravel implement under the hood.

## 39.1 The Front Controller Pattern

In Express, every request goes through `app.js` and the middleware chain. PHP works the same way when you configure your web server to route all requests to a single `index.php`.

Nginx configuration:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

Apache `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
```

Your `public/index.php` is the single entry point — the exact equivalent of `app.listen(3000)` in Express.

## 39.2 The `Request` Value Object

Encapsulate everything about the incoming request in a readonly class. In Express this is the `req` object; in PSR-7 it is `ServerRequestInterface`. Here is a minimal native implementation.

```php
<?php
declare(strict_types=1);

final readonly class Request
{
    public string $method;
    public string $path;
    public array  $query;
    public array  $body;
    public array  $headers;

    public function __construct()
    {
        $this->method  = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->path    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $this->query   = $_GET;
        $this->headers = getallheaders() ?: [];

        $raw        = file_get_contents('php://input') ?: '';
        $this->body = json_validate($raw)
            ? json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR)
            : [];
    }

    public function header(string $name): ?string
    {
        return $this->headers[$name] ?? null;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }
}
```

`readonly` properties (PHP 8.1+) make this a true value object — once constructed it cannot be mutated.

## 39.3 The `Response` Class

The `Response` class wraps PHP's header/body output functions. In Express this would be the `res` object.

```php
<?php
declare(strict_types=1);

final class Response
{
    private int   $status  = 200;
    private array $headers = [];

    public function withStatus(int $status): static
    {
        $clone         = clone $this;
        $clone->status = $status;
        return $clone;
    }

    public function withHeader(string $name, string $value): static
    {
        $clone                  = clone $this;
        $clone->headers[$name]  = $value;
        return $clone;
    }

    public function json(mixed $data): void
    {
        http_response_code($this->status);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }
        echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public function error(string $message, int $status = 400): void
    {
        $this->withStatus($status)->json([
            'error'   => true,
            'message' => $message,
        ]);
    }
}
```

## 39.4 HTTP Status Enum

PHP 8.1 backed enums are perfect for HTTP status codes. This is analogous to a TypeScript `enum` or `const` object used in an Express API.

```php
<?php
declare(strict_types=1);

enum HttpStatus: int
{
    case OK          = 200;
    case CREATED     = 201;
    case NO_CONTENT  = 204;
    case BAD_REQUEST = 400;
    case UNAUTHORIZED = 401;
    case FORBIDDEN   = 403;
    case NOT_FOUND   = 404;
    case UNPROCESSABLE = 422;
    case TOO_MANY_REQUESTS = 429;
    case INTERNAL_ERROR = 500;

    public function label(): string
    {
        return match ($this) {
            self::OK             => 'OK',
            self::CREATED        => 'Created',
            self::NOT_FOUND      => 'Not Found',
            self::UNPROCESSABLE  => 'Unprocessable Entity',
            self::INTERNAL_ERROR => 'Internal Server Error',
            default              => 'Unknown',
        };
    }
}
```

## 39.5 A Regex-Based URI Router

The router maps URI patterns to handler callables. Named capture groups in the regex become route parameters — the same mechanism Laravel and Express use internally.

```php
<?php
declare(strict_types=1);

final class Router
{
    /** @var list<array{method: string, pattern: string, handler: callable}> */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable $handler): void
    {
        // Convert :param segments to named capture groups
        $pattern = preg_replace('/:([a-zA-Z_]+)/', '(?P<$1>[^/]+)', $path);
        $pattern = '@^' . $pattern . '$@';

        $this->routes[] = [
            'method'  => $method,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $req, Response $res): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $req->method) {
                continue;
            }

            if (!preg_match($route['pattern'], $req->path, $matches)) {
                continue;
            }

            // Extract named captures as route params
            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            ($route['handler'])($req, $res, $params);
            return;
        }

        $res->withStatus(404)->json([
            'error'   => true,
            'message' => "Route not found: {$req->method} {$req->path}",
        ]);
    }
}
```

## 39.6 Middleware Pipeline

A middleware is a callable that receives the request, performs some action, and either short-circuits the response or calls the next middleware. This is identical to Express middleware.

```php
<?php
declare(strict_types=1);

final class Pipeline
{
    /** @var list<callable> */
    private array $middleware = [];

    public function pipe(callable $middleware): static
    {
        $this->middleware[] = $middleware;
        return $this;
    }

    public function run(Request $req, Response $res, callable $final): void
    {
        $chain = $final;

        foreach (array_reverse($this->middleware) as $mw) {
            $next  = $chain;
            $chain = fn() => $mw($req, $res, $next);
        }

        $chain();
    }
}

// Example middleware: JSON auth token check
$authMiddleware = function (Request $req, Response $res, callable $next): void {
    $token = $req->header('Authorization');
    if ($token !== 'Bearer secret-token') {
        $res->withStatus(401)->json(['error' => true, 'message' => 'Unauthorized']);
        return;
    }
    $next();
};
```

## 39.7 Wiring It All Together

```php
<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$req    = new Request();
$res    = new Response();
$router = new Router();

// Route definitions
$router->get('/users', function (Request $req, Response $res, array $params): void {
    $res->json(['users' => [['id' => 1, 'name' => 'Charlie']]]);
});

$router->post('/users', function (Request $req, Response $res, array $params): void {
    $name = $req->input('name');
    if (!is_string($name) || trim($name) === '') {
        $res->withStatus(422)->json(['error' => true, 'message' => 'name is required']);
        return;
    }
    $res->withStatus(201)->json(['id' => 2, 'name' => trim($name)]);
});

$router->get('/users/:id', function (Request $req, Response $res, array $params): void {
    $res->json(['id' => (int)$params['id'], 'name' => 'Charlie']);
});

$router->dispatch($req, $res);
```

## Key Takeaways

- The front controller pattern routes all requests through a single `index.php`, configured at the web server level — identical to Express's single `app.js` entry point.
- `Request` and `Response` are value objects that wrap PHP's superglobals; `readonly` prevents accidental mutation.
- Named regex capture groups (`(?P<id>[^/]+)`) are the mechanism behind every PHP router's `:param` syntax.
- A middleware pipeline is simply a chain of callables, each calling `$next()` to continue or returning early to short-circuit.
- Back HTTP status codes with a backed enum to eliminate magic integers throughout your codebase.
- PHP 8.1's `readonly` class properties enforce immutability without extra boilerplate.

## What's Next

Chapter 40 covers automated testing with PHPUnit and Pest — unit tests, mocks, data providers, and a mini Pest-style test runner built with closures.
