import { createClient } from '@supabase/supabase-js';

interface TogglePresentationLikeRequest {
  presentationId: string;
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
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { presentationId }: TogglePresentationLikeRequest = await req.json();

    // Check if user has already liked this presentation
    const { data: existingLike } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('user_id', user.id)
      .eq('event_type', 'presentation_like')
      .single();

    if (existingLike) {
      // Remove like
      await supabase
        .from('analytics_events')
        .delete()
        .eq('id', existingLike.id);
      
      return new Response(JSON.stringify({ success: true, action: 'unliked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Add like
      await supabase
        .from('analytics_events')
        .insert({
          presentation_id: presentationId,
          user_id: user.id,
          event_type: 'presentation_like',
          event_data: {
            timestamp: new Date().toISOString()
          }
        });
      
      return new Response(JSON.stringify({ success: true, action: 'liked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error toggling presentation like:', error);
    return new Response(JSON.stringify({ 
      error: {
        code: 'LIKE_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
