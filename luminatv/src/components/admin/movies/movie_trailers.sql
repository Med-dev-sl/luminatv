-- Movie Trailers table
CREATE TABLE movie_trailers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL COMMENT 'Stored in Movie_Trailers bucket',
    thumbnail_url TEXT,
    duration INT COMMENT 'Duration in seconds',
    video_quality TEXT CHECK (video_quality IN ('480p', '720p', '1080p', '4K')),
    file_size BIGINT COMMENT 'File size in bytes',
    is_primary BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE movie_trailers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON movie_trailers
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins only" ON movie_trailers
    FOR ALL USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

-- Indexes
CREATE INDEX idx_movie_trailers_movie_id ON movie_trailers(movie_id);
CREATE INDEX idx_movie_trailers_is_primary ON movie_trailers(is_primary);
CREATE INDEX idx_movie_trailers_created_at ON movie_trailers(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_movie_trailers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movie_trailers_update_timestamp
BEFORE UPDATE ON movie_trailers
FOR EACH ROW
EXECUTE FUNCTION update_movie_trailers_timestamp();
