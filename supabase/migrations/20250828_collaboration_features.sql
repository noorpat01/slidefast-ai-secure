-- Collaboration Features Migration
-- This migration adds real-time collaboration capabilities to the AI Presentation Platform

-- Create user_profiles table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    company VARCHAR(255),
    role VARCHAR(100),
    bio TEXT,
    preferences JSONB DEFAULT '{"notifications": {"email": true, "push": true}, "theme": "system"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update presentations table for collaboration support
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS sharing_enabled BOOLEAN DEFAULT false;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS sharing_link VARCHAR(255) UNIQUE;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS default_permission VARCHAR(20) DEFAULT 'view';
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS collaboration_settings JSONB DEFAULT '{"comments_enabled": true, "suggestions_enabled": true}'::jsonb;

-- Create presentation_collaborators table
CREATE TABLE presentation_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id),
    permission VARCHAR(20) NOT NULL DEFAULT 'view',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(presentation_id, user_id)
);

-- Create presentation_comments table
CREATE TABLE presentation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    slide_id VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES presentation_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position_x INTEGER,
    position_y INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presentation_activity table
CREATE TABLE presentation_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    slide_id VARCHAR(100),
    previous_content JSONB,
    new_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presentation_sessions table
CREATE TABLE presentation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    slide_id VARCHAR(100),
    cursor_position JSONB,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(presentation_id, user_id, session_id)
);

-- Create team_invitations table
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL DEFAULT 'view',
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;