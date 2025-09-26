// OAuth Configuration Helper
// This function helps configure and test OAuth settings

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
    const { action, data } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      return new Response(JSON.stringify({
        error: 'Service role key not available for configuration'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check_auth_config') {
      // Check current auth configuration
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const config = await response.json();
        return new Response(JSON.stringify({
          success: true,
          config: config
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'Failed to fetch auth config',
          status: response.status
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (action === 'fix_oauth_config') {
      // Update OAuth configuration
      const configUpdate = {
        SITE_URL: 'https://slidefast.ai',
        URI_ALLOW_LIST: 'https://slidefast.ai,https://slidefast.ai/**',
        EXTERNAL_GOOGLE_ENABLED: true,
        EXTERNAL_GOOGLE_CLIENT_ID: data.clientId,
        EXTERNAL_GOOGLE_SECRET: data.clientSecret,
        EXTERNAL_GOOGLE_REDIRECT_URI: 'https://slidefast.ai/auth/callback'
      };
      
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configUpdate)
      });
      
      if (response.ok) {
        return new Response(JSON.stringify({
          success: true,
          message: 'OAuth configuration updated successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        const error = await response.text();
        return new Response(JSON.stringify({
          error: 'Failed to update OAuth config',
          details: error,
          status: response.status
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      error: 'Invalid action. Use "check_auth_config" or "fix_oauth_config"'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'AUTH_CONFIG_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});