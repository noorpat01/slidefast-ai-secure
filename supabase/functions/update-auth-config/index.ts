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
        // Get Supabase service role key and project reference
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const projectRef = Deno.env.get('SUPABASE_URL')?.split('://')[1]?.split('.')[0];
        
        if (!serviceRoleKey || !projectRef) {
            throw new Error('Missing required environment variables');
        }

        // Update Supabase Auth configuration via Management API
        const authConfigUpdateUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
        
        const authConfig = {
            SITE_URL: 'https://slidefast.ai',
            URI_ALLOW_LIST: 'https://slidefast.ai,https://xhlpnnoskmewqkjriqxq.supabase.co',
            EXTERNAL_GOOGLE_REDIRECT_URI: 'https://xhlpnnoskmewqkjriqxq.supabase.co/auth/v1/callback'
        };

        console.log('Updating auth config with:', authConfig);

        const response = await fetch(authConfigUpdateUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey
            },
            body: JSON.stringify(authConfig)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to update auth config:', response.status, errorText);
            throw new Error(`Failed to update auth config: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('Auth config updated successfully:', result);

        return new Response(JSON.stringify({
            success: true,
            message: 'Auth configuration updated successfully',
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating auth config:', error);
        const errorResponse = {
            error: {
                code: 'AUTH_CONFIG_UPDATE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});