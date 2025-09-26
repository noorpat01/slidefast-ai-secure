CREATE TABLE presentation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID,
    viewer_id UUID,
    session_id VARCHAR(200) NOT NULL,
    viewer_ip VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    view_mode VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_time_seconds INTEGER DEFAULT 0,
    slides_viewed JSONB DEFAULT '[]'::jsonb,
    slide_durations JSONB DEFAULT '{}'::jsonb,
    interactions JSONB DEFAULT '[]'::jsonb,
    exit_slide_id VARCHAR(100),
    completed_presentation BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);