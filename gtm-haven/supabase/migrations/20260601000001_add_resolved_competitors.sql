-- Migration: add resolved_competitors to organizations
-- This stores the AI-disambiguated competitor list with verified website URLs.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS resolved_competitors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS competitor_resolution_status TEXT DEFAULT 'pending'
    CHECK (competitor_resolution_status IN ('pending', 'resolving', 'resolved', 'failed'));

-- Index for fast reads on org detail page
CREATE INDEX IF NOT EXISTS idx_organizations_resolution_status
  ON organizations (competitor_resolution_status);

COMMENT ON COLUMN organizations.resolved_competitors IS
  'AI-resolved competitor list: [{originalName, resolvedName, website, description, confidence, status}]';
COMMENT ON COLUMN organizations.competitor_resolution_status IS
  'Overall resolution status: pending | resolving | resolved | failed';
