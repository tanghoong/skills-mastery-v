-- Migration: 002_create_notes
-- Creates the notes table and note_tags junction table.

CREATE TABLE IF NOT EXISTS notes (
    id         INT UNSIGNED                                    NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED                                    NOT NULL,
    title      VARCHAR(255)                                    NOT NULL,
    body       LONGTEXT                                        NOT NULL DEFAULT '',
    status     ENUM('draft', 'published', 'archived')         NOT NULL DEFAULT 'draft',
    created_at DATETIME                                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME                                        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_notes_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    KEY idx_notes_user_id (user_id),
    KEY idx_notes_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags are stored as a separate normalised table to support efficient filtering.
CREATE TABLE IF NOT EXISTS tags (
    id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    name VARCHAR(100)  NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table linking notes to their tags (many-to-many).
CREATE TABLE IF NOT EXISTS note_tags (
    note_id INT UNSIGNED NOT NULL,
    tag_id  INT UNSIGNED NOT NULL,

    PRIMARY KEY (note_id, tag_id),
    CONSTRAINT fk_note_tags_note FOREIGN KEY (note_id)
        REFERENCES notes (id) ON DELETE CASCADE,
    CONSTRAINT fk_note_tags_tag  FOREIGN KEY (tag_id)
        REFERENCES tags  (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
