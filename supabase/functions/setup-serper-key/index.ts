// Temporary function to set up SERPER_API_KEY
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

        // Set the SERPER_API_KEY as a project secret
        const serperKey = 'b5bb347f6b9206548be5619732cdba2aec94ec1405ba5002aaf185feb11b11b7';
        
        const response = await fetch(`${supabaseUrl}/v1/projects/secrets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([
                {
                    name: 'SERPER_API_KEY',
                    value: serperKey
                }
            ])
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to set SERPER_API_KEY: ${error}`);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'SERPER_API_KEY configured successfully' 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});