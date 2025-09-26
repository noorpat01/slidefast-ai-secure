// Enhanced Research Agent with Serper API + DeepSeek
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
        const { query, depth = 'comprehensive', sources_limit = 5 } = await req.json();

        if (!query) {
            throw new Error('Query parameter is required');
        }

        const serperApiKey = Deno.env.get('SERPER_API_KEY');
        const openaiApiKey = Deno.env.get('Deepseek_Key') || Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('DEEPSEEK_API_KEY') || Deno.env.get('OPENAI_API_KEY');

        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        let results = [];
        let searchData = null;
        let useWebSearch = false;

        // Try Serper API for real-time search, fallback to AI knowledge
        if (serperApiKey) {
            try {
                const searchResponse = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': serperApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        q: query,
                        num: sources_limit * 2,
                        hl: 'en',
                        gl: 'us'
                    })
                });

                if (searchResponse.ok) {
                    searchData = await searchResponse.json();
                    results = searchData.organic || [];
                    useWebSearch = true;
                }
            } catch (error) {
                // Silently fall back to AI knowledge if Serper API fails
                console.log('Serper API failed, falling back to AI knowledge');
            }
        }

        // Create analysis prompt based on available data
        let analysisPrompt;
        if (useWebSearch && results.length > 0) {
            analysisPrompt = `You are an expert research analyst. Analyze these search results for the query: "${query}"

Search Results:
${results.slice(0, sources_limit).map((result: any, index: number) => 
    `${index + 1}. Title: ${result.title}\nSnippet: ${result.snippet}\nURL: ${result.link}\n`
).join('\n')}

Provide a comprehensive analysis including:
1. Key findings and insights
2. Source credibility assessment
3. Information gaps that need further research
4. Recommended follow-up queries
5. Factual accuracy verification

Format your response as structured JSON with the following schema:
{
  "summary": "Executive summary of findings",
  "key_insights": ["insight1", "insight2", ...],
  "source_analysis": [
    {
      "url": "source_url",
      "title": "source_title",
      "credibility_score": 0-10,
      "key_points": ["point1", "point2"],
      "relevance_score": 0-10
    }
  ],
  "information_gaps": ["gap1", "gap2", ...],
  "follow_up_queries": ["query1", "query2", ...],
  "confidence_level": 9,
  "research_quality": "high"
}`;
        } else {
            // Fallback to AI knowledge when web search is unavailable
            analysisPrompt = `You are an expert research analyst. Provide comprehensive research analysis on: "${query}"

Since real-time web search is unavailable, use your extensive knowledge base to provide insights on this topic.

Provide a comprehensive analysis including:
1. Key findings and insights based on your training data
2. Important trends or patterns in this domain
3. Expert opinions or perspectives from the field
4. Practical implications
5. Areas where real-time research would be beneficial

Format your response as structured JSON with the following schema:
{
  "summary": "Executive summary based on available knowledge",
  "key_insights": ["insight1", "insight2", ...],
  "source_analysis": [
    {
      "url": "N/A - knowledge base",
      "title": "Training data insights",
      "credibility_score": 8,
      "key_points": ["point1", "point2"],
      "relevance_score": 8
    }
  ],
  "information_gaps": ["Real-time data needed", "Current market trends"],
  "follow_up_queries": ["query1", "query2", ...],
  "confidence_level": 7,
  "research_quality": "medium"
}`;
        }

        // Call DeepSeek via OpenRouter
        const analysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://xhlpnnoskmewqkjriqxq.supabase.co',
                'X-Title': 'Enhanced AI Research Agent'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert research analyst specializing in comprehensive information analysis and source verification. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 4000
            })
        });

        if (!analysisResponse.ok) {
            throw new Error('DeepSeek analysis request failed');
        }

        const analysisData = await analysisResponse.json();
        const rawContent = analysisData.choices[0].message.content;
        
        // Helper to clean markdown-wrapped JSON
        const cleanJsonContent = (content: string) => {
            return content.replace(/^```json\s*|```$/g, '').trim();
        };
        
        const analysisResult = JSON.parse(cleanJsonContent(rawContent));

        const researchResult = {
            query,
            timestamp: new Date().toISOString(),
            search_results: results.slice(0, sources_limit),
            analysis: analysisResult,
            metadata: {
                total_results: results.length,
                sources_analyzed: sources_limit,
                research_depth: depth,
                api_version: 'enhanced-v2.0'
            }
        };

        return new Response(JSON.stringify({ data: researchResult }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Research agent error:', error);
        
        const errorResponse = {
            error: {
                code: 'RESEARCH_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});