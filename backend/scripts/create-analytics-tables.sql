-- Migration: Create Analytics Tables
-- Date: 2026-03-26
-- Description: Creates tables for user activity tracking system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE event_type_enum AS ENUM (
  'authentication',
  'puzzle',
  'quest',
  'profile',
  'social',
  'achievement',
  'category',
  'other'
);

CREATE TYPE event_category_enum AS ENUM (
  'login', 'logout', 'signup', 'password_reset_request', 'password_reset_complete',
  'puzzle_started', 'puzzle_submitted', 'puzzle_completed', 'puzzle_hint_viewed', 'puzzle_skipped',
  'daily_quest_viewed', 'daily_quest_progress_updated', 'daily_quest_completed', 'daily_quest_claimed',
  'category_viewed', 'category_filtered', 'puzzle_list_viewed',
  'profile_updated', 'profile_picture_uploaded', 'preferences_updated', 'privacy_settings_changed',
  'friend_request_sent', 'friend_request_accepted', 'challenge_sent', 'challenge_accepted', 'challenge_completed',
  'achievement_unlocked', 'points_earned', 'points_redeemed', 'streak_milestone_reached',
  'page_view', 'api_call', 'error'
);

CREATE TYPE device_type_enum AS ENUM ('desktop', 'mobile', 'tablet', 'unknown');

CREATE TYPE platform_type_enum AS ENUM ('web', 'mobile_web', 'pwa', 'api');

CREATE TYPE consent_status_enum AS ENUM ('opted-in', 'opted-out', 'not-set');

-- User Activities Table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "sessionId" UUID NOT NULL,
  "eventType" event_type_enum NOT NULL,
  "eventCategory" event_category_enum NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "duration" BIGINT DEFAULT 0,
  "metadata" JSONB,
  "browser" VARCHAR(100),
  "os" VARCHAR(100),
  "deviceType" device_type_enum DEFAULT 'unknown',
  "platform" platform_type_enum DEFAULT 'web',
  "country" VARCHAR(2),
  "city" VARCHAR(100),
  "anonymizedIp" VARCHAR(45),
  "userAgent" TEXT,
  "referrer" TEXT,
  "isAnonymous" BOOLEAN DEFAULT FALSE,
  "consentStatus" consent_status_enum DEFAULT 'not-set',
  "dataRetentionExpiry" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Sessions Table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "sessionId" UUID UNIQUE NOT NULL,
  "anonymizedIp" VARCHAR(45),
  "userAgent" TEXT,
  "browser" VARCHAR(100),
  "os" VARCHAR(100),
  "deviceType" VARCHAR(20) DEFAULT 'unknown',
  "platform" VARCHAR(20) DEFAULT 'web',
  "country" VARCHAR(2),
  "city" VARCHAR(100),
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastActivityAt" TIMESTAMPTZ,
  "totalDuration" BIGINT DEFAULT 0,
  "activityCount" INTEGER DEFAULT 0,
  "isAnonymous" BOOLEAN DEFAULT FALSE,
  "consentStatus" VARCHAR(20) DEFAULT 'not-set',
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Metrics Table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "date" DATE NOT NULL,
  "metricType" VARCHAR(50) NOT NULL,
  "value" JSONB NOT NULL,
  "period" VARCHAR(10),
  "count" INTEGER DEFAULT 0,
  "sum" BIGINT DEFAULT 0,
  "breakdown" JSONB,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_session_id ON user_activities("sessionId");
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities("userId");
CREATE INDEX IF NOT EXISTS idx_user_activities_event_type ON user_activities("eventType", "eventCategory");
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities("timestamp");
CREATE INDEX IF NOT EXISTS idx_user_activities_retention ON user_activities("dataRetentionExpiry");

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions("sessionId");
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_last_activity ON analytics_sessions("lastActivityAt");

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_date ON analytics_metrics("date");
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON analytics_metrics("metricType");

-- Add comments for documentation
COMMENT ON TABLE user_activities IS 'Stores individual user activity events for analytics';
COMMENT ON TABLE analytics_sessions IS 'Tracks user sessions with aggregated metrics';
COMMENT ON TABLE analytics_metrics IS 'Aggregated daily metrics for reporting';

COMMENT ON COLUMN user_activities."anonymizedIp" IS 'IP address with last octet removed for privacy';
COMMENT ON COLUMN user_activities."metadata" IS 'Sanitized JSONB - no PII';
COMMENT ON COLUMN user_activities."dataRetentionExpiry" IS 'Auto-delete after this date (90 days)';

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO analytics_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO analytics_user;
