-- Initialize helper functions for RLS policies
-- This file should be run FIRST before any other SQL files

-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    admin_status TEXT;
BEGIN
    SELECT subscription_status INTO admin_status FROM users WHERE id = auth.uid();
    RETURN admin_status = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
