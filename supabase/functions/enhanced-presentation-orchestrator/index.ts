// Enhanced Presentation Orchestrator - Multi-Stage Pipeline
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
            presentation_type = 'professional',
            target_audience = 'business professionals',
            slide_count = 10,
            include_research = true,
            quality_threshold = 8.0,
            custom_requirements = [],
            pipeline_mode = 'full' // 'full', 'research_only', 'content_only', 'validation_only'
        } = await req.json();

        if (!topic) {
            throw new Error('Topic parameter is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase configuration missing');
        }

        const pipelineResults = {
            topic,
            pipeline_mode,
            execution_started: new Date().toISOString(),
            stages: {},
            final_result: null,
            quality_metrics: {},
            execution_log: []
        };

        // Helper function to call edge functions
        const callEdgeFunction = async (functionName: string, payload: any) => {
            const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                    'Content-Type': 'application/json',
                    'x-client-info': 'supabase-edge-function'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${functionName} failed: ${errorText}`);
            }

            const result = await response.json();
            return result.data || result;
        };

        // Stage 1: Enhanced Research (if enabled)
        let researchData = null;
        if (include_research && (pipeline_mode === 'full' || pipeline_mode === 'research_only')) {
            pipelineResults.execution_log.push({
                stage: 'research',
                status: 'started',
                timestamp: new Date().toISOString()
            });

            try {
                researchData = await callEdgeFunction('research-agent', {
                    query: `${topic} presentation research`,
                    depth: 'comprehensive',
                    sources_limit: 8
                });

                pipelineResults.stages.research = {
                    status: 'completed',
                    data: researchData,
                    quality_score: researchData.analysis?.confidence_level || 0,
                    sources_count: researchData.search_results?.length || 0
                };

                pipelineResults.execution_log.push({
                    stage: 'research',
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    sources_found: researchData.search_results?.length || 0
                });

            } catch (error) {
                pipelineResults.stages.research = {
                    status: 'failed',
                    error: error.message
                };
                pipelineResults.execution_log.push({
                    stage: 'research',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                if (pipeline_mode === 'research_only') {
                    throw error;
                }
            }
        }

        // Stage 2: Enhanced Content Generation
        let contentData = null;
        if (pipeline_mode === 'full' || pipeline_mode === 'content_only') {
            pipelineResults.execution_log.push({
                stage: 'content_generation',
                status: 'started',
                timestamp: new Date().toISOString()
            });

            try {
                // Create comprehensive presentation content
                const contentPrompt = `Create a ${slide_count}-slide ${presentation_type} presentation on: ${topic}`;
                
                contentData = await callEdgeFunction('content-generator', {
                    topic: contentPrompt,
                    research_data: researchData,
                    content_type: 'presentation',
                    style: presentation_type,
                    target_audience,
                    word_count: slide_count * 100,
                    include_sections: ['title_slide', 'outline', 'main_content', 'conclusion', 'appendix'],
                    citations_required: !!researchData
                });

                pipelineResults.stages.content_generation = {
                    status: 'completed',
                    data: contentData,
                    quality_score: contentData.quality_indicators?.informativeness || 0,
                    word_count: contentData.word_count || 0
                };

                pipelineResults.execution_log.push({
                    stage: 'content_generation',
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    word_count: contentData.word_count || 0
                });

            } catch (error) {
                pipelineResults.stages.content_generation = {
                    status: 'failed',
                    error: error.message
                };
                pipelineResults.execution_log.push({
                    stage: 'content_generation',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                if (pipeline_mode === 'content_only') {
                    throw error;
                }
            }
        }

        // Stage 3: Enhanced Quality Validation
        let validationData = null;
        if (contentData && (pipeline_mode === 'full' || pipeline_mode === 'validation_only')) {
            pipelineResults.execution_log.push({
                stage: 'quality_validation',
                status: 'started',
                timestamp: new Date().toISOString()
            });

            try {
                validationData = await callEdgeFunction('quality-validator', {
                    content: contentData,
                    content_type: 'presentation',
                    validation_criteria: {
                        accuracy: true,
                        readability: true,
                        engagement: true,
                        structure: true,
                        originality: true,
                        seo_optimization: false // Not relevant for presentations
                    },
                    target_quality_score: quality_threshold
                });

                pipelineResults.stages.quality_validation = {
                    status: 'completed',
                    data: validationData,
                    overall_score: validationData.overall_quality_score || 0,
                    meets_threshold: validationData.meets_target_quality || false
                };

                pipelineResults.execution_log.push({
                    stage: 'quality_validation',
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    quality_score: validationData.overall_quality_score || 0
                });

                // Quality feedback loop - regenerate if below threshold
                if (!validationData.meets_target_quality && pipeline_mode === 'full') {
                    pipelineResults.execution_log.push({
                        stage: 'quality_improvement',
                        status: 'initiated',
                        timestamp: new Date().toISOString(),
                        reason: 'Quality below threshold'
                    });

                    // Attempt content improvement based on validation feedback
                    const improvementPrompt = `Improve the presentation content based on quality feedback:\n${JSON.stringify(validationData.improvement_plan, null, 2)}`;
                    
                    try {
                        const improvedContent = await callEdgeFunction('content-generator', {
                            topic: improvementPrompt,
                            research_data: researchData,
                            content_type: 'presentation_improvement',
                            style: presentation_type,
                            target_audience,
                            word_count: slide_count * 100,
                            include_sections: ['improved_content'],
                            citations_required: !!researchData
                        });

                        contentData = improvedContent;
                        pipelineResults.stages.quality_improvement = {
                            status: 'completed',
                            improved_content: improvedContent
                        };

                    } catch (improvementError) {
                        pipelineResults.stages.quality_improvement = {
                            status: 'failed',
                            error: improvementError.message
                        };
                    }
                }

            } catch (error) {
                pipelineResults.stages.quality_validation = {
                    status: 'failed',
                    error: error.message
                };
                pipelineResults.execution_log.push({
                    stage: 'quality_validation',
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Final Result Compilation
        pipelineResults.final_result = {
            presentation: {
                title: contentData?.title || `${topic} Presentation`,
                subtitle: contentData?.subtitle || '',
                content: contentData?.content || null,
                metadata: contentData?.generation_metadata || {},
                slides_generated: slide_count,
                presentation_type,
                target_audience
            },
            research_insights: researchData?.analysis || null,
            quality_assessment: validationData || null,
            sources: researchData?.search_results || [],
            citations: contentData?.citations || []
        };

        // Calculate overall quality metrics
        pipelineResults.quality_metrics = {
            research_quality: researchData?.analysis?.confidence_level || 0,
            content_quality: contentData?.quality_indicators?.informativeness || 0,
            validation_score: validationData?.overall_quality_score || 0,
            overall_pipeline_score: [
                researchData?.analysis?.confidence_level || 0,
                contentData?.quality_indicators?.informativeness || 0,
                validationData?.overall_quality_score || 0
            ].reduce((sum, score) => sum + score, 0) / 3,
            meets_quality_threshold: validationData?.meets_target_quality || false
        };

        pipelineResults.execution_completed = new Date().toISOString();
        pipelineResults.total_execution_time = new Date().getTime() - new Date(pipelineResults.execution_started).getTime();

        return new Response(JSON.stringify({ data: pipelineResults }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Enhanced presentation orchestrator error:', error);
        
        const errorResponse = {
            error: {
                code: 'ORCHESTRATION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString(),
                stage: 'orchestration'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});