CREATE TABLE ai_analysis_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_id UUID,
    content_hash VARCHAR(64),
    analysis_type TEXT CHECK (analysis_type IN ('content',
    'design',
    'template_match',
    'sentiment')),
    analysis_result JSONB,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);