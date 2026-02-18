-- Series Trailers table
CREATE TABLE series_trailers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    series_id BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL COMMENT 'Stored in Series_Trailers bucket',
    thumbnail_url TEXT,
    season_number INT,
    duration INT COMMENT 'Duration in seconds',
    video_quality TEXT CHECK (video_quality IN ('480p', '720p', '1080p', '4K')),
    file_size BIGINT COMMENT 'File size in bytes',
    language TEXT,
    is_primary BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    cdn_url TEXT COMMENT 'CDN URL for streaming',
    transcoding_status TEXT DEFAULT 'pending' CHECK (transcoding_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE series_trailers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users" ON series_trailers
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins only" ON series_trailers
    FOR ALL USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

-- Indexes
CREATE INDEX idx_series_trailers_series_id ON series_trailers(series_id);
CREATE INDEX idx_series_trailers_is_primary ON series_trailers(is_primary);
CREATE INDEX idx_series_trailers_season_number ON series_trailers(season_number);
CREATE INDEX idx_series_trailers_transcoding_status ON series_trailers(transcoding_status);
CREATE INDEX idx_series_trailers_created_at ON series_trailers(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_series_trailers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER series_trailers_update_timestamp
BEFORE UPDATE ON series_trailers
FOR EACH ROW
EXECUTE FUNCTION update_series_trailers_timestamp();
