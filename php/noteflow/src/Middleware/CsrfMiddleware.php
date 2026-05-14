<?php

declare(strict_types=1);

namespace NoteFlow\Middleware;

use NoteFlow\Http\Request;
use NoteFlow\Http\Response;

class CsrfMiddleware implements MiddlewareInterface
{
    /** HTTP methods that mutate state and therefore require a valid CSRF token. */
    private const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $req, callable $next): void
    {
        // TODO: implement CSRF token validation.
        //
        // Algorithm:
        //   1. If the request method is NOT in PROTECTED_METHODS, call $next($req) immediately.
        //   2. Read the submitted token from $req->body['_csrf_token'] (or the
        //      X-CSRF-Token header for AJAX requests).
        //   3. Compare it (using hash_equals) against $_SESSION['csrf_token'].
        //   4. On mismatch: respond with a 403 JSON error and exit.
        //   5. On match: call $next($req).
        //
        // Token generation (called during session init in the front controller):
        //   $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}
