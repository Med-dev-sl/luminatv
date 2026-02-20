-- Subscription Plans table
CREATE TABLE subscription_plans (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    duration_days INT NOT NULL,
    max_concurrent_streams INT DEFAULT 1,
    video_quality TEXT CHECK (video_quality IN ('480p', '720p', '1080p', '4K')) DEFAULT '1080p',
    ad_supported BOOLEAN DEFAULT false,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    display_order INT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Enable write access for finance admin and admin only" ON subscription_plans
    FOR ALL USING (is_admin());

-- Indexes
CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_billing_cycle ON subscription_plans(billing_cycle);
CREATE INDEX idx_subscription_plans_created_at ON subscription_plans(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_subscription_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_update_timestamp
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_subscription_plans_timestamp();

-- User Subscriptions table
CREATE TABLE user_subscriptions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_plan_id BIGINT NOT NULL REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMP NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    renewal_date TIMESTAMP,
    cancellation_date TIMESTAMP,
    cancellation_reason TEXT,
    paused_until_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
    FOR SELECT USING (
        (SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin'
        OR (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) IN ('user_admin', 'finance_admin', 'admin')
    );

CREATE POLICY "Only user_admin and finance_admin can update subscriptions" ON user_subscriptions
    FOR ALL USING (
        (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) IN ('user_admin', 'finance_admin', 'admin')
        OR (SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin'
    );

-- Indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_subscription_plan_id ON user_subscriptions(subscription_plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_renewal_date ON user_subscriptions(renewal_date);
CREATE INDEX idx_user_subscriptions_end_date ON user_subscriptions(end_date);
CREATE INDEX idx_user_subscriptions_created_at ON user_subscriptions(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_user_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_update_timestamp
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscriptions_timestamp();
