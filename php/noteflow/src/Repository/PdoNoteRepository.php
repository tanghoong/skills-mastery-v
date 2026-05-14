<?php

declare(strict_types=1);

namespace NoteFlow\Repository;

use PDO;

class PdoNoteRepository implements NoteRepository
{
    public function __construct(private readonly PDO $pdo) {}

    /**
     * {@inheritdoc}
     */
    public function findAll(int $userId): array
    {
        // TODO: implement
        //   $stmt = $this->pdo->prepare(
        //       'SELECT * FROM notes WHERE user_id = :uid ORDER BY updated_at DESC'
        //   );
        //   $stmt->execute([':uid' => $userId]);
        //   return $stmt->fetchAll();
        return [];
    }

    /**
     * {@inheritdoc}
     */
    public function findById(int $id): ?array
    {
        // TODO: implement
        //   $stmt = $this->pdo->prepare('SELECT * FROM notes WHERE id = :id LIMIT 1');
        //   $stmt->execute([':id' => $id]);
        //   $row = $stmt->fetch();
        //   return $row !== false ? $row : null;
        return null;
    }

    /**
     * {@inheritdoc}
     */
    public function save(array $data): int
    {
        // TODO: implement
        //   $stmt = $this->pdo->prepare(
        //       'INSERT INTO notes (user_id, title, body, status, created_at, updated_at)
        //        VALUES (:user_id, :title, :body, :status, NOW(), NOW())'
        //   );
        //   $stmt->execute($data);
        //   return (int) $this->pdo->lastInsertId();
        return 0;
    }

    /**
     * {@inheritdoc}
     */
    public function update(int $id, array $data): bool
    {
        // TODO: implement
        //   Build a dynamic SET clause from $data keys, bind :id, execute.
        //   return $stmt->rowCount() > 0;
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function delete(int $id): bool
    {
        // TODO: implement
        //   $stmt = $this->pdo->prepare('DELETE FROM notes WHERE id = :id');
        //   $stmt->execute([':id' => $id]);
        //   return $stmt->rowCount() > 0;
        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function search(int $userId, string $query): array
    {
        // TODO: implement — MySQL FULLTEXT or SQLite LIKE fallback
        //   MySQL:
        //     SELECT * FROM notes
        //     WHERE user_id = :uid
        //       AND MATCH(title, body) AGAINST (:q IN BOOLEAN MODE)
        //   SQLite fallback:
        //     SELECT * FROM notes
        //     WHERE user_id = :uid
        //       AND (title LIKE :q OR body LIKE :q)
        return [];
    }
}
