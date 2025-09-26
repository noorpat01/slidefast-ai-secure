// Enhanced AI System Environment Setup
// Validates API connectivity and system readiness

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
    // Get API keys from request or environment
    const requestData = await req.json().catch(() => ({}));
    const { testKeys = false, openaiKey, serperKey } = requestData;
    
    // Check current environment
    const envOpenaiKey = Deno.env.get('OPENAI_API_KEY');
    const envSerperKey = Deno.env.get('SERPER_API_KEY');
    
    // Use provided keys for testing or fall back to environment
    const testOpenaiKey = openaiKey || envOpenaiKey;
    const testSerperKey = serperKey || envSerperKey;
    
    let keyValidation = {
      openai: { 
        available: !!testOpenaiKey,
        valid: false, 
        error: null,
        source: openaiKey ? 'provided' : (envOpenaiKey ? 'environment' : 'missing')
      },
      serper: { 
        available: !!testSerperKey,
        valid: false, 
        error: null,
        source: serperKey ? 'provided' : (envSerperKey ? 'environment' : 'missing')
      }
    };

    // Test OpenAI API key if available
    if (testOpenaiKey && testKeys) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${testOpenaiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        keyValidation.openai.valid = openaiResponse.ok;
        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          keyValidation.openai.error = `HTTP ${openaiResponse.status}: ${errorText}`;
        }
      } catch (error) {
        keyValidation.openai.error = error.message;
      }
    } else if (testOpenaiKey) {
      keyValidation.openai.valid = true; // Assume valid if not testing
    }

    // Test Serper API key if available
    if (testSerperKey && testKeys) {
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': testSerperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: 'test enhanced ai',
            num: 1
          })
        });
        
        keyValidation.serper.valid = serperResponse.ok;
        if (!serperResponse.ok) {
          const errorText = await serperResponse.text();
          keyValidation.serper.error = `HTTP ${serperResponse.status}: ${errorText}`;
        }
      } catch (error) {
        keyValidation.serper.error = error.message;
      }
    } else if (testSerperKey) {
      keyValidation.serper.valid = true; // Assume valid if not testing
    }

    // Determine system capabilities
    const systemCapabilities = {
      knowledgeBasedResearch: keyValidation.openai.available,
      realTimeWebSearch: keyValidation.serper.available,
      contentGeneration: keyValidation.openai.available,
      qualityValidation: keyValidation.openai.available,
      iterativeRefinement: keyValidation.openai.available,
      expertResearchMode: keyValidation.openai.available && keyValidation.serper.available
    };

    const operationalLevel = 
      keyValidation.openai.available && keyValidation.serper.available ? 'FULL_ENHANCED_AI' :
      keyValidation.openai.available ? 'KNOWLEDGE_BASED_AI' : 'OFFLINE';

    const setupResult = {
      timestamp: new Date().toISOString(),
      environmentCheck: {
        OPENAI_API_KEY: keyValidation.openai,
        SERPER_API_KEY: keyValidation.serper
      },
      systemStatus: {
        operationalLevel,
        capabilities: systemCapabilities,
        readyForTesting: keyValidation.openai.available
      },
      recommendations: {
        deployment: keyValidation.openai.available ? 'Deploy Enhanced AI system' : 'Configure OpenAI API key first',
        features: operationalLevel === 'FULL_ENHANCED_AI' ? 'All features available' : 
                 operationalLevel === 'KNOWLEDGE_BASED_AI' ? 'Real-time search unavailable' : 'System offline'
      },
      testInstructions: {
        message: 'To test API keys, call this function with testKeys: true and provide openaiKey and serperKey',
        example: {
          testKeys: true,
          openaiKey: 'your-openai-key',
          serperKey: 'your-serper-key'
        }
      }
    };

    return new Response(
      JSON.stringify({ data: setupResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Environment setup error:', error);
    return new Response(
      JSON.stringify({ 
        error: {
          code: 'SETUP_ERROR',
          message: error.message,
          details: 'Failed to complete Enhanced AI environment setup'
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});