CREATE TABLE user_template_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    template_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);