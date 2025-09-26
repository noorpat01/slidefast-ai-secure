// Enhanced AI System Configuration Diagnostic
// Checks environment variables and system readiness

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
    // Check current environment variables
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    // Environment variable status
    const envStatus = {
      OPENAI_API_KEY: {
        configured: !!openaiKey,
        length: openaiKey ? openaiKey.length : 0,
        prefix: openaiKey ? openaiKey.substring(0, 7) + '...' : 'Not set'
      },
      SERPER_API_KEY: {
        configured: !!serperKey,
        length: serperKey ? serperKey.length : 0,
        prefix: serperKey ? serperKey.substring(0, 7) + '...' : 'Not set'
      },
      SUPABASE_URL: {
        configured: !!supabaseUrl,
        value: supabaseUrl ? 'Set' : 'Not set'
      },
      SUPABASE_ANON_KEY: {
        configured: !!supabaseAnonKey,
        length: supabaseAnonKey ? supabaseAnonKey.length : 0
      }
    };

    // Test API connectivity if keys are available
    let apiTests = {
      openaiValid: false,
      serperValid: false,
      testResults: {}
    };

    if (openaiKey) {
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          }
        });
        apiTests.openaiValid = testResponse.ok;
        apiTests.testResults.openai = testResponse.status;
      } catch (error) {
        apiTests.testResults.openai = `Error: ${error.message}`;
      }
    }

    if (serperKey) {
      try {
        const testResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: 'test query',
            num: 1
          })
        });
        apiTests.serperValid = testResponse.ok;
        apiTests.testResults.serper = testResponse.status;
      } catch (error) {
        apiTests.testResults.serper = `Error: ${error.message}`;
      }
    }

    const systemStatus = {
      fullyOperational: apiTests.openaiValid && apiTests.serperValid,
      partiallyOperational: apiTests.openaiValid && !apiTests.serperValid,
      notOperational: !apiTests.openaiValid,
      capabilities: {
        knowledgeBasedResearch: apiTests.openaiValid,
        realTimeWebSearch: apiTests.serperValid,
        contentGeneration: apiTests.openaiValid,
        qualityValidation: apiTests.openaiValid,
        iterativeRefinement: apiTests.openaiValid
      }
    };

    const result = {
      timestamp: new Date().toISOString(),
      environmentVariables: envStatus,
      apiConnectivity: apiTests,
      systemStatus: systemStatus,
      instructions: {
        message: 'To activate Enhanced AI system, set environment variables in Supabase Dashboard',
        steps: [
          '1. Go to Supabase Dashboard → Project Settings → Environment Variables',
          '2. Add OPENAI_API_KEY with your OpenAI API key',
          '3. Add SERPER_API_KEY with your Serper API key',
          '4. Deploy edge functions to apply changes',
          '5. Test the enhanced system'
        ]
      }
    };

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Diagnostic error:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'DIAGNOSTIC_ERROR',
          message: error.message,
          details: 'Failed to run Enhanced AI system diagnostic'
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});