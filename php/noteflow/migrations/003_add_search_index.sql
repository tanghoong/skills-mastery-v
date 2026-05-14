-- Migration: 003_add_search_index
-- Adds a full-text search index on notes(title, body) for MySQL.
-- For SQLite compatibility the application falls back to LIKE queries
-- (see PdoNoteRepository::search).

-- MySQL FULLTEXT index (InnoDB, MySQL 5.6+)
ALTER TABLE notes
    ADD FULLTEXT INDEX ft_notes_title_body (title, body);

-- SQLite-compatible fallback: plain B-Tree index on title only.
-- Uncomment this block and comment out the FULLTEXT line above when using SQLite.
--
-- CREATE INDEX IF NOT EXISTS idx_notes_title ON notes (title);
