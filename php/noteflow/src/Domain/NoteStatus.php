<?php

declare(strict_types=1);

namespace NoteFlow\Domain;

enum NoteStatus: string
{
    case Draft     = 'draft';
    case Published = 'published';
    case Archived  = 'archived';

    /**
     * Return a human-readable label for use in templates and UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft     => 'Draft',
            self::Published => 'Published',
            self::Archived  => 'Archived',
        };
    }

    /**
     * Return a CSS class name suitable for status badge styling.
     */
    public function badgeClass(): string
    {
        return match ($this) {
            self::Draft     => 'badge-secondary',
            self::Published => 'badge-success',
            self::Archived  => 'badge-warning',
        };
    }
}
