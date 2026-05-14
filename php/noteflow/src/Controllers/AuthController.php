<?php

declare(strict_types=1);

namespace NoteFlow\Controllers;

use NoteFlow\Http\Request;
use NoteFlow\Http\Response;
use NoteFlow\Services\AuthService;

class AuthController
{
    private Response $response;

    public function __construct(private readonly AuthService $authService)
    {
        $this->response = new Response();
    }

    /**
     * GET /login
     * Render the login form.
     */
    public function showLogin(Request $req): void
    {
        // TODO: implement
        //   render 'auth/login.html.twig' with flash errors if present
    }

    /**
     * POST /login
     * Validate credentials and create a session.
     */
    public function login(Request $req): void
    {
        // TODO: implement
        //   $email    = $req->body['email']    ?? '';
        //   $password = $req->body['password'] ?? '';
        //   $result   = $this->authService->login($email, $password);
        //   On Ok: set $_SESSION['user_id'], redirect to /notes
        //   On Err: set flash error, redirect to /login
    }

    /**
     * GET /logout
     * Destroy the session and redirect to login.
     */
    public function logout(Request $req): void
    {
        // TODO: implement
        //   $this->authService->logout();
        //   session_destroy();
        //   redirect to /login
    }

    /**
     * GET /register
     * Render the registration form.
     */
    public function showRegister(Request $req): void
    {
        // TODO: implement
        //   render 'auth/register.html.twig'
    }

    /**
     * POST /register
     * Create a new user account.
     */
    public function register(Request $req): void
    {
        // TODO: implement
        //   $email    = $req->body['email']    ?? '';
        //   $password = $req->body['password'] ?? '';
        //   $result   = $this->authService->register($email, $password);
        //   On Ok: redirect to /login with a success flash
        //   On Err: re-render form with error message
    }
}
