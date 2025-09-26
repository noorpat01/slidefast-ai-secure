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
    // Check available environment variables
    const envVars = {
      SUPABASE_ACCESS_TOKEN: Deno.env.get('SUPABASE_ACCESS_TOKEN') ? 'Available' : 'Missing',
      SUPABASE_PROJECT_ID: Deno.env.get('SUPABASE_PROJECT_ID') ? 'Available' : 'Missing',
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Available' : 'Missing',
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'Available' : 'Missing'
    };

    // Also check if we can determine project ID from URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const projectIdFromUrl = supabaseUrl ? supabaseUrl.split('//')[1].split('.')[0] : 'Not found';

    return new Response(JSON.stringify({
      success: true,
      message: 'Environment check complete',
      environment: envVars,
      project_id_from_url: projectIdFromUrl,
      available_keys: Object.keys(Deno.env.toObject())
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Environment check error:', error);
    const errorResponse = {
      success: false,
      error: {
        code: 'ENV_CHECK_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});