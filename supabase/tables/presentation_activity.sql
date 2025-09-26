-- Table for tracking presentation activity and version history
CREATE TABLE presentation_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'create', 'edit', 'comment', 'invite', 'share', 'export'
    action_details JSONB, -- detailed information about the action
    slide_id VARCHAR(100), -- affected slide if applicable
    previous_content JSONB, -- previous state for version tracking
    new_content JSONB, -- new state for version tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for presentation_activity
ALTER TABLE presentation_activity ENABLE ROW LEVEL SECURITY;

-- Users can view activity for presentations they have access to
CREATE POLICY "Users can view activity for accessible presentations" ON presentation_activity
    FOR SELECT USING (
        presentation_id IN (
            SELECT p.id FROM presentations p 
            WHERE p.user_id = auth.uid() 
            OR p.id IN (
                SELECT pc.presentation_id FROM presentation_collaborators pc 
                WHERE pc.user_id = auth.uid() AND pc.status = 'active'
            )
        )
    );

-- System can insert activity records (handled by triggers/functions)
CREATE POLICY "System can insert activity records" ON presentation_activity
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_presentation_activity_presentation_id ON presentation_activity(presentation_id);
CREATE INDEX idx_presentation_activity_user_id ON presentation_activity(user_id);
CREATE INDEX idx_presentation_activity_action_type ON presentation_activity(action_type);
CREATE INDEX idx_presentation_activity_created_at ON presentation_activity(created_at DESC);