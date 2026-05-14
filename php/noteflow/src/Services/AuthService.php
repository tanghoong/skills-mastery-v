<?php

declare(strict_types=1);

namespace NoteFlow\Services;

use NoteFlow\Ok;
use NoteFlow\Err;
use NoteFlow\Repository\UserRepository;

// Result = Ok | Err  (see src/Result.php)

class AuthService
{
    public function __construct(private readonly UserRepository $users) {}

    /**
     * Register a new user account.
     *
     * Validates the email format and that the password meets minimum length.
     * Hashes the password with PASSWORD_BCRYPT before persisting.
     */
    public function register(string $email, string $password): Ok|Err
    {
        // TODO: implement
        //   if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        //       return Err::of('Invalid email address');
        //   }
        //   if (strlen($password) < 8) {
        //       return Err::of('Password must be at least 8 characters');
        //   }
        //   if ($this->users->findByEmail($email) !== null) {
        //       return Err::of('Email already registered');
        //   }
        //   $hash = password_hash($password, PASSWORD_BCRYPT);
        //   $id   = $this->users->save(['email' => $email, 'password_hash' => $hash]);
        //   return Ok::of(['id' => $id, 'email' => $email]);
        return Err::of('Not implemented');
    }

    /**
     * Validate credentials and return user data on success.
     */
    public function login(string $email, string $password): Ok|Err
    {
        // TODO: implement
        //   $user = $this->users->findByEmail($email);
        //   if ($user === null || !password_verify($password, $user['password_hash'])) {
        //       return Err::of('Invalid email or password');
        //   }
        //   return Ok::of($user);
        return Err::of('Not implemented');
    }

    /**
     * Terminate the current user session.
     */
    public function logout(): void
    {
        // TODO: implement
        //   unset($_SESSION['user_id']);
        //   session_regenerate_id(true);
    }
}
