-- Series Episodes table
CREATE TABLE series_episodes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    series_id BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    season_number INT NOT NULL,
    episode_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT COMMENT 'Stored in Series_Episodes bucket',
    duration INT COMMENT 'Duration in seconds',
    video_quality TEXT CHECK (video_quality IN ('480p', '720p', '1080p', '4K')),
    file_size BIGINT COMMENT 'File size in bytes',
    release_date TIMESTAMP,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    rating DECIMAL(3,1),
    rating_count INT DEFAULT 0,
    director TEXT,
    writer TEXT,
    language TEXT,
    subtitles_available BOOLEAN DEFAULT false,
    cdn_url TEXT COMMENT 'CDN URL for streaming',
    transcoding_status TEXT DEFAULT 'pending' CHECK (transcoding_status IN ('pending', 'processing', 'completed', 'failed')),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(series_id, season_number, episode_number)
);

-- Enable Row Level Security
ALTER TABLE series_episodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON series_episodes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable write access for admins only" ON series_episodes
    FOR ALL USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

-- Indexes
CREATE INDEX idx_series_episodes_series_id ON series_episodes(series_id);
CREATE INDEX idx_series_episodes_season ON series_episodes(season_number);
CREATE INDEX idx_series_episodes_episode ON series_episodes(episode_number);
CREATE INDEX idx_series_episodes_release_date ON series_episodes(release_date DESC);
CREATE INDEX idx_series_episodes_is_available ON series_episodes(is_available);
CREATE INDEX idx_series_episodes_transcoding_status ON series_episodes(transcoding_status);
CREATE INDEX idx_series_episodes_created_at ON series_episodes(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_series_episodes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER series_episodes_update_timestamp
BEFORE UPDATE ON series_episodes
FOR EACH ROW
EXECUTE FUNCTION update_series_episodes_timestamp();
