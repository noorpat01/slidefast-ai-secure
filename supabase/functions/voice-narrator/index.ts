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
        const { presentationId, slideId, narrationText, voiceSettings = {} } = await req.json();

        if (!presentationId || !narrationText) {
            throw new Error('Presentation ID and narration text are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
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

        // Create initial narration record
        const narrationRecord = {
            presentation_id: presentationId,
            slide_id: slideId,
            user_id: userId,
            narration_text: narrationText,
            voice_settings: {
                voice: voiceSettings.voice || 'professional_female',
                speed: voiceSettings.speed || 1.0,
                tone: voiceSettings.tone || 'neutral',
                language: voiceSettings.language || 'en-US'
            },
            status: 'generating'
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/voice_narrations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(narrationRecord)
        });

        if (!insertResponse.ok) {
            throw new Error('Failed to create narration record');
        }

        const narrationData = await insertResponse.json();
        const narrationId = narrationData[0].id;

        // For now, we'll use a text-to-speech simulation since MiniMax Audio API is not directly available in edge functions
        // In a production environment, this would integrate with a real TTS service
        
        try {
            // Simulate audio generation processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Calculate estimated duration (rough estimate: 150 words per minute)
            const wordCount = narrationText.split(/\s+/).length;
            const estimatedDuration = Math.ceil((wordCount / 150) * 60);

            // Generate a placeholder audio URL (in production, this would be the actual audio file)
            const audioFileName = `narration_${narrationId}_${Date.now()}.mp3`;
            const placeholderAudioUrl = `${supabaseUrl}/storage/v1/object/public/narrations/${audioFileName}`;

            // Update narration record with completion
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/voice_narrations?id=eq.${narrationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    audio_url: placeholderAudioUrl,
                    duration_seconds: estimatedDuration,
                    status: 'ready',
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update narration record');
            }

            const updatedNarration = await updateResponse.json();

            return new Response(JSON.stringify({
                data: {
                    narration_id: narrationId,
                    audio_url: placeholderAudioUrl,
                    duration_seconds: estimatedDuration,
                    status: 'ready',
                    voice_settings: narrationRecord.voice_settings,
                    message: 'Voice narration generated successfully. Note: This is a development implementation. Production version will include actual audio generation.'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (generationError) {
            console.error('Audio generation error:', generationError);
            
            // Update status to failed
            await fetch(`${supabaseUrl}/rest/v1/voice_narrations?id=eq.${narrationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'failed',
                    updated_at: new Date().toISOString()
                })
            });

            throw new Error(`Audio generation failed: ${generationError.message}`);
        }

    } catch (error) {
        console.error('Voice narration error:', error);

        const errorResponse = {
            error: {
                code: 'VOICE_NARRATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});