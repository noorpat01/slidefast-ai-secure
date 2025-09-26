CREATE TABLE ai_content_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_id UUID,
    slide_id UUID,
    user_id UUID,
    suggestion_text TEXT,
    suggestion_category TEXT CHECK (suggestion_category IN ('headline',
    'bullet_point',
    'conclusion',
    'transition',
    'statistic')),
    context_data JSONB,
    relevance_score DECIMAL(3,2) DEFAULT 0.80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);