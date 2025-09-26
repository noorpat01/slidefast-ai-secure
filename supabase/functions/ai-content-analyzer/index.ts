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
        const { presentationId, slideId, content, analysisType = 'content' } = await req.json();

        if (!presentationId || !content) {
            throw new Error('Presentation ID and content are required');
        }

        // Get environment variables
        const deepseekApiKey = Deno.env.get('Deepseek_Key') || 
                               Deno.env.get('FRESH_DEEPSEEK_API_KEY') || 
                               Deno.env.get('NEW_DEEPSEEK_API_KEY_2') || 
                               Deno.env.get('DEEPSEEK_API_KEY') || 
                               Deno.env.get('OPENROUTER_API_KEY') || 
                               Deno.env.get('OPENAI_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!deepseekApiKey) {
            throw new Error('DeepSeek API key not found');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Create content hash for caching
        const contentText = typeof content === 'string' ? content : JSON.stringify(content);
        const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentText + analysisType));
        const hashArray = Array.from(new Uint8Array(contentHash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check cache first
        const cacheResponse = await fetch(`${supabaseUrl}/rest/v1/ai_analysis_cache?content_hash=eq.${hashHex}&analysis_type=eq.${analysisType}&expires_at=gt.${new Date().toISOString()}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (cacheResponse.ok) {
            const cacheData = await cacheResponse.json();
            if (cacheData && cacheData.length > 0) {
                console.log('Cache hit for content analysis');
                return new Response(JSON.stringify({
                    data: {
                        suggestions: cacheData[0].analysis_result.suggestions,
                        analysis: cacheData[0].analysis_result.analysis,
                        cached: true
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // AI Analysis using OpenRouter with DeepSeek
        let systemPrompt = '';
        let analysisPrompt = '';
        
        if (analysisType === 'content') {
            systemPrompt = `You are an expert presentation consultant for Slidefast. Analyze presentation content and provide actionable suggestions to improve clarity, engagement, and impact. Focus on practical improvements that enhance the presentation's effectiveness.`;
            
            analysisPrompt = `Analyze this presentation content and provide specific improvement suggestions:

Content: ${contentText}

Provide response in JSON format:
{
  "suggestions": [
    {
      "type": "content",
      "category": "headline|bullet_point|transition|structure|clarity",
      "text": "specific suggestion text",
      "reason": "why this improvement helps",
      "priority": 1-5
    }
  ],
  "analysis": {
    "strengths": ["list strengths"],
    "improvements": ["list key improvement areas"],
    "tone": "professional|casual|academic|persuasive",
    "clarity_score": 1-10,
    "engagement_score": 1-10
  }
}`;
        } else if (analysisType === 'design') {
            systemPrompt = `You are a professional presentation designer for Slidefast. Analyze content and suggest optimal design approaches, color schemes, layouts, and visual hierarchy that enhance message delivery.`;
            
            analysisPrompt = `Analyze this presentation content for design recommendations:

Content: ${contentText}

Provide response in JSON format:
{
  "suggestions": [
    {
      "type": "design",
      "category": "color_palette|layout|typography|image_placement|visual_hierarchy",
      "recommendation": "specific design suggestion",
      "rationale": "design reasoning",
      "priority": 1-5,
      "auto_applicable": true|false
    }
  ],
  "analysis": {
    "content_type": "business|educational|creative|technical",
    "recommended_style": "modern|classic|minimalist|bold",
    "color_suggestions": ["#color1", "#color2", "#color3"],
    "layout_recommendation": "text-heavy|image-focused|balanced|data-driven"
  }
}`;
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${deepseekApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://slidefast.ai',
                'X-Title': 'Slidefast AI Analysis'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: analysisPrompt }
                ],
                max_tokens: 800,
                temperature: 0.7
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        let analysisResult;
        
        try {
            const responseText = aiData.choices[0].message.content;
            // Clean the response to extract JSON
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No valid JSON found in AI response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiData.choices[0].message.content);
            // Fallback structured response
            analysisResult = {
                suggestions: [{
                    type: analysisType,
                    category: 'general',
                    text: 'AI analysis temporarily unavailable. Please try again.',
                    reason: 'Technical issue with AI response parsing',
                    priority: 3
                }],
                analysis: {
                    strengths: ['Content structure is present'],
                    improvements: ['AI analysis will be restored shortly'],
                    clarity_score: 7,
                    engagement_score: 7
                }
            };
        }

        // Cache the result
        await fetch(`${supabaseUrl}/rest/v1/ai_analysis_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                presentation_id: presentationId,
                content_hash: hashHex,
                analysis_type: analysisType,
                analysis_result: analysisResult
            })
        });

        // Save suggestions to database
        if (analysisResult.suggestions && analysisResult.suggestions.length > 0) {
            const suggestions = analysisResult.suggestions.map(suggestion => ({
                presentation_id: presentationId,
                slide_id: slideId,
                user_id: userId,
                suggestion_type: suggestion.type || analysisType,
                suggestion_data: {
                    category: suggestion.category,
                    text: suggestion.text || suggestion.recommendation,
                    reason: suggestion.reason || suggestion.rationale,
                    priority: suggestion.priority || 3,
                    auto_applicable: suggestion.auto_applicable || false
                },
                confidence_score: 0.85
            }));

            await fetch(`${supabaseUrl}/rest/v1/ai_suggestions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(suggestions)
            });
        }

        return new Response(JSON.stringify({
            data: {
                suggestions: analysisResult.suggestions,
                analysis: analysisResult.analysis,
                cached: false
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI content analysis error:', error);

        const errorResponse = {
            error: {
                code: 'AI_ANALYSIS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});