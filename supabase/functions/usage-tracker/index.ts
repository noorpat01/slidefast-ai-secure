Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization header required');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        if (req.method === 'GET') {
            // Get user usage statistics
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            
            // Get current month usage
            const usageResponse = await fetch(`${supabaseUrl}/rest/v1/usage_tracking?user_id=eq.${userId}&created_at=gte.${currentMonth}-01&select=action_type,tokens_used,created_at`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!usageResponse.ok) {
                throw new Error('Failed to fetch usage data');
            }

            const usageData = await usageResponse.json();

            // Get user subscription
            const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/ai_present_subscriptions?user_id=eq.${userId}&status=eq.active&select=*,ai_present_plans!price_id(*)`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            let subscription = null;
            let monthlyLimit = 5; // Default for free tier
            
            if (subscriptionResponse.ok) {
                const subscriptionData = await subscriptionResponse.json();
                if (subscriptionData.length > 0) {
                    subscription = subscriptionData[0];
                    monthlyLimit = subscription.ai_present_plans?.monthly_limit || -1;
                }
            }

            // Calculate usage statistics
            const presentationCount = usageData.filter(u => u.action_type === 'presentation_generation').length;
            const imageCount = usageData.filter(u => u.action_type === 'image_generation').length;
            const totalTokens = usageData.reduce((sum, u) => sum + (u.tokens_used || 0), 0);

            const usageStats = {
                current_month: currentMonth,
                presentations_created: presentationCount,
                images_generated: imageCount,
                total_tokens_used: totalTokens,
                monthly_limit: monthlyLimit,
                remaining_presentations: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - presentationCount),
                subscription_type: subscription?.ai_present_plans?.plan_type || 'free',
                usage_percentage: monthlyLimit === -1 ? 0 : Math.min(100, (presentationCount / monthlyLimit) * 100)
            };

            return new Response(JSON.stringify({
                data: usageStats
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (req.method === 'POST') {
            // Record new usage
            const { action_type, tokens_used, presentation_id, metadata } = await req.json();

            if (!action_type) {
                throw new Error('Action type is required');
            }

            // Insert usage record
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/usage_tracking`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    action_type,
                    tokens_used: tokens_used || 0,
                    presentation_id,
                    metadata
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to record usage: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    message: 'Usage recorded successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Method not allowed');

    } catch (error) {
        console.error('Usage tracking error:', error);

        const errorResponse = {
            error: {
                code: 'USAGE_TRACKING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});