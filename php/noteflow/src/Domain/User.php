<?php

declare(strict_types=1);

namespace NoteFlow\Domain;

readonly class User
{
    public function __construct(
        public int                $id,
        public string             $email,
        public string             $passwordHash,
        public \DateTimeImmutable $createdAt,
    ) {}

    /**
     * Reconstruct a User domain object from a raw database row.
     *
     * @param array<string, mixed> $row
     */
    public static function fromArray(array $row): self
    {
        // TODO: implement
        //   return new self(
        //       id:           (int) $row['id'],
        //       email:        $row['email'],
        //       passwordHash: $row['password_hash'],
        //       createdAt:    new \DateTimeImmutable($row['created_at']),
        //   );
        throw new \RuntimeException('Not implemented');
    }
}
