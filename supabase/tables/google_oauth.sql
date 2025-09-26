CREATE TABLE google_oauth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    google_user_id VARCHAR(100) NOT NULL,
    google_email VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);