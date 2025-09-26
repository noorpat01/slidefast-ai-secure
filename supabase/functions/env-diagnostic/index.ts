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
        // Get all environment variables
        const allEnv = Deno.env.toObject();
        
        // Specifically check for API keys
        const apiKeys = {
            'FRESH_DEEPSEEK_API_KEY': Deno.env.get('FRESH_DEEPSEEK_API_KEY'),
            'NEW_DEEPSEEK_API_KEY_2': Deno.env.get('NEW_DEEPSEEK_API_KEY_2'), 
            'DEEPSEEK_API_KEY': Deno.env.get('DEEPSEEK_API_KEY'),
            'Deepseek_Key': Deno.env.get('Deepseek_Key'),
            'SUPABASE_SERVICE_ROLE_KEY': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
            'SUPABASE_URL': Deno.env.get('SUPABASE_URL')
        };

        // Log the findings
        console.log('=== ENVIRONMENT DIAGNOSTIC ===');
        console.log('Available Environment Variables:', Object.keys(allEnv));
        console.log('API Key Check:', apiKeys);
        console.log('FRESH_DEEPSEEK_API_KEY exists:', !!apiKeys['FRESH_DEEPSEEK_API_KEY']);
        console.log('FRESH_DEEPSEEK_API_KEY length:', apiKeys['FRESH_DEEPSEEK_API_KEY']?.length || 0);

        return new Response(JSON.stringify({
            data: {
                available_env_vars: Object.keys(allEnv),
                api_key_status: {
                    'FRESH_DEEPSEEK_API_KEY': {
                        exists: !!apiKeys['FRESH_DEEPSEEK_API_KEY'],
                        length: apiKeys['FRESH_DEEPSEEK_API_KEY']?.length || 0,
                        starts_with: apiKeys['FRESH_DEEPSEEK_API_KEY']?.substring(0, 10) + '...' || 'NOT_FOUND'
                    },
                    'DEEPSEEK_API_KEY': {
                        exists: !!apiKeys['DEEPSEEK_API_KEY'],
                        length: apiKeys['DEEPSEEK_API_KEY']?.length || 0,
                        starts_with: apiKeys['DEEPSEEK_API_KEY']?.substring(0, 10) + '...' || 'NOT_FOUND'
                    },
                    'Deepseek_Key': {
                        exists: !!apiKeys['Deepseek_Key'],
                        length: apiKeys['Deepseek_Key']?.length || 0,
                        starts_with: apiKeys['Deepseek_Key']?.substring(0, 10) + '...' || 'NOT_FOUND'
                    }
                },
                supabase_config: {
                    url_exists: !!apiKeys['SUPABASE_URL'],
                    service_key_exists: !!apiKeys['SUPABASE_SERVICE_ROLE_KEY']
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Environment diagnostic error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'ENV_DIAGNOSTIC_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
