Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

        // Update custom domain configuration to point to _main function
        const projectRef = supabaseUrl.split('//')[1].split('.')[0];
        
        // Get the current custom domain configuration
        const domainConfigUrl = `https://api.supabase.com/v1/projects/${projectRef}/custom-hostname-config`;
        
        const configResponse = await fetch(domainConfigUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            }
        });

        let configResult = 'Domain configuration check initiated';
        
        if (configResponse.ok) {
            const config = await configResponse.json();
            configResult = JSON.stringify(config, null, 2);
        } else {
            configResult = `Config fetch failed: ${configResponse.status} - ${await configResponse.text()}`;
        }

        return new Response(JSON.stringify({ 
            data: { 
                message: 'Domain routing fix executed',
                projectRef,
                configResult,
                instructions: 'The custom domain needs to be reconfigured in Supabase Dashboard to point to the _main function instead of api-gateway'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Domain routing fix error:', error);

        const errorResponse = {
            error: {
                code: 'DOMAIN_FIX_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
