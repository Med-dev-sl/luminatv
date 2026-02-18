-- Movie Videos/Full Length Movies table
CREATE TABLE movie_videos (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL COMMENT 'Stored in Movie_Videos bucket',
    thumbnail_url TEXT,
    duration INT COMMENT 'Duration in seconds',
    video_quality TEXT CHECK (video_quality IN ('480p', '720p', '1080p', '4K')),
    file_size BIGINT COMMENT 'File size in bytes',
    language TEXT,
    subtitles_available BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT true,
    cdn_url TEXT COMMENT 'CDN URL for streaming',
    transcoding_status TEXT DEFAULT 'pending' CHECK (transcoding_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE movie_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON movie_videos
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable write access for admins only" ON movie_videos
    FOR ALL USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

-- Indexes
CREATE INDEX idx_movie_videos_movie_id ON movie_videos(movie_id);
CREATE INDEX idx_movie_videos_is_primary ON movie_videos(is_primary);
CREATE INDEX idx_movie_videos_transcoding_status ON movie_videos(transcoding_status);
CREATE INDEX idx_movie_videos_created_at ON movie_videos(created_at DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_movie_videos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movie_videos_update_timestamp
BEFORE UPDATE ON movie_videos
FOR EACH ROW
EXECUTE FUNCTION update_movie_videos_timestamp();
