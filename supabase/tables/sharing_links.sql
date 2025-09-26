CREATE TABLE sharing_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID,
    created_by UUID,
    link_id VARCHAR(32) UNIQUE NOT NULL,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'view',
    password_hash VARCHAR(255),
    domain_restrictions TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    allow_download BOOLEAN DEFAULT true,
    show_comments BOOLEAN DEFAULT true,
    track_analytics BOOLEAN DEFAULT true,
    custom_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE
);