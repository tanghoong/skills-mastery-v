<?php
declare(strict_types=1);
/**
 * Chapter 39 — REST API in Native PHP
 * PHP Mastery Exercise
 * Run: php php/exercises/chapter_39.php
 *
 * This file demonstrates the components of a native PHP REST API in CLI context.
 * In a real web deployment, public/index.php would create a Request from
 * $_SERVER / php://input and pass it through the Router.
 */

// ── TODO 1: Request readonly class ───────────────────────────────────────────
// Build a Request class that parses method, path, headers, query string,
// and JSON body. Use readonly properties (PHP 8.1+). Add a helper method
// input(string $key, mixed $default = null) to read from the JSON body.

final readonly class Request
{
    public string $method;
    public string $path;
    public array  $query;
    public array  $headers;
    public array  $body;

    public function __construct(
        string $method  = 'GET',
        string $path    = '/',
        array  $query   = [],
        array  $headers = [],
        array  $body    = [],
    ) {
        $this->method  = strtoupper($method);
        $this->path    = '/' . ltrim($path, '/');
        $this->query   = $query;
        $this->headers = $headers;
        $this->body    = $body;
    }

    /**
     * Build a Request from PHP superglobals (used in web context).
     */
    public static function fromGlobals(): self
    {
        $method  = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $path    = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $raw     = file_get_contents('php://input') ?: '';
        $body    = json_validate($raw)
            ? json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR)
            : [];

        return new self(
            method:  $method,
            path:    $path,
            query:   $_GET,
            headers: getallheaders() ?: [],
            body:    $body,
        );
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function header(string $name): ?string
    {
        return $this->headers[$name] ?? null;
    }
}

echo "=== TODO 1: Request value object ===" . PHP_EOL;

$req = new Request(
    method:  'POST',
    path:    '/users',
    headers: ['Content-Type' => 'application/json', 'Authorization' => 'Bearer token123'],
    body:    ['name' => 'Charlie', 'email' => 'charlie@example.com'],
);

echo "Method  : {$req->method}" . PHP_EOL;
echo "Path    : {$req->path}"   . PHP_EOL;
echo "Name    : " . $req->input('name', 'unknown') . PHP_EOL;
echo "Auth    : " . ($req->header('Authorization') ?? 'none') . PHP_EOL;

// ── TODO 2: Response class with json() and error() ───────────────────────────
// Build a Response class with:
//   - withStatus(int): static   — returns a clone with a new status code
//   - withHeader(string, string): static — returns a clone with a new header
//   - json(mixed $data): void   — outputs JSON (in this exercise, captures output)
//   - error(string, int): void  — wraps json() with an error payload

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
        $clone                 = clone $this;
        $clone->headers[$name] = $value;
        return $clone;
    }

    public function status(): int
    {
        return $this->status;
    }

    /**
     * In a web context this calls http_response_code() and outputs JSON.
     * Here we return the JSON string so the exercise can inspect it.
     */
    public function json(mixed $data): string
    {
        // http_response_code($this->status);
        // header('Content-Type: application/json; charset=utf-8');
        return json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    public function error(string $message, int $status = 400): string
    {
        return $this->withStatus($status)->json([
            'error'   => true,
            'message' => $message,
        ]);
    }
}

echo PHP_EOL . "=== TODO 2: Response class ===" . PHP_EOL;

$res    = new Response();
$output = $res->withStatus(201)->json(['id' => 1, 'name' => 'Charlie']);
echo "Status 201 response:" . PHP_EOL . $output . PHP_EOL;

$errOutput = $res->error('Name is required.', 422);
echo "Error response (422):" . PHP_EOL . $errOutput . PHP_EOL;

// ── TODO 3: Router with regex-based URI matching ──────────────────────────────
// Build a Router that:
//   - Stores routes as method + regex pattern + callable handler
//   - Converts :param segments to named regex capture groups
//   - Has get(), post(), put(), delete() registration methods
//   - Has dispatch(Request, Response): string that matches and calls the handler

final class Router
{
    /** @var list<array{method: string, pattern: string, handler: callable}> */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    private function add(string $method, string $path, callable $handler): void
    {
        // :param  ->  (?P<param>[^/]+)
        $pattern = (string)preg_replace('/:([a-zA-Z_]+)/', '(?P<$1>[^/]+)', $path);
        $pattern = '@^' . $pattern . '$@';

        $this->routes[] = ['method' => $method, 'pattern' => $pattern, 'handler' => $handler];
    }

    public function dispatch(Request $req, Response $res): string
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $req->method) {
                continue;
            }

            if (!preg_match($route['pattern'], $req->path, $matches)) {
                continue;
            }

            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            return ($route['handler'])($req, $res, $params);
        }

        return $res->withStatus(404)->json([
            'error'   => true,
            'message' => "Route not found: {$req->method} {$req->path}",
        ]);
    }
}

echo "=== TODO 3: Router ===" . PHP_EOL;

// ── TODO 4: HTTP status backed enum ──────────────────────────────────────────
// Define an HttpStatus backed enum with: OK=200, CREATED=201, NOT_FOUND=404,
// UNPROCESSABLE=422. Add a label(): string method using match.

enum HttpStatus: int
{
    case OK           = 200;
    case CREATED      = 201;
    case NO_CONTENT   = 204;
    case BAD_REQUEST  = 400;
    case UNAUTHORIZED = 401;
    case NOT_FOUND    = 404;
    case UNPROCESSABLE = 422;
    case INTERNAL_ERROR = 500;

    public function label(): string
    {
        return match ($this) {
            self::OK            => 'OK',
            self::CREATED       => 'Created',
            self::NO_CONTENT    => 'No Content',
            self::BAD_REQUEST   => 'Bad Request',
            self::UNAUTHORIZED  => 'Unauthorized',
            self::NOT_FOUND     => 'Not Found',
            self::UNPROCESSABLE => 'Unprocessable Entity',
            self::INTERNAL_ERROR => 'Internal Server Error',
        };
    }
}

echo PHP_EOL . "=== TODO 4: HttpStatus enum ===" . PHP_EOL;

foreach (HttpStatus::cases() as $status) {
    echo sprintf("  %d %s", $status->value, $status->label()) . PHP_EOL;
}

// ── TODO 5: Wire /users GET and POST routes with validation ───────────────────
// Using the Router from TODO 3:
//   GET  /users      — return a list of mock users
//   POST /users      — require 'name' and 'email' in body; return 422 if missing;
//                      return 201 with the new user on success
//   GET  /users/:id  — return a single user by id

echo PHP_EOL . "=== TODO 5: Route wiring ===" . PHP_EOL;

// Simulated in-memory user store
$users = [
    ['id' => 1, 'name' => 'Charlie', 'email' => 'charlie@example.com'],
    ['id' => 2, 'name' => 'Alice',   'email' => 'alice@example.com'],
];

$router = new Router();
$res    = new Response();

$router->get('/users', function (Request $req, Response $res, array $params) use (&$users): string {
    return $res->json(['users' => $users, 'total' => count($users)]);
});

$router->post('/users', function (Request $req, Response $res, array $params) use (&$users): string {
    $name  = $req->input('name');
    $email = $req->input('email');

    $errors = [];
    if (!is_string($name) || trim($name) === '') {
        $errors[] = 'name is required';
    }
    if (!is_string($email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $errors[] = 'a valid email is required';
    }

    if (count($errors) > 0) {
        return $res->withStatus(HttpStatus::UNPROCESSABLE->value)->json([
            'error'   => true,
            'message' => implode('; ', $errors),
        ]);
    }

    $newUser  = ['id' => count($users) + 1, 'name' => trim($name), 'email' => $email];
    $users[]  = $newUser;

    return $res->withStatus(HttpStatus::CREATED->value)->json($newUser);
});

$router->get('/users/:id', function (Request $req, Response $res, array $params) use (&$users): string {
    $id   = (int)$params['id'];
    $user = null;
    foreach ($users as $u) {
        if ($u['id'] === $id) {
            $user = $u;
            break;
        }
    }

    if ($user === null) {
        return $res->withStatus(HttpStatus::NOT_FOUND->value)->json([
            'error'   => true,
            'message' => "User {$id} not found.",
        ]);
    }

    return $res->json($user);
});

// Simulate requests
$scenarios = [
    new Request('GET',  '/users'),
    new Request('POST', '/users', body: ['name' => 'Bob', 'email' => 'bob@example.com']),
    new Request('POST', '/users', body: ['name' => '', 'email' => 'bad-email']),
    new Request('GET',  '/users/2'),
    new Request('GET',  '/users/99'),
];

foreach ($scenarios as $req) {
    echo PHP_EOL . "{$req->method} {$req->path}";
    if (count($req->body) > 0) {
        echo " body=" . json_encode($req->body);
    }
    echo PHP_EOL;
    echo $router->dispatch($req, new Response()) . PHP_EOL;
}
