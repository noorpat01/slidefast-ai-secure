// Enhanced Content Generator with DeepSeek
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
            topic, 
            research_data, 
            content_type = 'article', 
            style = 'professional',
            target_audience = 'general',
            word_count = 800,
            include_sections = ['introduction', 'main_content', 'conclusion'],
            citations_required = true
        } = await req.json();

        if (!topic) {
            throw new Error('Topic parameter is required');
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

        // Enhanced content generation prompt
        const contentPrompt = `You are an expert content creator specializing in ${content_type} writing. Create exceptional content on the following topic:

Topic: ${topic}
Content Type: ${content_type}
Style: ${style}
Target Audience: ${target_audience}
Word Count Target: ${word_count}
Required Sections: ${include_sections.join(', ')}

${research_data ? `Research Data Available:\n${JSON.stringify(research_data, null, 2)}\n` : ''}

Content Creation Guidelines:
1. Create engaging, well-structured content that flows naturally
2. Use clear, compelling headlines and subheadings
3. Include relevant examples, statistics, and insights
4. Maintain consistent tone and style throughout
5. Ensure factual accuracy and cite sources when available
6. Optimize for readability and engagement
7. Include actionable takeaways where appropriate

${citations_required && research_data ? 'Include proper citations for all research-based claims.' : ''}

Format your response as structured JSON:
{
  "title": "Compelling main title",
  "subtitle": "Engaging subtitle (optional)",
  "meta_description": "SEO-optimized meta description",
  "content": {
    "introduction": "Engaging introduction that hooks the reader",
    "main_sections": [
      {
        "heading": "Section heading",
        "content": "Section content with detailed information",
        "key_points": ["key point 1", "key point 2"]
      }
    ],
    "conclusion": "Strong conclusion with key takeaways"
  },
  "citations": [
    {
      "text": "Citation text",
      "source": "Source information",
      "url": "source_url"
    }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "reading_time": "estimated reading time",
  "word_count": actual_word_count,
  "quality_indicators": {
    "readability_score": 0-10,
    "engagement_potential": 0-10,
    "informativeness": 0-10,
    "originality": 0-10
  }
}`;

        // Generate content with DeepSeek via OpenRouter
        const contentResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://xhlpnnoskmewqkjriqxq.supabase.co',
                'X-Title': 'Enhanced AI Content Generation System'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `You are a world-class content creator with expertise in ${content_type} writing. You excel at creating engaging, informative, and well-structured content that resonates with the target audience. Always respond with valid JSON only.`
                    },
                    {
                        role: 'user',
                        content: contentPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            })
        });

        if (!contentResponse.ok) {
            const errorText = await contentResponse.text();
            throw new Error(`DeepSeek content generation request failed: ${contentResponse.status} - ${errorText}`);
        }

        const contentData = await contentResponse.json();
        const rawContent = contentData.choices[0].message.content;
        
        // Helper to clean markdown-wrapped JSON
        const cleanJsonContent = (content: string) => {
            return content.replace(/^```json\s*|```$/g, '').trim();
        };
        
        const generatedContent = JSON.parse(cleanJsonContent(rawContent));

        // Enhance with additional metadata
        const enhancedResult = {
            ...generatedContent,
            generation_metadata: {
                topic,
                content_type,
                style,
                target_audience,
                requested_word_count: word_count,
                actual_word_count: generatedContent.word_count,
                generation_timestamp: new Date().toISOString(),
                model_used: 'deepseek-chat',
                api_version: 'enhanced-v2.0',
                research_enhanced: !!research_data
            }
        };

        return new Response(JSON.stringify({ data: enhancedResult }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Content generator error:', error);
        
        const errorResponse = {
            error: {
                code: 'CONTENT_GENERATION_FAILED',
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