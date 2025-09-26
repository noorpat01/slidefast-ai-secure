-- Migration: create_template_system_tables
-- Created at: 1758233986

-- Create template categories table
CREATE TABLE template_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color_code VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create presentation templates table
CREATE TABLE presentation_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    tags TEXT[],
    template_data JSONB NOT NULL,
    preview_image_url TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    color_scheme VARCHAR(50),
    style VARCHAR(50),
    layout_type VARCHAR(50),
    difficulty_level VARCHAR(20),
    estimated_slides INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user template favorites table
CREATE TABLE user_template_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    template_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_presentation_templates_category ON presentation_templates(category);
CREATE INDEX idx_presentation_templates_active ON presentation_templates(is_active);
CREATE INDEX idx_presentation_templates_premium ON presentation_templates(is_premium);
CREATE INDEX idx_user_template_favorites_user_id ON user_template_favorites(user_id);
CREATE INDEX idx_user_template_favorites_template_id ON user_template_favorites(template_id);;