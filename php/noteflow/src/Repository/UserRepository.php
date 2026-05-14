<?php

declare(strict_types=1);

namespace NoteFlow\Repository;

interface UserRepository
{
    /**
     * Find a user row by email address, or return null if not found.
     *
     * @return array<string, mixed>|null
     */
    public function findByEmail(string $email): ?array;

    /**
     * Find a user row by primary key, or return null if not found.
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array;

    /**
     * Persist a new user row and return its newly assigned ID.
     *
     * @param array<string, mixed> $data Must include 'email' and 'password_hash'.
     */
    public function save(array $data): int;
}
