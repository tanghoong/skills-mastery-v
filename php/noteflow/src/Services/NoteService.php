<?php

declare(strict_types=1);

namespace NoteFlow\Services;

use NoteFlow\Ok;
use NoteFlow\Err;
use NoteFlow\Repository\NoteRepository;

// Result = Ok | Err  (see src/Result.php)

class NoteService
{
    public function __construct(private readonly NoteRepository $notes) {}

    /**
     * Return every note belonging to the given user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getAllForUser(int $userId): array
    {
        // TODO: implement
        //   return $this->notes->findAll($userId);
        return [];
    }

    /**
     * Find a single note by ID, scoped to the authenticated user.
     * Returns Err if the note does not exist or belongs to a different user.
     */
    public function find(int $id, int $userId): Ok|Err
    {
        // TODO: implement
        //   $row = $this->notes->findById($id);
        //   if ($row === null || $row['user_id'] !== $userId) {
        //       return Err::of('Note not found');
        //   }
        //   return Ok::of($row);
        return Err::of('Not implemented');
    }

    /**
     * Create a new note for the given user.
     * Validates that 'title' is present and non-empty.
     */
    public function create(int $userId, array $data): Ok|Err
    {
        // TODO: implement
        //   if (empty($data['title'])) {
        //       return Err::of('Title is required');
        //   }
        //   $id = $this->notes->save(array_merge($data, ['user_id' => $userId]));
        //   return Ok::of(['id' => $id]);
        return Err::of('Not implemented');
    }

    /**
     * Update an existing note, ensuring ownership.
     */
    public function update(int $id, int $userId, array $data): Ok|Err
    {
        // TODO: implement
        //   $existsResult = $this->find($id, $userId);
        //   if ($existsResult instanceof Err) return $existsResult;
        //   $success = $this->notes->update($id, $data);
        //   return $success ? Ok::of(true) : Err::of('Update failed');
        return Err::of('Not implemented');
    }

    /**
     * Delete a note, ensuring ownership.
     */
    public function delete(int $id, int $userId): Ok|Err
    {
        // TODO: implement
        //   $existsResult = $this->find($id, $userId);
        //   if ($existsResult instanceof Err) return $existsResult;
        //   $success = $this->notes->delete($id);
        //   return $success ? Ok::of(true) : Err::of('Delete failed');
        return Err::of('Not implemented');
    }

    /**
     * Full-text search across notes owned by the given user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function search(int $userId, string $query): array
    {
        // TODO: implement
        //   return $this->notes->search($userId, $query);
        return [];
    }
}
