-- Migration: Add Performance Indices for Highlights
-- File: migration_highlights_performance_indices.sql
-- Purpose: Optimize highlights queries for admin dashboard performance
-- Apply with: Execute this SQL in Supabase SQL Editor or via migration tool

-- Performance indices for highlights queries optimization
-- These indices will dramatically improve query performance for the admin dashboard

-- 1. Index for highlights with status and moderation_status filtering
-- Most common query: filtering by status (active, pending, rejected)
CREATE INDEX IF NOT EXISTS idx_highlights_status_moderation
ON highlights (status, moderation_status, created_at DESC);

-- 2. Index for highlights with user_id for JOIN optimization
-- Critical for the JOIN queries with users/profiles tables
CREATE INDEX IF NOT EXISTS idx_highlights_user_id_status
ON highlights (user_id, status, is_active);

-- 3. Index for highlights ordering by created_at (most frequent order)
-- Speeds up pagination and newest-first sorting
CREATE INDEX IF NOT EXISTS idx_highlights_created_at_desc
ON highlights (created_at DESC) WHERE is_active = true;

-- 4. Index for admin posts filtering
-- When filtering admin-only posts
CREATE INDEX IF NOT EXISTS idx_highlights_admin_posts
ON highlights (is_admin_post, status, created_at DESC);

-- 5. Index for expiration queries
-- When filtering expired highlights
CREATE INDEX IF NOT EXISTS idx_highlights_expires_at
ON highlights (expires_at, status) WHERE expires_at IS NOT NULL;

-- 6. Composite index for the most common admin dashboard query
-- Covers status filtering, pagination, and user data JOINs
CREATE INDEX IF NOT EXISTS idx_highlights_admin_dashboard
ON highlights (status, moderation_status, is_active, user_id, created_at DESC);

-- 7. Index for view count statistics (if needed for sorting)
CREATE INDEX IF NOT EXISTS idx_highlights_view_count
ON highlights (view_count DESC) WHERE is_active = true AND status = 'active';

-- 8. Ensure users table has proper index for JOINs
CREATE INDEX IF NOT EXISTS idx_users_id_name
ON users (id, name, email, user_type);

-- 9. Ensure profiles table has proper index for JOINs
CREATE INDEX IF NOT EXISTS idx_profiles_id_name
ON profiles (id, name, email, account_type);

-- 10. Ensure business_profiles table has proper index for JOINs
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id
ON business_profiles (user_id, company_name, contact_email);

-- Add comments for documentation
COMMENT ON INDEX idx_highlights_status_moderation IS 'Optimizes status and moderation filtering with timestamp ordering';
COMMENT ON INDEX idx_highlights_user_id_status IS 'Optimizes JOIN operations with user tables';
COMMENT ON INDEX idx_highlights_created_at_desc IS 'Optimizes chronological ordering and pagination';
COMMENT ON INDEX idx_highlights_admin_posts IS 'Optimizes admin-only post filtering';
COMMENT ON INDEX idx_highlights_expires_at IS 'Optimizes expiration date queries';
COMMENT ON INDEX idx_highlights_admin_dashboard IS 'Composite index for main admin dashboard query';
COMMENT ON INDEX idx_highlights_view_count IS 'Optimizes view count sorting for popular content';
COMMENT ON INDEX idx_users_id_name IS 'Optimizes user data JOINs in highlights queries';
COMMENT ON INDEX idx_profiles_id_name IS 'Optimizes profile data JOINs in highlights queries';
COMMENT ON INDEX idx_business_profiles_user_id IS 'Optimizes business profile data JOINs in highlights queries';

-- Verification query to check index creation
-- Run this after applying the migration to verify indices were created
/*
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('highlights', 'users', 'profiles', 'business_profiles')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
*/