<?php

declare(strict_types=1);

namespace NoteFlow\Repository;

use PDO;

class PdoUserRepository implements UserRepository
{
    public function __construct(private readonly PDO $pdo) {}

    /**
     * {@inheritdoc}
     */
    public function findByEmail(string $email): ?array
    {
        // TODO: implement
        //   $stmt = $this->pdo->prepare(
        //       'SELECT * FROM users WHERE email = :email LIMIT 1'
        //   );
        //   $stmt->execute([':email' => $email]);
        //   $row = $stmt->fetch();
        //   return $row !== false ? $row : null;
        return null;
    }

    /**
     * {@inheritdoc}
     */
    public function findById(int $id): ?array
    {
        // TODO: implement
        //   $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
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
        //       'INSERT INTO users (email, password_hash, created_at)
        //        VALUES (:email, :password_hash, NOW())'
        //   );
        //   $stmt->execute($data);
        //   return (int) $this->pdo->lastInsertId();
        return 0;
    }
}
