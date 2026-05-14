<?php

declare(strict_types=1);

namespace NoteFlow\Domain;

readonly class Note
{
    /**
     * PHP 8.4 constructor property promotion with property hooks.
     *
     * The `excerpt` virtual property (read-only hook) returns the first 100
     * characters of the body — no extra method needed.
     */
    public string $excerpt {
        get => mb_substr($this->body, 0, 100);
    }

    public function __construct(
        public int                $id,
        public int                $userId,
        public string             $title,
        public string             $body,
        public array              $tags,
        public NoteStatus         $status,
        public \DateTimeImmutable $createdAt,
        public \DateTimeImmutable $updatedAt,
    ) {}

    /**
     * Reconstruct a Note domain object from a raw database row.
     *
     * @param array<string, mixed> $row
     */
    public static function fromArray(array $row): self
    {
        // TODO: implement
        //   return new self(
        //       id:        (int) $row['id'],
        //       userId:    (int) $row['user_id'],
        //       title:     $row['title'],
        //       body:      $row['body'],
        //       tags:      json_decode($row['tags'] ?? '[]', true),
        //       status:    NoteStatus::from($row['status']),
        //       createdAt: new \DateTimeImmutable($row['created_at']),
        //       updatedAt: new \DateTimeImmutable($row['updated_at']),
        //   );
        throw new \RuntimeException('Not implemented');
    }
}
