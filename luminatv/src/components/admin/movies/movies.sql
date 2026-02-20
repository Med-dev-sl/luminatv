-- Movies table
CREATE TABLE movies (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    release_date DATE,
    duration INT COMMENT 'Duration in minutes',
    rating DECIMAL(3,1),
    rating_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
    poster_url TEXT COMMENT 'Stored in Movies_Posters bucket',
    thumbnail_url TEXT,
    background_url TEXT,
    language TEXT,
    country TEXT,
    budget DECIMAL(15,2),
    revenue DECIMAL(15,2),
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for published movies" ON movies
    FOR SELECT USING (status = 'published' OR is_admin());

CREATE POLICY "Enable write access for admins only" ON movies
    FOR ALL USING (is_admin());

-- Indexes
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_slug ON movies(slug);
CREATE INDEX idx_movies_category_id ON movies(category_id);
CREATE INDEX idx_movies_status ON movies(status);
CREATE INDEX idx_movies_featured ON movies(featured);
CREATE INDEX idx_movies_release_date ON movies(release_date DESC);
CREATE INDEX idx_movies_created_at ON movies(created_at DESC);
CREATE INDEX idx_movies_rating ON movies(rating DESC);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_movies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_update_timestamp
BEFORE UPDATE ON movies
FOR EACH ROW
EXECUTE FUNCTION update_movies_timestamp();

-- Junction table for movies and genres (many-to-many relationship)
CREATE TABLE movie_genres (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    UNIQUE(movie_id, genre_id)
);

CREATE INDEX idx_movie_genres_movie_id ON movie_genres(movie_id);
CREATE INDEX idx_movie_genres_genre_id ON movie_genres(genre_id);

-- Junction table for movies and casts (many-to-many relationship)
CREATE TABLE movie_casts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    cast_id BIGINT NOT NULL REFERENCES casts(id) ON DELETE CASCADE,
    character_name TEXT,
    cast_order INT,
    UNIQUE(movie_id, cast_id)
);

CREATE INDEX idx_movie_casts_movie_id ON movie_casts(movie_id);
CREATE INDEX idx_movie_casts_cast_id ON movie_casts(cast_id);
