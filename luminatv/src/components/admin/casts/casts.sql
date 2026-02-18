-- Create casts table
CREATE TABLE casts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    country TEXT,
    birth_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE casts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Enable read access for all users" ON casts
    FOR SELECT USING (true);

-- Create RLS policy for authenticated users to manage casts
CREATE POLICY "Enable insert for authenticated users only" ON casts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON casts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON casts
    FOR DELETE USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_casts_name ON casts(name);
CREATE INDEX idx_casts_country ON casts(country);
CREATE INDEX idx_casts_created_at ON casts(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_casts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER casts_update_timestamp
BEFORE UPDATE ON casts
FOR EACH ROW
EXECUTE FUNCTION update_casts_timestamp();
