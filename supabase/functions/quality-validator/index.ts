// Enhanced Quality Validator with DeepSeek
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
        const { 
            content, 
            content_type = 'article',
            validation_criteria = {
                accuracy: true,
                readability: true,
                engagement: true,
                structure: true,
                originality: true,
                seo_optimization: true
            },
            target_quality_score = 8.0
        } = await req.json();

        if (!content) {
            throw new Error('Content parameter is required');
        }

        const openaiApiKey = Deno.env.get('Deepseek_Key') || 
                             Deno.env.get('FRESH_DEEPSEEK_API_KEY') || 
                             Deno.env.get('NEW_DEEPSEEK_API_KEY_2') || 
                             Deno.env.get('DEEPSEEK_API_KEY') || 
                             Deno.env.get('OPENROUTER_API_KEY') || 
                             Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Enhanced quality validation prompt
        const validationPrompt = `You are an expert content quality analyst with extensive experience in ${content_type} evaluation. Perform a comprehensive quality assessment of the following content:

Content to Evaluate:
${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}

Validation Criteria:
${Object.entries(validation_criteria)
    .filter(([_, enabled]) => enabled)
    .map(([criterion, _]) => `- ${criterion.charAt(0).toUpperCase() + criterion.slice(1).replace('_', ' ')}`)
    .join('\n')}

Target Quality Score: ${target_quality_score}/10

Perform detailed analysis in these areas:

1. **Content Accuracy**: Fact-checking, source verification, logical consistency
2. **Readability**: Clarity, flow, sentence structure, vocabulary appropriateness
3. **Engagement**: Hook effectiveness, storytelling, emotional resonance
4. **Structure**: Organization, transitions, section balance
5. **Originality**: Uniqueness, fresh perspectives, creative elements
6. **SEO Optimization**: Keyword usage, meta elements, search optimization
7. **Technical Quality**: Grammar, spelling, formatting, citations

Provide your assessment as structured JSON:
{
  "overall_quality_score": 0-10,
  "meets_target_quality": true/false,
  "detailed_scores": {
    "accuracy": {
      "score": 0-10,
      "assessment": "detailed assessment",
      "issues_found": ["issue1", "issue2"],
      "recommendations": ["rec1", "rec2"]
    },
    "readability": {
      "score": 0-10,
      "assessment": "detailed assessment",
      "reading_level": "grade level or description",
      "improvements": ["improvement1", "improvement2"]
    },
    "engagement": {
      "score": 0-10,
      "assessment": "detailed assessment",
      "strengths": ["strength1", "strength2"],
      "enhancement_opportunities": ["opp1", "opp2"]
    },
    "structure": {
      "score": 0-10,
      "assessment": "detailed assessment",
      "organization_quality": "excellent|good|fair|poor",
      "flow_issues": ["issue1", "issue2"]
    },
    "originality": {
      "score": 0-10,
      "assessment": "detailed assessment",
      "uniqueness_factors": ["factor1", "factor2"],
      "creative_elements": ["element1", "element2"]
    },
    "seo_optimization": {
      "score": 0-10,
      "assessment": "detailed assessment",
      "optimization_opportunities": ["opp1", "opp2"],
      "keyword_effectiveness": 0-10
    }
  },
  "critical_issues": [
    {
      "severity": "high|medium|low",
      "category": "category name",
      "description": "issue description",
      "suggested_fix": "how to fix"
    }
  ],
  "improvement_plan": {
    "priority_actions": ["action1", "action2"],
    "quick_wins": ["win1", "win2"],
    "long_term_enhancements": ["enhancement1", "enhancement2"]
  },
  "quality_certification": {
    "approved_for_publication": true/false,
    "confidence_level": 0-10,
    "reviewer_notes": "additional notes"
  }
}`;

        // Validate content with DeepSeek
        const validationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://xhlpnnoskmewqkjriqxq.supabase.co',
                'X-Title': 'Enhanced AI Quality Validator'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are a world-class content quality analyst with expertise in comprehensive content evaluation. You excel at identifying quality issues, providing actionable feedback, and ensuring content meets professional standards. Always respond with valid JSON only.`
                    },
                    {
                        role: 'user',
                        content: validationPrompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 4000
            })
        });

        if (!validationResponse.ok) {
            throw new Error('DeepSeek validation request failed');
        }

        const validationData = await validationResponse.json();
        const rawContent = validationData.choices[0].message.content;
        
        // Helper to clean markdown-wrapped JSON
        const cleanJsonContent = (content: string) => {
            return content.replace(/^```json\s*|```$/g, '').trim();
        };
        
        const validationResult = JSON.parse(cleanJsonContent(rawContent));

        // Enhance with validation metadata
        const enhancedResult = {
            ...validationResult,
            validation_metadata: {
                content_type,
                target_quality_score,
                validation_criteria,
                validation_timestamp: new Date().toISOString(),
                model_used: 'deepseek-chat',
                api_version: 'enhanced-v2.0',
                content_length: typeof content === 'string' ? content.length : JSON.stringify(content).length
            }
        };

        return new Response(JSON.stringify({ data: enhancedResult }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Quality validator error:', error);
        
        const errorResponse = {
            error: {
                code: 'VALIDATION_FAILED',
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