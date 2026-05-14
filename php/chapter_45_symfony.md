# Chapter 45 — Symfony (High-Level Tour)

> **Goal:** Understand Symfony's explicit, component-driven architecture — its DI container, HttpFoundation, Doctrine, Console, EventDispatcher, and Security — and know when to reach for it over Laravel.

## 45.1 What Symfony Is

Symfony is a set of reusable PHP components bundled into a full-stack framework. Its design philosophy is the opposite of Laravel's: everything is explicit. Configuration is YAML or PHP attributes; the DI container is compiled to plain PHP at build time; conventions exist but are never hidden. If Laravel is Rails, Symfony is Spring.

Many major PHP projects are built on Symfony components: Drupal, API Platform, Shopware, Magento 2 (partially), and Laravel itself (uses several Symfony components under the hood).

```bash
composer create-project symfony/skeleton my-app
cd my-app
composer require webapp    # adds Twig, Doctrine, security, form, and more
symfony server:start
```

## 45.2 The Dependency Injection Container

Symfony's DI container is the framework's centrepiece. Services are registered in `config/services.yaml` or via PHP attributes:

```yaml
# config/services.yaml
services:
    _defaults:
        autowire: true       # auto-inject constructor dependencies
        autoconfigure: true  # auto-tag services by interface

    App\:
        resource: '../src/'
        exclude: '../src/{Entity,Migrations}'
```

With `autowire: true`, any class in `src/` is automatically resolved. Type-hint a dependency in a constructor and Symfony finds the implementation:

```php
<?php
declare(strict_types=1);

namespace App\Service;

use App\Repository\PostRepository;
use Psr\Log\LoggerInterface;

final class PostPublisher
{
    public function __construct(
        private readonly PostRepository $posts,
        private readonly LoggerInterface $logger,
    ) {}

    public function publish(int $postId): void
    {
        $post = $this->posts->find($postId);
        $post->publishedAt = new \DateTimeImmutable();
        $this->posts->save($post);
        $this->logger->info('Post published', ['id' => $postId]);
    }
}
```

The container is compiled to cached PHP in production — lookup is zero-overhead.

## 45.3 HttpFoundation

`HttpFoundation` is Symfony's abstraction over PHP's superglobals (`$_GET`, `$_POST`, `$_SERVER`, `$_FILES`). It is PSR-7-adjacent but predates PSR-7 and has its own interface:

```php
<?php
declare(strict_types=1);

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

$request = Request::createFromGlobals();

// Type-safe access — no raw superglobals
$page  = $request->query->getInt('page', 1);
$email = $request->request->get('email', '');
$token = $request->headers->get('Authorization', '');

return new JsonResponse(['page' => $page], status: 200);
```

Controllers in a Symfony app are plain classes with methods that receive a `Request` and return a `Response`:

```php
#[Route('/posts/{id}', methods: ['GET'])]
public function show(int $id, PostRepository $repo): JsonResponse
{
    $post = $repo->find($id) ?? throw $this->createNotFoundException();
    return $this->json($post);
}
```

## 45.4 Doctrine ORM

Doctrine is to Symfony what Eloquent is to Laravel, but with a different design philosophy: the Data Mapper pattern rather than Active Record. Entities are plain PHP objects; the EntityManager is the explicit unit-of-work.

```php
<?php
declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PostRepository::class)]
#[ORM\Table(name: 'posts')]
class Post
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(type: 'text')]
    private string $body = '';
}
```

```php
// In a repository or service
$em->persist($post);   // schedule for insert/update
$em->flush();          // execute all pending SQL in a transaction
```

Doctrine requires explicit `persist` + `flush` — there is no implicit saving. This makes transaction boundaries visible in code.

## 45.5 Console Component

Symfony's Console powers `php bin/console` in the same way Artisan powers Laravel. Write a command by extending `Command`:

```php
<?php
declare(strict_types=1);

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:greet', description: 'Greet a user')]
final class GreetCommand extends Command
{
    protected function configure(): void
    {
        $this->addArgument('name', InputArgument::REQUIRED, 'The name to greet');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $name = $input->getArgument('name');
        $output->writeln("<info>Hello, {$name}!</info>");
        return Command::SUCCESS;
    }
}
```

Register it as a service (auto-tagged via `autoconfigure`) and run:

```bash
php bin/console app:greet Alice
```

## 45.6 EventDispatcher

Symfony's EventDispatcher implements the Observer pattern. It decouples the thing that happens from the things that react:

```php
<?php
declare(strict_types=1);

use Symfony\Component\EventDispatcher\EventDispatcher;
use Symfony\Component\EventDispatcher\GenericEvent;

$dispatcher = new EventDispatcher();

$dispatcher->addListener('post.published', function (GenericEvent $event): void {
    $post = $event->getSubject();
    echo "Sending notification for: {$post['title']}\n";
});

$dispatcher->addListener('post.published', function (GenericEvent $event): void {
    echo "Purging CDN cache...\n";
}, priority: 10); // higher priority runs first

$dispatcher->dispatch(new GenericEvent(['title' => 'My Post']), 'post.published');
```

Symfony's own components — Security, HttpKernel, Doctrine — emit events through the same dispatcher, so you can hook into framework lifecycle events without subclassing anything.

## 45.7 Security Component

Symfony Security handles authentication and authorisation through a layered firewall system configured in `config/packages/security.yaml`. Key concepts:

- **Firewall**: decides which parts of your app require authentication.
- **Authenticator**: reads credentials (JWT header, form login, API key) and produces a `Passport`.
- **Voter**: decides whether a user can perform an action on a specific object.

```php
// In a controller — attribute-based access control
#[IsGranted('POST_EDIT', subject: 'post')]
public function edit(Post $post): Response { ... }
```

The Voter pattern lets you write `PostVoter::canEdit(User $user, Post $post): bool` with full business logic, rather than scattering permission checks through controllers.

## Key Takeaways

- Symfony's DI container is compiled and cached — it is fast and forces explicit service definitions.
- HttpFoundation wraps superglobals in typed objects; use it instead of `$_GET`/`$_POST` directly.
- Doctrine's Data Mapper pattern makes transaction boundaries explicit — good for complex domains.
- EventDispatcher decouples producers from consumers without framework-specific coupling.
- Choose Symfony when you need fine-grained control, are building a long-lived enterprise app, or are extending an existing Symfony-based project.

## What's Next

Chapter 46 covers microframeworks: Slim 4 and Lumen — the right choice when you need PSR-7 middleware pipelines without the weight of a full framework.
