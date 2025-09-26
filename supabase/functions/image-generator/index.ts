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
        const { prompt, style, size, quality } = await req.json();

        if (!prompt) {
            throw new Error('Image prompt is required');
        }

        // Get environment variables
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                userId = userData.id;
            }
        }

        // Enhanced prompt with style preferences
        const stylePrompts = {
            professional: "professional, clean, business-appropriate, high-quality",
            creative: "creative, artistic, vibrant, imaginative",
            minimal: "minimalist, simple, clean, modern",
            technical: "technical, detailed, precise, informative"
        };

        const enhancedPrompt = `${prompt}, ${stylePrompts[style || 'professional']}, suitable for presentation slides, high resolution, clean composition`;

        // Call OpenAI DALL-E API
        const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: enhancedPrompt,
                n: 1,
                size: size || '1024x1024',
                quality: quality || 'standard',
                response_format: 'url'
            })
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${errorText}`);
        }

        const openaiResult = await openaiResponse.json();
        const imageUrl = openaiResult.data[0].url;
        const revisedPrompt = openaiResult.data[0].revised_prompt;

        // Download and store image in Supabase Storage
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageData = new Uint8Array(imageBuffer);
        
        const fileName = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        
        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/presentations/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'image/png',
                'x-upsert': 'true'
            },
            body: imageData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.warn('Storage upload failed, using temporary URL:', errorText);
            // Return temporary OpenAI URL if storage fails
            return new Response(JSON.stringify({
                data: {
                    image_url: imageUrl,
                    is_temporary: true,
                    prompt: enhancedPrompt,
                    revised_prompt: revisedPrompt,
                    style: style || 'professional',
                    size: size || '1024x1024'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/presentations/${fileName}`;

        // Track usage if user is authenticated
        if (userId && serviceRoleKey) {
            try {
                await fetch(`${supabaseUrl}/rest/v1/usage_tracking`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        action_type: 'image_generation',
                        tokens_used: 1 // Count image generation as 1 token equivalent
                    })
                });
            } catch (trackingError) {
                console.warn('Usage tracking failed:', trackingError.message);
            }
        }

        return new Response(JSON.stringify({
            data: {
                image_url: publicUrl,
                is_temporary: false,
                prompt: enhancedPrompt,
                revised_prompt: revisedPrompt,
                style: style || 'professional',
                size: size || '1024x1024',
                file_name: fileName
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Image generation error:', error);

        const errorResponse = {
            error: {
                code: 'IMAGE_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});