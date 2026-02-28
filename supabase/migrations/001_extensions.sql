-- ============================================================
-- MIGRATION 001 — Extensions
-- Run this first. Enables PostgreSQL extensions needed
-- by the rest of the schema.
-- ============================================================

-- UUID generation (built-in in PG13+, but explicit for safety)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auto-update updated_at columns
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Fuzzy/trigram text search (for student/staff name search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Unaccent for searching names with accents
CREATE EXTENSION IF NOT EXISTS "unaccent";
