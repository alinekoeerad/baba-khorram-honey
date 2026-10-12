-- ===============================================================
-- Raw SQL Migration Extras (PostgreSQL Trigram, FTS & Constraints)
-- ===============================================================

-- 1) Enable pg_trgm extension for fuzzy Persian text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) GIN Trigram indexes on searchText columns
CREATE INDEX IF NOT EXISTS products_search_text_trgm_idx ON "products" USING GIN ("searchText" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipes_search_text_trgm_idx ON "recipes" USING GIN ("searchText" gin_trgm_ops);

-- 3) GIN Full-Text Search (FTS) indexes on searchText using 'simple' configuration
CREATE INDEX IF NOT EXISTS products_search_text_fts_idx ON "products" USING GIN (to_tsvector('simple', "searchText"));
CREATE INDEX IF NOT EXISTS recipes_search_text_fts_idx ON "recipes" USING GIN (to_tsvector('simple', "searchText"));

-- 4) Domain constraints
-- Section item must point to exactly one of product or recipe
ALTER TABLE "section_items"
  DROP CONSTRAINT IF EXISTS section_items_one_target_chk,
  ADD CONSTRAINT section_items_one_target_chk
  CHECK (("productId" IS NOT NULL)::int + ("recipeId" IS NOT NULL)::int = 1);

-- SiteSettings must remain a singleton row (id = 1)
ALTER TABLE "site_settings"
  DROP CONSTRAINT IF EXISTS site_settings_single_row_chk,
  ADD CONSTRAINT site_settings_single_row_chk
  CHECK (id = 1);
