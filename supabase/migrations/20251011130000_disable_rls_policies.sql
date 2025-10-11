-- migration: disable_rls_policies
-- description: Temporarily disable RLS on flashcards tables (policies remain defined but inactive)
-- created: 2025-10-11
-- 
-- this migration disables row level security on flashcards-related tables
-- the policy definitions remain in the database but are not enforced
-- this is useful for development/testing or administrative operations
--
-- affected tables: flashcards, generations, generation_error_logs
-- note: to re-enable rls, create a migration with "alter table ... enable row level security"

-- ============================================================================
-- disable row level security
-- ============================================================================

-- disable rls on flashcards table
-- policies remain defined but are not enforced
alter table flashcards disable row level security;

-- disable rls on generations table
-- policies remain defined but are not enforced
alter table generations disable row level security;

-- disable rls on generation_error_logs table
-- policies remain defined but are not enforced
alter table generation_error_logs disable row level security;

-- ============================================================================
-- migration complete
-- ============================================================================

-- warning: with rls disabled, all authenticated users can access all data
-- in these tables regardless of user_id. ensure proper application-level
-- access controls are in place or re-enable rls before production deployment

