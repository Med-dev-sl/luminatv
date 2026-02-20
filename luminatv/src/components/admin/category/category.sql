-- Categories table
CREATE TABLE categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT UNIQUE,
    icon_url TEXT,
    color_code TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Enable write access for authenticated admins only" ON categories
    FOR ALL USING (is_admin());

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_categories_created_at ON categories(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_categories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_update_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_categories_timestamp();
