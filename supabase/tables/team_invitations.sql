-- Table for managing team invitations
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- filled when user exists
    permission VARCHAR(20) NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    message TEXT, -- optional invitation message
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations for presentations they own or manage
CREATE POLICY "Users can view invitations for managed presentations" ON team_invitations
    FOR SELECT USING (
        presentation_id IN (
            SELECT p.id FROM presentations p WHERE p.user_id = auth.uid()
            UNION
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.permission IN ('admin') AND pc.status = 'active'
        ) OR
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations" ON team_invitations
    FOR INSERT WITH CHECK (
        invited_by = auth.uid() AND
        presentation_id IN (
            SELECT p.id FROM presentations p WHERE p.user_id = auth.uid()
            UNION
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.permission = 'admin' AND pc.status = 'active'
        )
    );

-- Users can update invitations they sent or received
CREATE POLICY "Users can update relevant invitations" ON team_invitations
    FOR UPDATE USING (
        invited_by = auth.uid() OR
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    WITH CHECK (
        invited_by = auth.uid() OR
        invited_user_id = auth.uid() OR
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Create indexes
CREATE INDEX idx_team_invitations_presentation_id ON team_invitations(presentation_id);
CREATE INDEX idx_team_invitations_invited_email ON team_invitations(invited_email);
CREATE INDEX idx_team_invitations_invited_user_id ON team_invitations(invited_user_id);
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE team_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;