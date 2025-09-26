// OAuth Flow Diagnostic Tool
// Analyzes OAuth callback errors and provides specific guidance

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
    const { callbackUrl, error } = await req.json();
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      site: 'slidefast.ai',
      issues: [],
      recommendations: []
    };

    // Analyze the callback URL if provided
    if (callbackUrl) {
      const callbackURL = new URL(callbackUrl);
      
      diagnosis.callbackAnalysis = {
        domain: callbackURL.hostname,
        path: callbackURL.pathname,
        hasAccessToken: callbackURL.searchParams.has('access_token'),
        hasRefreshToken: callbackURL.searchParams.has('refresh_token'),
        hasError: callbackURL.searchParams.has('error'),
        tokenType: callbackURL.searchParams.get('token_type'),
        expiresIn: callbackURL.searchParams.get('expires_in')
      };

      // Check for common issues
      if (callbackURL.hostname !== 'slidefast.ai') {
        diagnosis.issues.push('Domain mismatch: OAuth callback should be on slidefast.ai');
        diagnosis.recommendations.push('Update Google OAuth settings to use https://slidefast.ai as the authorized domain');
      }

      if (callbackURL.pathname !== '/auth/callback') {
        diagnosis.issues.push('Incorrect callback path: ' + callbackURL.pathname);
        diagnosis.recommendations.push('Update redirect URI to https://slidefast.ai/auth/callback in Google OAuth settings');
      }

      if (callbackURL.searchParams.has('error')) {
        diagnosis.issues.push('OAuth error: ' + callbackURL.searchParams.get('error'));
        diagnosis.recommendations.push('Check Google OAuth console for error details');
      }

      if (!callbackURL.searchParams.has('access_token') && !callbackURL.searchParams.has('error')) {
        diagnosis.issues.push('No access token or error in callback - possible configuration issue');
        diagnosis.recommendations.push('Verify Google OAuth client configuration in Supabase dashboard');
      }
    }

    // Analyze the error message
    if (error && error.includes('Unable to establish session')) {
      diagnosis.issues.push('Session establishment failure after OAuth callback');
      diagnosis.recommendations.push(
        'This typically means:',
        '1. Check that Google OAuth is enabled in Supabase Auth settings',
        '2. Verify the Google Client ID and Secret are correctly configured',
        '3. Ensure the redirect URI in Google Console matches: https://hbekiobfacrjaeskgtru.supabase.co/auth/v1/callback',
        '4. Check that slidefast.ai is in the allowed origins list in Supabase Auth settings'
      );
    }

    // Provide specific configuration guidance
    diagnosis.configurationChecklist = {
      'Google OAuth Console': {
        'Authorized JavaScript origins': ['https://slidefast.ai'],
        'Authorized redirect URIs': ['https://hbekiobfacrjaeskgtru.supabase.co/auth/v1/callback'],
        'Client ID': 'Must be configured in Supabase',
        'Client Secret': 'Must be configured in Supabase'
      },
      'Supabase Auth Settings': {
        'Site URL': 'https://slidefast.ai',
        'Additional Redirect URLs': 'https://slidefast.ai/**',
        'Google OAuth': 'Must be enabled with correct Client ID/Secret'
      }
    };

    return new Response(JSON.stringify({
      success: true,
      diagnosis: diagnosis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'DIAGNOSIS_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});