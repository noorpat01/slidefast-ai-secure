-- Table for tracking active editing sessions and user presence
CREATE TABLE presentation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL, -- browser session identifier
    slide_id VARCHAR(100), -- current slide being viewed/edited
    cursor_position JSONB, -- cursor position data for live cursors
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'idle', 'disconnected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(presentation_id, user_id, session_id)
);

-- RLS Policies for presentation_sessions
ALTER TABLE presentation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view sessions for presentations they have access to
CREATE POLICY "Users can view sessions for accessible presentations" ON presentation_sessions
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

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON presentation_sessions
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_presentation_sessions_presentation_id ON presentation_sessions(presentation_id);
CREATE INDEX idx_presentation_sessions_user_id ON presentation_sessions(user_id);
CREATE INDEX idx_presentation_sessions_last_activity ON presentation_sessions(last_activity DESC);
CREATE INDEX idx_presentation_sessions_status ON presentation_sessions(status);

-- Create function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Mark sessions as disconnected if no activity for 5 minutes
    UPDATE presentation_sessions 
    SET status = 'disconnected', updated_at = NOW()
    WHERE last_activity < NOW() - INTERVAL '5 minutes' 
    AND status != 'disconnected';
    
    -- Delete disconnected sessions older than 1 hour
    DELETE FROM presentation_sessions 
    WHERE status = 'disconnected' 
    AND updated_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function (to be called periodically)
-- This would typically be handled by a cron job or scheduled function