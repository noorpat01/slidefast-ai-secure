CREATE TABLE gallery_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_item_id UUID,
    user_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);