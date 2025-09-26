// API Diagnostic Function
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
        const serperApiKey = Deno.env.get('SERPER_API_KEY');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        
        const diagnosticResults = {
            environment_check: {
                serper_key_exists: !!serperApiKey,
                serper_key_length: serperApiKey ? serperApiKey.length : 0,
                serper_key_starts_with: serperApiKey ? serperApiKey.substring(0, 4) + '...' : 'N/A',
                openai_key_exists: !!openaiApiKey,
                openai_key_length: openaiApiKey ? openaiApiKey.length : 0,
                openai_key_starts_with: openaiApiKey ? openaiApiKey.substring(0, 4) + '...' : 'N/A'
            },
            serper_test: null,
            deepseek_test: null
        };

        // Test Serper API if key exists
        if (serperApiKey) {
            try {
                const searchResponse = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': serperApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        q: 'test query',
                        num: 3,
                        hl: 'en',
                        gl: 'us'
                    })
                });

                diagnosticResults.serper_test = {
                    status: searchResponse.status,
                    success: searchResponse.ok,
                    response_headers: Object.fromEntries(searchResponse.headers.entries())
                };

                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    diagnosticResults.serper_test.results_count = searchData.organic ? searchData.organic.length : 0;
                } else {
                    const errorText = await searchResponse.text();
                    diagnosticResults.serper_test.error = errorText;
                }
            } catch (error) {
                diagnosticResults.serper_test = { error: error.message };
            }
        }

        // Test DeepSeek/OpenRouter API if key exists
        if (openaiApiKey) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://xhlpnnoskmewqkjriqxq.supabase.co',
                        'X-Title': 'Slidefast AI Enhancement'
                    },
                    body: JSON.stringify({
                        model: 'deepseek/deepseek-chat',
                        messages: [
                            { role: 'user', content: 'Test message' }
                        ],
                        max_tokens: 10
                    })
                });

                diagnosticResults.deepseek_test = {
                    status: response.status,
                    success: response.ok,
                    response_headers: Object.fromEntries(response.headers.entries())
                };

                if (!response.ok) {
                    const errorText = await response.text();
                    diagnosticResults.deepseek_test.error = errorText;
                }
            } catch (error) {
                diagnosticResults.deepseek_test = { error: error.message };
            }
        }

        return new Response(JSON.stringify({ data: diagnosticResults }, null, 2), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});