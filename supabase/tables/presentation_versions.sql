CREATE TABLE presentation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID,
    version_number INTEGER NOT NULL,
    branch_name VARCHAR(100) DEFAULT 'main',
    parent_version_id UUID,
    created_by UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    theme VARCHAR(100) DEFAULT 'professional',
    change_summary TEXT,
    is_current_version BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);