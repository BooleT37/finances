BEGIN;

-- Trigram similarity for matching imported bank descriptions to past ones
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;
