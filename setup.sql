-- Create the posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT, -- Markdown or HTML content
  excerpt TEXT,
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to all posts (or just published ones)
-- For now, we allow reading all posts to make development easier, 
-- but in production you might want: published = true
CREATE POLICY "Public can view all posts" 
ON posts FOR SELECT 
USING (true);

-- Policy 2: Allow authenticated users (admins) to modify posts
-- This assumes you will use Supabase Auth and your user is authenticated
CREATE POLICY "Authenticated users can modify posts" 
ON posts FOR ALL 
USING (auth.role() = 'authenticated');

-- Create a storage bucket for post images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );
