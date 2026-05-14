<?php

declare(strict_types=1);

namespace NoteFlow\Middleware;

use NoteFlow\Http\Request;
use NoteFlow\Http\Response;

interface MiddlewareInterface
{
    public function handle(Request $req, callable $next): void;
}

class AuthMiddleware implements MiddlewareInterface
{
    public function handle(Request $req, callable $next): void
    {
        // TODO: implement — check $_SESSION for an authenticated user ID.
        //   If the session contains a valid 'user_id', call $next($req).
        //   Otherwise, redirect to /login.
        //
        // Example skeleton:
        //   if (empty($_SESSION['user_id'])) {
        //       (new Response())->redirect('/login');
        //   }
        //   $next($req);
    }
}
