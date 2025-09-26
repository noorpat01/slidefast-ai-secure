CREATE TABLE google_drive_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    presentation_id UUID,
    google_file_id VARCHAR(100) NOT NULL,
    google_file_name VARCHAR(255),
    drive_folder_id VARCHAR(100),
    mime_type VARCHAR(100),
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_direction VARCHAR(20) DEFAULT 'bidirectional',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);