-- Table for managing presentation collaborators and permissions
CREATE TABLE presentation_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id),
    permission VARCHAR(20) NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'invited', 'declined', 'removed'
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(presentation_id, user_id)
);

-- RLS Policies for presentation_collaborators
ALTER TABLE presentation_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can view collaborators for presentations they have access to
CREATE POLICY "Users can view collaborators for accessible presentations" ON presentation_collaborators
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

-- Presentation owners and admins can manage collaborators
CREATE POLICY "Owners and admins can manage collaborators" ON presentation_collaborators
    FOR ALL USING (
        presentation_id IN (
            SELECT p.id FROM presentations p WHERE p.user_id = auth.uid()
        ) OR 
        presentation_id IN (
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.permission = 'admin' AND pc.status = 'active'
        )
    );

-- Users can update their own collaboration status (accept/decline invitations)
CREATE POLICY "Users can update own collaboration status" ON presentation_collaborators
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_presentation_collaborators_presentation_id ON presentation_collaborators(presentation_id);
CREATE INDEX idx_presentation_collaborators_user_id ON presentation_collaborators(user_id);
CREATE INDEX idx_presentation_collaborators_status ON presentation_collaborators(status);