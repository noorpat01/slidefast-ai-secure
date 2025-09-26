-- Migration: create_templates_system
-- Created at: 1758244659

-- Create templates table
CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    tags TEXT[],
    color_scheme VARCHAR(100),
    style VARCHAR(100),
    layout_type VARCHAR(100),
    difficulty_level VARCHAR(50) DEFAULT 'intermediate',
    estimated_slides INTEGER DEFAULT 10,
    is_premium BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    template_data JSONB NOT NULL,
    preview_image_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_favorites table
CREATE TABLE template_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    template_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- Create template_categories table
CREATE TABLE template_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color_code VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_premium ON templates(is_premium);
CREATE INDEX idx_templates_difficulty ON templates(difficulty_level);
CREATE INDEX idx_template_favorites_user ON template_favorites(user_id);
CREATE INDEX idx_template_favorites_template ON template_favorites(template_id);

-- Insert default categories
INSERT INTO template_categories (name, display_name, description, icon, color_code, sort_order) VALUES
('business_corporate', 'Business & Corporate', 'Professional business presentations', 'briefcase', '#2563EB', 1),
('technology_startups', 'Technology & Startups', 'Tech presentations and pitch decks', 'rocket', '#7C3AED', 2),
('creative_marketing', 'Creative & Marketing', 'Marketing and creative portfolios', 'palette', '#DC2626', 3),
('educational_academic', 'Educational & Academic', 'Academic and educational content', 'graduation-cap', '#16A34A', 4),
('financial_reports', 'Financial Reports', 'Financial analysis and reporting', 'trending-up', '#059669', 5),
('healthcare_medical', 'Healthcare & Medical', 'Medical and healthcare presentations', 'heart', '#0EA5E9', 6),
('consulting_strategy', 'Consulting & Strategy', 'Strategic consulting frameworks', 'target', '#1F2937', 7),
('sales_proposals', 'Sales & Proposals', 'Sales presentations and proposals', 'shopping-cart', '#DC2626', 8);;