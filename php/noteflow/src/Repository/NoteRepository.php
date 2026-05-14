<?php

declare(strict_types=1);

namespace NoteFlow\Repository;

interface NoteRepository
{
    /**
     * Return all notes for the given user, ordered by updated_at DESC.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findAll(int $userId): array;

    /**
     * Return a single note row by primary key, or null if not found.
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array;

    /**
     * Persist a new note row and return its newly assigned ID.
     *
     * @param array<string, mixed> $data
     */
    public function save(array $data): int;

    /**
     * Apply a partial update to a note row. Returns true on success.
     *
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a note row by primary key. Returns true on success.
     */
    public function delete(int $id): bool;

    /**
     * Full-text search across notes owned by the given user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function search(int $userId, string $query): array;
}
