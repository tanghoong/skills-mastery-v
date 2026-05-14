<?php

declare(strict_types=1);

namespace NoteFlow\Http;

class Response
{
    /**
     * Send a JSON response and terminate the script.
     */
    public function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send an HTTP redirect and terminate the script.
     */
    public function redirect(string $url): void
    {
        header('Location: ' . $url, true, 302);
        exit;
    }

    /**
     * Send an HTML response and terminate the script.
     */
    public function html(string $content, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        echo $content;
        exit;
    }
}
