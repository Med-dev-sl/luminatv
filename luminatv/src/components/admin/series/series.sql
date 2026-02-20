-- Series table
CREATE TABLE series (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    release_date DATE,
    end_date DATE,
    seasons_count INT DEFAULT 1,
    rating DECIMAL(3,1),
    rating_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
    poster_url TEXT COMMENT 'Stored in Movies_Posters bucket',
    thumbnail_url TEXT,
    background_url TEXT,
    language TEXT,
    country TEXT,
    status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus', 'cancelled')),
    featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON series
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins only" ON series
    FOR ALL USING (is_admin());

-- Indexes
CREATE INDEX idx_series_title ON series(title);
CREATE INDEX idx_series_slug ON series(slug);
CREATE INDEX idx_series_category_id ON series(category_id);
CREATE INDEX idx_series_status ON series(status);
CREATE INDEX idx_series_featured ON series(featured);
CREATE INDEX idx_series_release_date ON series(release_date DESC);
CREATE INDEX idx_series_created_at ON series(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_series_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER series_update_timestamp
BEFORE UPDATE ON series
FOR EACH ROW
EXECUTE FUNCTION update_series_timestamp();

-- Junction table for series and genres
CREATE TABLE series_genres (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    series_id BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    UNIQUE(series_id, genre_id)
);

CREATE INDEX idx_series_genres_series_id ON series_genres(series_id);
CREATE INDEX idx_series_genres_genre_id ON series_genres(genre_id);

-- Junction table for series and casts
CREATE TABLE series_casts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    series_id BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    cast_id BIGINT NOT NULL REFERENCES casts(id) ON DELETE CASCADE,
    character_name TEXT,
    UNIQUE(series_id, cast_id)
);

CREATE INDEX idx_series_casts_series_id ON series_casts(series_id);
CREATE INDEX idx_series_casts_cast_id ON series_casts(cast_id);
