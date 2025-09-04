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
    const { action, text, voice_id, speed = 1.0, pitch = 1.0 } = await req.json();

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const miniMaxApiKey = Deno.env.get('MINIMAX_API_KEY');
    
    if (!supabaseUrl || !serviceRoleKey || !miniMaxApiKey) {
      throw new Error('Missing required environment variables');
    }

    if (action === 'get_voices') {
      // Get available voices from MiniMax API
      const voicesResponse = await fetch('https://api.minimax.chat/v1/t2a_pro/voices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${miniMaxApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!voicesResponse.ok) {
        throw new Error(`Failed to get voices: ${voicesResponse.statusText}`);
      }

      const voicesData = await voicesResponse.json();

      return new Response(JSON.stringify({ 
        data: {
          voices: voicesData.data || voicesData.voices || voicesData
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate_audio') {
      if (!text || !voice_id) {
        throw new Error('Text and voice_id are required for audio generation');
      }

      // Generate audio using MiniMax API
      const audioResponse = await fetch('https://api.minimax.chat/v1/t2a_pro', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${miniMaxApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice_id: voice_id,
          speed: speed,
          pitch: pitch,
          audio_format: 'mp3'
        })
      });

      if (!audioResponse.ok) {
        const errorText = await audioResponse.text();
        throw new Error(`Failed to generate audio: ${audioResponse.statusText} - ${errorText}`);
      }

      const audioData = await audioResponse.json();
      
      // Return the audio URL or base64 data
      return new Response(JSON.stringify({ 
        data: {
          audio_url: audioData.audio_url,
          audio_data: audioData.audio_data,
          duration: audioData.duration || 0,
          status: 'success'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action. Use "get_voices" or "generate_audio"');

  } catch (error) {
    console.error('Voice narration error:', error);

    const errorResponse = {
      error: {
        code: 'VOICE_NARRATION_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});