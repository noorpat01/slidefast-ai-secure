// Enhanced AI System Activation
// Adds the Serper API key and tests full system functionality

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
    const deepseekKey = Deno.env.get('OPENAI_API_KEY'); // Using OpenRouter with DeepSeek
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    // System status check
    const systemStatus = {
      timestamp: new Date().toISOString(),
      environmentCheck: {
        DEEPSEEK_API_KEY: {
          configured: !!deepseekKey,
          status: deepseekKey ? 'Available (via OpenRouter)' : 'Missing'
        },
        SERPER_API_KEY: {
          configured: !!serperKey,
          status: serperKey ? 'Available' : 'Missing'
        },
        SUPABASE_CREDENTIALS: {
          configured: !!(supabaseUrl && supabaseAnonKey),
          status: (supabaseUrl && supabaseAnonKey) ? 'Available' : 'Missing'
        }
      }
    };

    // Test API connectivity
    let connectivityTests = {
      deepseek: { status: 'not_tested', error: null },
      serper: { status: 'not_tested', error: null }
    };

    // Test DeepSeek API via OpenRouter
    if (deepseekKey) {
      try {
        const deepseekResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekKey}`,
            'HTTP-Referer': 'https://hbekiobfacrjaeskgtru.supabase.co',
            'X-Title': 'Enhanced AI System Test',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: 'Test message for Enhanced AI system activation' }],
            max_tokens: 10
          })
        });
        
        if (deepseekResponse.ok) {
          connectivityTests.deepseek.status = 'success';
        } else {
          connectivityTests.deepseek.status = 'failed';
          connectivityTests.deepseek.error = `HTTP ${deepseekResponse.status}`;
        }
      } catch (error) {
        connectivityTests.deepseek.status = 'error';
        connectivityTests.deepseek.error = error.message;
      }
    }

    // Test Serper API
    try {
      const serperResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: 'Enhanced AI test query',
          num: 3
        })
      });
      
      if (serperResponse.ok) {
        connectivityTests.serper.status = 'success';
        const searchData = await serperResponse.json();
        connectivityTests.serper.sampleResults = searchData.organic?.length || 0;
      } else {
        connectivityTests.serper.status = 'failed';
        connectivityTests.serper.error = `HTTP ${serperResponse.status}`;
      }
    } catch (error) {
      connectivityTests.serper.status = 'error';
      connectivityTests.serper.error = error.message;
    }

    // Determine overall system readiness
    const allSystemsOperational = 
      connectivityTests.deepseek.status === 'success' &&
      connectivityTests.serper.status === 'success';

    const enhancedAIStatus = {
      fullyOperational: allSystemsOperational,
      capabilities: {
        knowledgeBasedResearch: connectivityTests.deepseek.status === 'success',
        realTimeWebSearch: connectivityTests.serper.status === 'success',
        contentGeneration: connectivityTests.deepseek.status === 'success',
        qualityValidation: connectivityTests.deepseek.status === 'success',
        iterativeRefinement: connectivityTests.deepseek.status === 'success',
        expertResearchMode: allSystemsOperational
      },
      readyForTesting: allSystemsOperational
    };

    const result = {
      systemStatus,
      connectivityTests,
      enhancedAIStatus,
      activationStatus: allSystemsOperational ? 'FULLY_ACTIVATED' : 'PARTIAL_ACTIVATION',
      nextSteps: allSystemsOperational ? 
        ['Enhanced AI system is fully operational', 'Ready for user testing', 'All features available'] :
        ['Check API key configurations', 'Verify network connectivity', 'Review error messages above']
    };

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Activation test error:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'ACTIVATION_ERROR',
          message: error.message,
          details: 'Failed to complete Enhanced AI system activation test'
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});