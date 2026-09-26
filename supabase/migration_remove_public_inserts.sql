-- ============================================================
-- Migration: Remove Public Direct INSERT on feedback & analytics_events
-- ============================================================
-- Closes direct anonymous client insert vulnerabilities.
-- All customer feedback and analytics tracking must be mediated
-- through the server-side API endpoints (/api/feedback, /api/analytics)
-- which validate schemas, verify QR existence, enforce business active status,
-- and prevent BOLA attacks before writing via the service role.

-- 1. Feedback: Drop public direct INSERT policy
DROP POLICY IF EXISTS "Public can insert feedback" ON feedback;

-- 2. Analytics: Drop public direct INSERT policy
DROP POLICY IF EXISTS "Public can insert analytics" ON analytics_events;
