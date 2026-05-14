<?php

declare(strict_types=1);

namespace NoteFlow\Container;

/**
 * Minimal PSR-11 ContainerInterface (inlined to avoid a Composer dependency
 * on psr/container for the scaffold; swap for the real interface once you run
 * `composer require psr/container`).
 */
interface ContainerInterface
{
    public function get(string $id): mixed;
    public function has(string $id): bool;
}

/**
 * Simple dependency injection container with singleton scope.
 *
 * Usage:
 *   $container->bind(MyService::class, fn($c) => new MyService($c->get(Dep::class)));
 *   $service = $container->get(MyService::class);  // resolved once, cached thereafter
 */
class Container implements ContainerInterface
{
    /** @var array<string, callable(Container): mixed> */
    private array $factories = [];

    /** @var array<string, mixed> */
    private array $resolved = [];

    /**
     * Register a factory for a given service identifier.
     * The factory receives this container as its only argument.
     *
     * @param callable(Container): mixed $factory
     */
    public function bind(string $id, callable $factory): void
    {
        $this->factories[$id] = $factory;
        // Clear any previously cached resolution for this id
        unset($this->resolved[$id]);
    }

    /**
     * Resolve a service by identifier.
     * The resolved instance is cached; subsequent calls return the same object.
     *
     * @throws \InvalidArgumentException if no factory is registered for $id.
     */
    public function get(string $id): mixed
    {
        if (array_key_exists($id, $this->resolved)) {
            return $this->resolved[$id];
        }

        if (!$this->has($id)) {
            throw new \InvalidArgumentException(
                "No binding registered for identifier: {$id}"
            );
        }

        $this->resolved[$id] = ($this->factories[$id])($this);

        return $this->resolved[$id];
    }

    /**
     * Returns true if a factory is registered for the given identifier.
     */
    public function has(string $id): bool
    {
        return isset($this->factories[$id]);
    }
}
