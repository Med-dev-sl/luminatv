-- Genres table
CREATE TABLE genres (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT UNIQUE,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON genres
    FOR SELECT USING (is_active = true);

CREATE POLICY "Enable write access for authenticated admins only" ON genres
    FOR ALL USING (is_admin());

-- Indexes
CREATE INDEX idx_genres_slug ON genres(slug);
CREATE INDEX idx_genres_is_active ON genres(is_active);
CREATE INDEX idx_genres_created_at ON genres(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_genres_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER genres_update_timestamp
BEFORE UPDATE ON genres
FOR EACH ROW
EXECUTE FUNCTION update_genres_timestamp();
