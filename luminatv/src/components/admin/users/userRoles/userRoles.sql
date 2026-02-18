-- User Roles table
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'content_admin', 'user_admin', 'finance_admin')),
    permissions JSONB DEFAULT '{}' COMMENT 'JSON object with granular permissions',
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role)
);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id OR (SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admin can manage roles" ON user_roles
    FOR ALL USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

-- Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_assigned_at ON user_roles(assigned_at DESC);

-- ROLE DEFINITIONS:
-- ==================
-- 1. ADMIN - Full access to entire system
--    Permissions: All operations on all tables
--
-- 2. CONTENT_ADMIN - Manages movies, series, and categories
--    Permissions:
--      - movies: create, read, update, delete
--      - series: create, read, update, delete
--      - categories: create, read, update, delete
--      - genres: read only
--      - casts: read, create, edit
--      - movie_trailers, movie_videos: create, update
--      - series_episodes, series_trailers: create, update
--
-- 3. USER_ADMIN - Manages users and subscriptions
--    Permissions:
--      - users: read, update
--      - user_roles: create, read, update
--      - user_subscriptions: read, update, cancel
--      - payments: read (view only, not create)
--      - can handle subscription issues and user account management
--
-- 4. FINANCE_ADMIN - Manages payments, revenue, and subscription plans
--    Permissions:
--      - payments: create, read, update, delete
--      - subscription_plans: create, read, update, delete
--      - user_subscriptions: read (to view subscription status)
--      - can generate revenue reports
--      - can manage subscription plans and pricing

-- Insert default subscription plans (optional - run after table creation)
-- INSERT INTO subscription_plans (name, description, slug, price, billing_cycle, duration_days, video_quality, features, display_order)
-- VALUES
--   ('Basic', 'Basic streaming with ads', 'basic', 3.99, 'monthly', 30, '480p', '{"concurrent_streams": 1, "ad_supported": true}', 1),
--   ('Premium', 'Ad-free streaming in HD', 'premium', 9.99, 'monthly', 30, '1080p', '{"concurrent_streams": 2, "ad_supported": false}', 2),
--   ('Pro', '  4K streaming for entire family', 'pro', 14.99, 'monthly', 30, '4K', '{"concurrent_streams": 4, "ad_supported": false}', 3);
