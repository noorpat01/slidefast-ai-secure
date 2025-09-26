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
        // List all environment variables that contain "DEEPSEEK" or "API"
        const allEnvVars = {};
        
        // Known possible environment variable names
        const possibleKeys = [
            'FRESH_DEEPSEEK_API_KEY',
            'NEW_DEEPSEEK_API_KEY_2', 
            'NEW_DEEPSEEK_API_KEY',
            'DEEPSEEK_API_KEY',
            'OPENAI_API_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'SUPABASE_URL'
        ];
        
        possibleKeys.forEach(key => {
            const value = Deno.env.get(key);
            if (value) {
                allEnvVars[key] = `${value.substring(0, 15)}...${value.slice(-4)}`;
            } else {
                allEnvVars[key] = 'NOT_FOUND';
            }
        });

        return new Response(JSON.stringify({
            success: true,
            environment_variables: allEnvVars,
            deno_version: Deno.version.deno,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: {
                message: error.message,
                code: 'ENV_CHECK_FAILED'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});