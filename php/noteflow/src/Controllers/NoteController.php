<?php

declare(strict_types=1);

namespace NoteFlow\Controllers;

use NoteFlow\Http\Request;
use NoteFlow\Http\Response;
use NoteFlow\Services\NoteService;

class NoteController
{
    private Response $response;

    public function __construct(private readonly NoteService $noteService)
    {
        $this->response = new Response();
    }

    /**
     * GET /notes
     * Display a paginated list of all notes for the authenticated user.
     */
    public function index(Request $req): void
    {
        // TODO: implement
        //   $userId = $_SESSION['user_id'];
        //   $notes  = $this->noteService->getAllForUser($userId);
        //   render 'notes/index.html.twig' with ['notes' => $notes]
    }

    /**
     * GET /notes/{id}
     * Display a single note.
     */
    public function show(Request $req): void
    {
        // TODO: implement
        //   $id     = (int) $req->params['id'];
        //   $userId = $_SESSION['user_id'];
        //   $result = $this->noteService->find($id, $userId);
        //   Handle Ok / Err, render 'notes/show.html.twig'
    }

    /**
     * GET /notes/new
     * Render the blank note creation form.
     */
    public function create(Request $req): void
    {
        // TODO: implement
        //   render 'notes/edit.html.twig' with ['note' => null, 'action' => '/notes']
    }

    /**
     * POST /notes
     * Validate and persist a new note.
     */
    public function store(Request $req): void
    {
        // TODO: implement
        //   $userId = $_SESSION['user_id'];
        //   $result = $this->noteService->create($userId, $req->body);
        //   On Ok: redirect to /notes/{id}
        //   On Err: re-render form with validation errors
    }

    /**
     * GET /notes/{id}/edit
     * Render the edit form populated with an existing note.
     */
    public function edit(Request $req): void
    {
        // TODO: implement
        //   $id     = (int) $req->params['id'];
        //   $userId = $_SESSION['user_id'];
        //   $result = $this->noteService->find($id, $userId);
        //   Handle Ok / Err, render 'notes/edit.html.twig'
    }

    /**
     * PUT /notes/{id}
     * Validate and apply updates to an existing note.
     */
    public function update(Request $req): void
    {
        // TODO: implement
        //   $id     = (int) $req->params['id'];
        //   $userId = $_SESSION['user_id'];
        //   $result = $this->noteService->update($id, $userId, $req->body);
        //   On Ok: redirect to /notes/{id}
        //   On Err: re-render form with validation errors
    }

    /**
     * DELETE /notes/{id}
     * Soft- or hard-delete a note.
     */
    public function destroy(Request $req): void
    {
        // TODO: implement
        //   $id     = (int) $req->params['id'];
        //   $userId = $_SESSION['user_id'];
        //   $result = $this->noteService->delete($id, $userId);
        //   On Ok: redirect to /notes
        //   On Err: respond with JSON error
    }
}
