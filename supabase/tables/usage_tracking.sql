CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    presentation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);