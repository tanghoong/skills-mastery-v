<?php
declare(strict_types=1);

/**
 * Chapter 14 — Attributes & Reflection
 * PHP Mastery Exercise
 *
 * Run: php php/exercises/chapter_14.php
 */

// ── TODO 1: Define #[Route] attribute ────────────────────────────────────────
// Create attribute class Route (target: methods only) with:
//   - public readonly string $path
//   - public readonly string $method = 'GET'
// Use constructor promotion.

// your code here


// ── TODO 2: Apply #[Route] to UserController ─────────────────────────────────
// Create class UserController with at least three public methods:
//   - index()   → #[Route('/users', 'GET')]
//   - store()   → #[Route('/users', 'POST')]
//   - destroy() → #[Route('/users/{id}', 'DELETE')]
// Method bodies can be empty or print a placeholder message.

// your code here


// ── TODO 3: Read Route attributes via ReflectionClass ────────────────────────
// Use ReflectionClass on UserController.
// Loop over getMethods() and for each method call getAttributes(Route::class).
// For each attribute, call newInstance() and print:
//   "{method} {path} => {controllerMethod}()"
// e.g. "GET /users => index()"

// your code here


// ── TODO 4: Inspect property visibility via ReflectionProperty ───────────────
// Create a class Invoice with at least one public, one protected, and one private property
// (use constructor promotion with mixed visibility for brevity).
//
// Use ReflectionClass::getProperties() to iterate and print for each property:
//   "{visibility}[ readonly] {type} ${name}"
// e.g. "public readonly int $id"
//      "protected string $description"
//      "private float $amount"

// your code here


// ── TODO 5: AnnotationReader returning all route definitions ──────────────────
// Build class AnnotationReader with method:
//   getRoutes(string $controllerClass): array
//   → returns array<array{path: string, method: string, handler: string}>
//     where handler is "ClassName::methodName"
//
// Apply at least one additional controller (ArticleController) with two or three
// #[Route] attributes on its methods.
//
// Instantiate AnnotationReader, call getRoutes() for both controllers,
// merge the results, and print each route in a formatted table:
//   METHOD   PATH                   HANDLER
//   GET      /users                 UserController::index
//   ...

// your code here
