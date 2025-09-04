import { createClient } from '@supabase/supabase-js';

interface TrackDownloadRequest {
  presentationId: string;
  format: string;
}

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser();
    const { presentationId, format }: TrackDownloadRequest = await req.json();

    // Track download event
    await supabase
      .from('analytics_events')
      .insert({
        presentation_id: presentationId,
        user_id: user?.id,
        event_type: 'presentation_download',
        event_data: {
          format,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent')
        }
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    return new Response(JSON.stringify({ 
      error: {
        code: 'TRACKING_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
