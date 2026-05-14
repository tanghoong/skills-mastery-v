# Chapter 44 — Laravel (High-Level Tour)

> **Goal:** Understand the shape of a Laravel application — its conventions, the key subsystems you will touch daily, and when Laravel is the right tool for the job.

## 44.1 What Laravel Is

Laravel is the most-used PHP framework. It trades explicit configuration for convention: follow the naming rules and the framework wires things up for you. Coming from Node.js, the closest mental model is Express with every ecosystem decision already made — ORM, queues, auth, mail, broadcasting, jobs, and more are all first-party packages.

```bash
composer create-project laravel/laravel my-app
cd my-app
php artisan serve   # development server on :8000
```

## 44.2 Routing

Routes live in `routes/web.php` (HTML) and `routes/api.php` (JSON). The `Route` facade registers handlers:

```php
<?php
// routes/api.php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{post}', [PostController::class, 'show']); // route model binding

// Closure route — fine for small endpoints
Route::get('/ping', fn() => response()->json(['pong' => true]));

// Resource routes — generates index/create/store/show/edit/update/destroy
Route::apiResource('users', UserController::class);
```

Route model binding is Laravel's most ergonomic feature: type-hinting `Post $post` in a controller method automatically queries the database and returns a 404 if not found.

## 44.3 Eloquent ORM

Eloquent maps database tables to PHP classes. A model file is intentionally short:

```php
<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $fillable = ['name', 'email', 'role'];
    protected $hidden   = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'role'              => UserRole::class, // backed enum cast
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

Query builder chains are lazy until you call a terminating method:

```php
$activeAdmins = User::where('role', 'admin')
    ->where('email_verified_at', '!=', null)
    ->orderBy('name')
    ->with('posts')          // eager-load to prevent N+1
    ->paginate(20);
```

Migrations define schema as code:

```bash
php artisan make:migration create_posts_table
php artisan migrate
php artisan migrate:rollback
```

## 44.4 Blade Templates

Blade compiles to plain PHP. It looks similar to Twig but lives inside Laravel's ecosystem:

```blade
{{-- resources/views/posts/index.blade.php --}}
@extends('layouts.app')

@section('title', 'All Posts')

@section('content')
    @forelse($posts as $post)
        <article>
            <h2>{{ $post->title }}</h2>
            <p>{{ $post->excerpt }}</p>
        </article>
    @empty
        <p>No posts yet.</p>
    @endforelse

    {{ $posts->links() }}  {{-- pagination links --}}
@endsection
```

Key Blade differences from Twig: directives use `@` not `{%`; echo uses `{{ }}` for escaped and `{!! !!}` for raw; components use `<x-component-name />`.

## 44.5 Artisan CLI

Artisan is Laravel's built-in command runner. You will use it constantly:

```bash
php artisan make:model Post --migration --controller --resource
php artisan make:middleware EnsureUserIsAdmin
php artisan make:job SendWelcomeEmail
php artisan route:list
php artisan tinker   # REPL with full app context — equivalent to node REPL
php artisan queue:work --queue=default,mail
php artisan schedule:run  # cron integration point
```

You can write custom commands by extending `Illuminate\Console\Command` — the same pattern as Symfony Console (Chapter 45).

## 44.6 Queues & Jobs

A job is a class with a `handle()` method. Dispatch it to a queue and it runs asynchronously in a worker process:

```php
<?php
declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(private readonly User $user) {}

    public function handle(): void
    {
        // Mail::to($this->user)->send(new WelcomeMail($this->user));
    }
}

// Dispatch from a controller
SendWelcomeEmail::dispatch($user);
SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(5));
```

Laravel supports Redis, database, SQS, and Beanstalkd as queue backends with no code change.

## 44.7 Service Providers & the IoC Container

Service providers are the bootstrap mechanism. `AppServiceProvider::register()` binds things into the container; `boot()` runs after all providers are loaded:

```php
<?php
declare(strict_types=1);

namespace App\Providers;

use App\Contracts\PostRepository;
use App\Repositories\EloquentPostRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PostRepository::class, EloquentPostRepository::class);
    }

    public function boot(): void
    {
        // Runs after all providers — safe to use resolved services here
    }
}
```

Type-hint `PostRepository` in any controller, job, or command constructor and Laravel resolves the concrete class automatically.

## 44.8 Sanctum API Authentication

Sanctum provides token-based API auth with almost no boilerplate:

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

```php
Route::post('/login', function (Request $request) {
    // validate credentials...
    $token = $user->createToken('api-token')->plainTextToken;
    return response()->json(['token' => $token]);
});

Route::middleware('auth:sanctum')->get('/me', fn(Request $r) => $r->user());
```

## Key Takeaways

- Laravel uses convention over configuration; the framework makes strong choices so you do not have to.
- Eloquent's fluent query builder with eager loading (`with()`) is the primary tool for database access.
- Route model binding, Artisan code generators, and Tinker dramatically reduce boilerplate.
- Jobs + Queues are first-class: decoupling slow work (email, PDF generation) is one line.
- Service providers are the extension point for binding services, registering macros, and booting packages.

## What's Next

Chapter 45 tours Symfony — a more explicit, configuration-heavy framework that prioritises raw flexibility and is the foundation many other PHP projects (including Drupal and API Platform) are built on.
