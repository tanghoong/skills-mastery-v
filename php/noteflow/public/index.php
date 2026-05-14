<?php

declare(strict_types=1);

/**
 * NoteFlow Front Controller
 *
 * Chapter mapping:
 *   Ch. 1-2  — PHP 8.4 syntax, types, named args, fibers
 *   Ch. 3    — OOP: classes, interfaces, readonly, enums
 *   Ch. 4    — Autoloading, Composer, PSR-4
 *   Ch. 5    — Routing, HTTP request/response cycle
 *   Ch. 6    — Dependency Injection, service container
 *   Ch. 7    — PDO, repositories, database abstraction
 *   Ch. 8    — Twig templating
 *   Ch. 9    — Middleware pipeline
 *   Ch. 10   — Session, authentication, CSRF
 *   Ch. 11   — Forms, validation, error handling
 *   Ch. 12   — File uploads, storage
 *   Ch. 13   — REST JSON responses
 *   Ch. 14   — Result pattern, typed error handling
 *   Ch. 15   — CLI tooling, migrations
 *   Ch. 16   — Testing with PHPUnit + Pest
 *   Ch. 17   — Search, full-text indexing
 *   Ch. 18   — Deployment, environment config
 */

// 1. Bootstrap autoloader
require_once dirname(__DIR__) . '/vendor/autoload.php';

// 2. Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

// 3. Start session
$sessionName = $_ENV['SESSION_NAME'] ?? 'noteflow_session';
session_name($sessionName);
session_start();

// 4. Build DI container
$container = new NoteFlow\Container\Container();

$container->bind(\PDO::class, fn() => NoteFlow\Database\Connection::create());

$container->bind(NoteFlow\Repository\NoteRepository::class, fn($c) =>
    new NoteFlow\Repository\PdoNoteRepository($c->get(\PDO::class))
);

$container->bind(NoteFlow\Repository\UserRepository::class, fn($c) =>
    new NoteFlow\Repository\PdoUserRepository($c->get(\PDO::class))
);

$container->bind(NoteFlow\Services\NoteService::class, fn($c) =>
    new NoteFlow\Services\NoteService($c->get(NoteFlow\Repository\NoteRepository::class))
);

$container->bind(NoteFlow\Services\AuthService::class, fn($c) =>
    new NoteFlow\Services\AuthService($c->get(NoteFlow\Repository\UserRepository::class))
);

$container->bind(NoteFlow\Controllers\NoteController::class, fn($c) =>
    new NoteFlow\Controllers\NoteController($c->get(NoteFlow\Services\NoteService::class))
);

$container->bind(NoteFlow\Controllers\AuthController::class, fn($c) =>
    new NoteFlow\Controllers\AuthController($c->get(NoteFlow\Services\AuthService::class))
);

// 5. Build router and define routes
$router = new NoteFlow\Http\Router($container);

// Auth routes
$router->get('/login',    [NoteFlow\Controllers\AuthController::class, 'showLogin']);
$router->post('/login',   [NoteFlow\Controllers\AuthController::class, 'login']);
$router->get('/logout',   [NoteFlow\Controllers\AuthController::class, 'logout']);
$router->get('/register', [NoteFlow\Controllers\AuthController::class, 'showRegister']);
$router->post('/register',[NoteFlow\Controllers\AuthController::class, 'register']);

// Note routes (protected)
$router->get('/notes',              [NoteFlow\Controllers\NoteController::class, 'index'],   [NoteFlow\Middleware\AuthMiddleware::class]);
$router->get('/notes/new',          [NoteFlow\Controllers\NoteController::class, 'create'],  [NoteFlow\Middleware\AuthMiddleware::class]);
$router->post('/notes',             [NoteFlow\Controllers\NoteController::class, 'store'],   [NoteFlow\Middleware\AuthMiddleware::class, NoteFlow\Middleware\CsrfMiddleware::class]);
$router->get('/notes/{id}',         [NoteFlow\Controllers\NoteController::class, 'show'],    [NoteFlow\Middleware\AuthMiddleware::class]);
$router->get('/notes/{id}/edit',    [NoteFlow\Controllers\NoteController::class, 'edit'],    [NoteFlow\Middleware\AuthMiddleware::class]);
$router->put('/notes/{id}',         [NoteFlow\Controllers\NoteController::class, 'update'],  [NoteFlow\Middleware\AuthMiddleware::class, NoteFlow\Middleware\CsrfMiddleware::class]);
$router->delete('/notes/{id}',      [NoteFlow\Controllers\NoteController::class, 'destroy'], [NoteFlow\Middleware\AuthMiddleware::class, NoteFlow\Middleware\CsrfMiddleware::class]);

// 6. Dispatch the request
$request = NoteFlow\Http\Request::fromGlobals();
$router->dispatch($request);
