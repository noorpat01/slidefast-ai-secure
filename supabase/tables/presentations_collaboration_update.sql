-- Update presentations table to support collaboration features
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS sharing_enabled BOOLEAN DEFAULT false;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS sharing_link VARCHAR(255) UNIQUE;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS default_permission VARCHAR(20) DEFAULT 'view'; -- 'view', 'edit'
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS collaboration_settings JSONB DEFAULT '{"comments_enabled": true, "suggestions_enabled": true}'::jsonb;

-- Update RLS policies for presentations to include collaborators
DROP POLICY IF EXISTS "Users can view own presentations" ON presentations;
DROP POLICY IF EXISTS "Users can insert own presentations" ON presentations;
DROP POLICY IF EXISTS "Users can update own presentations" ON presentations;
DROP POLICY IF EXISTS "Users can delete own presentations" ON presentations;

-- Users can view presentations they own or are collaborators on
CREATE POLICY "Users can view accessible presentations" ON presentations
    FOR SELECT USING (
        user_id = auth.uid() OR
        id IN (
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.status = 'active'
        ) OR
        (sharing_enabled = true AND sharing_link IS NOT NULL)
    );

-- Users can insert their own presentations
CREATE POLICY "Users can insert own presentations" ON presentations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update presentations they own or have edit permission on
CREATE POLICY "Users can update accessible presentations" ON presentations
    FOR UPDATE USING (
        user_id = auth.uid() OR
        id IN (
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.permission IN ('edit', 'admin') AND pc.status = 'active'
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        id IN (
            SELECT pc.presentation_id FROM presentation_collaborators pc 
            WHERE pc.user_id = auth.uid() AND pc.permission IN ('edit', 'admin') AND pc.status = 'active'
        )
    );

-- Only owners can delete presentations
CREATE POLICY "Users can delete own presentations" ON presentations
    FOR DELETE USING (user_id = auth.uid());

-- Create function to generate sharing links
CREATE OR REPLACE FUNCTION generate_sharing_link(presentation_uuid UUID)
RETURNS VARCHAR AS $$
DECLAR
    link_token VARCHAR;
BEGIN
    -- Generate a random token for the sharing link
    link_token := encode(gen_random_bytes(16), 'base64');
    link_token := replace(replace(replace(link_token, '+', '-'), '/', '_'), '=', '');
    
    -- Update the presentation with the sharing link
    UPDATE presentations 
    SET sharing_link = link_token, sharing_enabled = true, updated_at = NOW()
    WHERE id = presentation_uuid AND user_id = auth.uid();
    
    RETURN link_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update version and track changes
CREATE OR REPLACE FUNCTION update_presentation_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment version on content changes
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.version = OLD.version + 1;
        NEW.last_edited_by = auth.uid();
        
        -- Log activity
        INSERT INTO presentation_activity (
            presentation_id,
            user_id,
            action_type,
            action_details,
            previous_content,
            new_content
        ) VALUES (
            NEW.id,
            auth.uid(),
            'edit',
            json_build_object('version', NEW.version),
            OLD.content,
            NEW.content
        );
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_presentation_version_trigger ON presentations;
CREATE TRIGGER update_presentation_version_trigger
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_presentation_version();