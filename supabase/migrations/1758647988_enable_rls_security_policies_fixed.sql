-- Migration: enable_rls_security_policies_fixed
-- Created at: 1758647988

-- Enable Row Level Security on critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create security policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create security policies for presentations table
CREATE POLICY "Users can view own presentations" ON public.presentations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own presentations" ON public.presentations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own presentations" ON public.presentations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own presentations" ON public.presentations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create security policies for api_keys table
CREATE POLICY "Users can view own api keys" ON public.api_keys
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own api keys" ON public.api_keys
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create security policies for subscriptions table
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create security policies for usage_tracking table
CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert usage tracking" ON public.usage_tracking
    FOR INSERT WITH CHECK (true);

-- Create security policies for ai_suggestions table
CREATE POLICY "Users can view own ai suggestions" ON public.ai_suggestions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can manage ai suggestions" ON public.ai_suggestions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create security policies for presentation_analytics table (uses viewer_id)
CREATE POLICY "Users can view own analytics" ON public.presentation_analytics
    FOR SELECT USING (auth.uid()::text = viewer_id::text);

CREATE POLICY "Users can view analytics for own presentations" ON public.presentation_analytics
    FOR SELECT USING (
        presentation_id IN (
            SELECT id FROM public.presentations 
            WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "System can insert analytics" ON public.presentation_analytics
    FOR INSERT WITH CHECK (true);

-- Create security policies for presentation_comments table
CREATE POLICY "Users can view comments on own presentations" ON public.presentation_comments
    FOR SELECT USING (
        presentation_id IN (
            SELECT id FROM public.presentations 
            WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create comments" ON public.presentation_comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own comments" ON public.presentation_comments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create security policies for api_usage_logs table (links through api_keys)
CREATE POLICY "Users can view own api usage logs" ON public.api_usage_logs
    FOR SELECT USING (
        api_key_id IN (
            SELECT id FROM public.api_keys 
            WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "System can log api usage" ON public.api_usage_logs
    FOR INSERT WITH CHECK (true);;