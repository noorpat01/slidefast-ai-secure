// OAuth Debug Function
// This function helps diagnose OAuth configuration issues

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
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    
    // Get environment variables for debugging
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const debugInfo = {
      method: req.method,
      url: url.href,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      authHeader: authHeader ? 'Present' : 'Missing',
      supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
      supabaseAnonKey: supabaseAnonKey ? 'Present' : 'Missing',
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries())
    };

    // Check if this is an OAuth callback
    if (url.searchParams.has('access_token')) {
      debugInfo.oauthCallback = {
        accessToken: 'Present',
        tokenType: url.searchParams.get('token_type'),
        expiresIn: url.searchParams.get('expires_in'),
        refreshToken: url.searchParams.has('refresh_token') ? 'Present' : 'Missing'
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      debug: debugInfo,
      message: 'OAuth debug information collected'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: {
        code: 'OAUTH_DEBUG_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});