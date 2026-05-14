<?php

declare(strict_types=1);

namespace NoteFlow\Tests\Unit;

use NoteFlow\Ok;
use NoteFlow\Err;
use NoteFlow\Repository\NoteRepository;
use NoteFlow\Services\NoteService;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class NoteServiceTest extends TestCase
{
    private NoteRepository&MockObject $repository;
    private NoteService $service;

    protected function setUp(): void
    {
        $this->repository = $this->createMock(NoteRepository::class);
        $this->service    = new NoteService($this->repository);
    }

    /**
     * When valid data (with a non-empty title) is supplied,
     * NoteService::create should delegate to the repository and return Ok.
     */
    public function testCreateReturnsOkOnSuccess(): void
    {
        $userId = 1;
        $data   = ['title' => 'My First Note', 'body' => 'Hello, world!', 'status' => 'draft'];

        $this->repository
            ->expects($this->once())
            ->method('save')
            ->with($this->callback(fn($arg) => isset($arg['user_id']) && $arg['user_id'] === $userId))
            ->willReturn(42);

        $result = $this->service->create($userId, $data);

        $this->assertInstanceOf(Ok::class, $result);
        $this->assertSame(42, $result->value['id']);
    }

    /**
     * When the title is missing or empty,
     * NoteService::create should return Err without touching the repository.
     */
    public function testCreateReturnsErrOnMissingTitle(): void
    {
        $userId = 1;
        $data   = ['title' => '', 'body' => 'Some body text'];

        $this->repository
            ->expects($this->never())
            ->method('save');

        $result = $this->service->create($userId, $data);

        $this->assertInstanceOf(Err::class, $result);
        $this->assertStringContainsStringIgnoringCase('title', $result->error);
    }
}
