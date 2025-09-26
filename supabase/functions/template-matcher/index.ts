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
        const { presentationId, content, title, existingSlides = [] } = await req.json();

        if (!presentationId || !content) {
            throw new Error('Presentation ID and content are required');
        }

        // Get environment variables
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!deepseekApiKey) {
            throw new Error('DEEPSEEK_API_KEY not found');
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

        // Get available templates from database
        const templatesResponse = await fetch(`${supabaseUrl}/rest/v1/templates?select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        let availableTemplates = [];
        if (templatesResponse.ok) {
            availableTemplates = await templatesResponse.json();
        }

        // Prepare content analysis for AI
        const contentAnalysis = {
            title: title || 'Untitled Presentation',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            slide_count: existingSlides.length,
            slide_types: existingSlides.map(slide => slide.type || 'content'),
            available_templates: availableTemplates.map(template => ({
                id: template.id,
                name: template.name,
                category: template.category,
                style: template.style_data?.theme || 'professional',
                best_for: template.description
            }))
        };

        const systemPrompt = `You are an expert presentation designer for Slidefast. Analyze presentation content and recommend the most suitable templates based on content type, industry, purpose, and visual requirements. Consider the presentation's tone, audience, and message when making recommendations.`;

        const analysisPrompt = `Analyze this presentation and recommend the best templates:

Presentation Analysis:
${JSON.stringify(contentAnalysis, null, 2)}

Provide response in JSON format:
{
  "content_analysis": {
    "industry": "business|education|technology|healthcare|creative|nonprofit|government",
    "purpose": "sales_pitch|report|training|proposal|showcase|academic|marketing",
    "tone": "professional|casual|formal|creative|technical|inspiring",
    "audience": "executives|students|clients|colleagues|public|stakeholders",
    "content_density": "text_heavy|visual_focused|data_driven|balanced"
  },
  "template_recommendations": [
    {
      "template_id": "template_id_from_available_templates",
      "match_score": 1-100,
      "reasons": ["why this template is suitable"],
      "style_adjustments": ["suggested modifications"],
      "priority": "high|medium|low"
    }
  ],
  "design_guidance": {
    "color_palette": "suggested color approach",
    "layout_style": "recommended layout approach",
    "typography": "font style recommendations",
    "imagery": "image usage suggestions"
  }
}`;

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${deepseekApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://slidefast.ai',
                'X-Title': 'Slidefast Template Matching'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: analysisPrompt }
                ],
                max_tokens: 1000,
                temperature: 0.6
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        let matchingResult;
        
        try {
            const responseText = aiData.choices[0].message.content;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                matchingResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No valid JSON found in AI response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiData.choices[0].message.content);
            // Fallback response with general recommendations
            matchingResult = {
                content_analysis: {
                    industry: 'business',
                    purpose: 'presentation',
                    tone: 'professional',
                    audience: 'colleagues',
                    content_density: 'balanced'
                },
                template_recommendations: availableTemplates.slice(0, 3).map((template, index) => ({
                    template_id: template.id,
                    match_score: 85 - (index * 10),
                    reasons: ['Professional appearance', 'Versatile layout', 'Clean design'],
                    style_adjustments: ['Consider your brand colors', 'Add relevant imagery'],
                    priority: index === 0 ? 'high' : 'medium'
                })),
                design_guidance: {
                    color_palette: 'Professional blues and grays',
                    layout_style: 'Clean and structured',
                    typography: 'Modern and readable',
                    imagery: 'High-quality and relevant'
                }
            };
        }

        // Save template matching result
        await fetch(`${supabaseUrl}/rest/v1/ai_suggestions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                presentation_id: presentationId,
                user_id: (await userResponse.json()).id,
                suggestion_type: 'template',
                suggestion_data: {
                    analysis: matchingResult.content_analysis,
                    recommendations: matchingResult.template_recommendations,
                    design_guidance: matchingResult.design_guidance
                },
                confidence_score: 0.90
            })
        });

        return new Response(JSON.stringify({
            data: {
                content_analysis: matchingResult.content_analysis,
                template_recommendations: matchingResult.template_recommendations,
                design_guidance: matchingResult.design_guidance,
                available_templates: availableTemplates.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Template matching error:', error);

        const errorResponse = {
            error: {
                code: 'TEMPLATE_MATCHING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});