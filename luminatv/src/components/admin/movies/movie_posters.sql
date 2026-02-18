 CREATE TABLE IF NOT EXISTS movie_posters ( id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, title TEXT, poster_url TEXT NOT NULL, poster_type TEXT DEFAULT 'poster' CHECK (poster_type IN ('thumbnail','banner','poster')), image_width INT, image_height INT, file_size BIGINT, is_primary BOOLEAN DEFAULT false, language TEXT, region TEXT, cdn_url TEXT, color_palette JSONB, uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now() );

-- Enable Row Level Security ALTER TABLE movie_posters ENABLE ROW LEVEL SECURITY;

-- RLS Policies -- Allow all authenticated users to read CREATE POLICY movie_posters_select_policy ON movie_posters FOR SELECT TO authenticated USING (true);

-- Allow admins to INSERT/UPDATE/DELETE. Replace the check with your actual admin marker. -- This assumes users.subscription_status = 'admin' for admin users. CREATE POLICY movie_posters_admin_policy_select ON movie_posters FOR SELECT TO authenticated USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY movie_posters_admin_policy_insert ON movie_posters FOR INSERT TO authenticated WITH CHECK ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY movie_posters_admin_policy_update ON movie_posters FOR UPDATE TO authenticated USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY movie_posters_admin_policy_delete ON movie_posters FOR DELETE TO authenticated USING ((SELECT subscription_status FROM users WHERE id = auth.uid()) = 'admin');

-- Indexes CREATE INDEX IF NOT EXISTS idx_movie_posters_movie_id ON movie_posters(movie_id); CREATE INDEX IF NOT EXISTS idx_movie_posters_is_primary ON movie_posters(is_primary); CREATE INDEX IF NOT EXISTS idx_movie_posters_poster_type ON movie_posters(poster_type); CREATE INDEX IF NOT EXISTS idx_movie_posters_language ON movie_posters(language); CREATE INDEX IF NOT EXISTS idx_movie_posters_created_at ON movie_posters(created_at DESC);

-- Auto update timestamp CREATE OR REPLACE FUNCTION update_movie_posters_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END;

CREATE TRIGGER movie_posters_update_timestamp BEFORE UPDATE ON movie_posters FOR EACH ROW EXECUTE FUNCTION update_movie_posters_timestamp(); COMMIT;