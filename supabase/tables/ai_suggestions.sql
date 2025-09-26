CREATE TABLE ai_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_id UUID,
    slide_id UUID,
    user_id UUID,
    suggestion_type TEXT CHECK (suggestion_type IN ('content',
    'design',
    'template',
    'structure',
    'grammar')),
    suggestion_data JSONB,
    confidence_score DECIMAL(3,2) DEFAULT 0.85,
    applied BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);