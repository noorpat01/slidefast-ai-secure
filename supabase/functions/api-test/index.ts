// Simple API Test Function
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
        // Test API key access - check all possible variable names
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
        const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
        const serperApiKey = Deno.env.get('SERPER_API_KEY');
        
        // Find the correct API key for DeepSeek
        const correctKey = openrouterKey || deepseekKey || openaiApiKey;
        
        // Test what type of key we have
        let keyType = 'unknown';
        if (correctKey) {
            if (correctKey.startsWith('sk-or-v1-')) {
                keyType = 'OpenRouter (correct for DeepSeek)';
            } else if (correctKey.startsWith('sk-')) {
                keyType = 'OpenAI (incorrect for DeepSeek)';
            }
        }

        const result = {
            timestamp: new Date().toISOString(),
            api_keys_status: {
                openai_key_present: !!openaiApiKey,
                openai_key_prefix: openaiApiKey ? openaiApiKey.substring(0, 8) + '...' : 'not found',
                deepseek_key_present: !!deepseekKey,
                deepseek_key_prefix: deepseekKey ? deepseekKey.substring(0, 8) + '...' : 'not found',
                openrouter_key_present: !!openrouterKey,
                openrouter_key_prefix: openrouterKey ? openrouterKey.substring(0, 8) + '...' : 'not found',
                correct_key_type: keyType,
                correct_key_prefix: correctKey ? correctKey.substring(0, 8) + '...' : 'not found',
                serper_key_present: !!serperApiKey,
                serper_key_prefix: serperApiKey ? serperApiKey.substring(0, 8) + '...' : 'not found'
            },
            environment_check: {
                supabase_url: Deno.env.get('SUPABASE_URL') ? 'present' : 'missing',
                supabase_anon_key: Deno.env.get('SUPABASE_ANON_KEY') ? 'present' : 'missing',
                supabase_service_key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'present' : 'missing'
            }
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorResponse = {
            error: {
                code: 'API_TEST_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});