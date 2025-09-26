-- Table for slide comments and feedback
CREATE TABLE presentation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    slide_id VARCHAR(100) NOT NULL, -- slide identifier within the presentation
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES presentation_comments(id) ON DELETE CASCADE, -- for threaded comments
    content TEXT NOT NULL,
    position_x INTEGER, -- x coordinate for positioned comments
    position_y INTEGER, -- y coordinate for positioned comments
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'deleted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for presentation_comments
ALTER TABLE presentation_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments for presentations they have access to
CREATE POLICY "Users can view comments for accessible presentations" ON presentation_comments
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

-- Users with edit permission can create comments
CREATE POLICY "Users with access can create comments" ON presentation_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        presentation_id IN (
            SELECT p.id FROM presentations p WHERE p.user_id = auth.uid()
            UNION
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.status = 'active'
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON presentation_comments
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments, owners can delete any comments
CREATE POLICY "Users can delete own comments, owners delete any" ON presentation_comments
    FOR DELETE USING (
        user_id = auth.uid() OR
        presentation_id IN (
            SELECT p.id FROM presentations p WHERE p.user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_presentation_comments_presentation_id ON presentation_comments(presentation_id);
CREATE INDEX idx_presentation_comments_slide_id ON presentation_comments(slide_id);
CREATE INDEX idx_presentation_comments_user_id ON presentation_comments(user_id);
CREATE INDEX idx_presentation_comments_parent_id ON presentation_comments(parent_id);
CREATE INDEX idx_presentation_comments_status ON presentation_comments(status);