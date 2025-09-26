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

        // Asset files to upload
        const assets = [
            {
                name: 'index-Bj5kgsv4.js',
                content: 'console.log("React app will be loaded here");', // Placeholder
                contentType: 'application/javascript'
            },
            {
                name: 'index-DmrOKNDg.css',
                content: '/* React app styles will be loaded here */',
                contentType: 'text/css'
            }
        ];

        const uploadResults = [];

        for (const asset of assets) {
            try {
                const uploadResponse = await fetch(
                    `${supabaseUrl}/storage/v1/object/presentations/dist/assets/${asset.name}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': asset.contentType,
                            'Cache-Control': 'max-age=31536000'
                        },
                        body: asset.content
                    }
                );

                if (uploadResponse.ok) {
                    uploadResults.push({
                        file: asset.name,
                        status: 'success',
                        url: `${supabaseUrl}/storage/v1/object/public/presentations/dist/assets/${asset.name}`
                    });
                } else {
                    const errorText = await uploadResponse.text();
                    uploadResults.push({
                        file: asset.name,
                        status: 'error',
                        error: errorText
                    });
                }
            } catch (uploadError) {
                uploadResults.push({
                    file: asset.name,
                    status: 'error',
                    error: uploadError.message
                });
            }
        }

        return new Response(JSON.stringify({ 
            data: { 
                message: 'Upload completed',
                results: uploadResults
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upload assets error:', error);

        const errorResponse = {
            error: {
                code: 'UPLOAD_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
