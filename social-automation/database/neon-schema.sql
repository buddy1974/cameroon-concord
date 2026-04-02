-- Concord Social Automation Schema
-- PostgreSQL / Neon

-- ============================================================
-- TRIGGER FUNCTION: auto-update updated_at on row changes
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE 1: ingested_content
-- Raw intake from all sources (Google News, Cameroon sites,
-- Telegram). Nothing is published without passing through here.
-- ============================================================

CREATE TABLE ingested_content (
  id             SERIAL PRIMARY KEY,
  source_name    VARCHAR(100)  NOT NULL,
  source_url     TEXT,
  content_hash   VARCHAR(64)   NOT NULL UNIQUE,
  raw_title      TEXT,
  raw_body       TEXT,
  raw_image_url  TEXT,
  language       VARCHAR(10)   NOT NULL DEFAULT 'en',
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending',
  reject_reason  TEXT,
  ingested_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: social_posts
-- AI-processed posts ready for publishing.
-- One row per platform per story.
-- ============================================================

CREATE TABLE social_posts (
  id                       SERIAL PRIMARY KEY,
  ingested_id              INT           REFERENCES ingested_content(id),
  platform                 VARCHAR(20)   NOT NULL,
  caption                  TEXT          NOT NULL,
  hashtags                 TEXT,
  image_url                TEXT,
  image_source             VARCHAR(20),
  image_moderation_status  VARCHAR(20)   NOT NULL DEFAULT 'pending',
  blur_applied             BOOLEAN       NOT NULL DEFAULT FALSE,
  blur_strength            VARCHAR(10),
  status                   VARCHAR(20)   NOT NULL DEFAULT 'pending',
  scheduled_at             TIMESTAMPTZ,
  published_at             TIMESTAMPTZ,
  platform_post_id         TEXT,
  error_message            TEXT,
  retry_count              INT           NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE 3: social_comments
-- Engagement tracking. Facebook only for now.
-- ============================================================

CREATE TABLE social_comments (
  id                   SERIAL PRIMARY KEY,
  post_id              INT           REFERENCES social_posts(id),
  platform             VARCHAR(20)   NOT NULL DEFAULT 'facebook',
  platform_comment_id  TEXT          NOT NULL UNIQUE,
  commenter_name       TEXT,
  comment_text         TEXT,
  reply_text           TEXT,
  replied              BOOLEAN       NOT NULL DEFAULT FALSE,
  replied_at           TIMESTAMPTZ,
  fetched_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: social_rotation
-- Tracks per-platform per-category posting cadence.
-- Prevents flooding. posts_today reset daily by cron.
-- ============================================================

CREATE TABLE social_rotation (
  id             SERIAL PRIMARY KEY,
  platform       VARCHAR(20)   NOT NULL,
  category       VARCHAR(100),
  last_posted_at TIMESTAMPTZ,
  posts_today    INT           NOT NULL DEFAULT 0,
  daily_limit    INT           NOT NULL DEFAULT 5,
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_ingested_status        ON ingested_content(status);
CREATE INDEX idx_ingested_hash          ON ingested_content(content_hash);
CREATE INDEX idx_posts_status_scheduled ON social_posts(status, scheduled_at);
CREATE INDEX idx_posts_platform         ON social_posts(platform);
CREATE INDEX idx_comments_replied       ON social_comments(replied);
