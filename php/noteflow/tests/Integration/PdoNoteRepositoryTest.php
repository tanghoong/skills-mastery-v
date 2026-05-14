<?php

declare(strict_types=1);

namespace NoteFlow\Tests\Integration;

use NoteFlow\Repository\PdoNoteRepository;
use PDO;
use PHPUnit\Framework\TestCase;

class PdoNoteRepositoryTest extends TestCase
{
    private PDO $pdo;
    private PdoNoteRepository $repository;

    protected function setUp(): void
    {
        // Use an in-memory SQLite database for fast, isolated integration tests.
        $this->pdo = new PDO('sqlite::memory:', options: [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // Create the schema required by the repository
        $this->pdo->exec(<<<'SQL'
            CREATE TABLE users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO users (email, password_hash) VALUES ('test@example.com', 'hashed');

            CREATE TABLE notes (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL,
                title      TEXT NOT NULL,
                body       TEXT NOT NULL DEFAULT '',
                status     TEXT NOT NULL DEFAULT 'draft',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        SQL);

        $this->repository = new PdoNoteRepository($this->pdo);
    }

    /**
     * Saving a note should return a positive integer ID,
     * and that same row should be retrievable by findById.
     */
    public function testSaveAndFindById(): void
    {
        $data = [
            'user_id' => 1,
            'title'   => 'Integration Test Note',
            'body'    => 'Hello from the integration test.',
            'status'  => 'draft',
        ];

        $id = $this->repository->save($data);

        $this->assertGreaterThan(0, $id, 'save() should return a positive integer ID');

        $row = $this->repository->findById($id);

        $this->assertNotNull($row, 'findById() should return the saved row');
        $this->assertSame('Integration Test Note', $row['title']);
        $this->assertSame(1, (int) $row['user_id']);
    }

    /**
     * Querying a non-existent ID should return null.
     */
    public function testFindByIdReturnsNullForMissingRow(): void
    {
        $result = $this->repository->findById(99999);
        $this->assertNull($result);
    }
}
