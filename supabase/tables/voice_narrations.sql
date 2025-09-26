CREATE TABLE voice_narrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_id UUID,
    slide_id UUID,
    user_id UUID,
    narration_text TEXT,
    audio_url TEXT,
    voice_settings JSONB,
    duration_seconds INTEGER,
    status TEXT CHECK (status IN ('generating',
    'ready',
    'failed')) DEFAULT 'generating',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);