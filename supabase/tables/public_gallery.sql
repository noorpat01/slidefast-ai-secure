CREATE TABLE public_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID,
    published_by UUID,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_template BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    thumbnail_url VARCHAR(500),
    preview_slides JSONB,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);