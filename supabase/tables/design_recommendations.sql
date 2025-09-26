CREATE TABLE design_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_id UUID,
    slide_id UUID,
    recommendation_type TEXT CHECK (recommendation_type IN ('color_palette',
    'layout',
    'typography',
    'image_placement',
    'consistency')),
    recommendation_data JSONB,
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5) DEFAULT 3,
    auto_applicable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);