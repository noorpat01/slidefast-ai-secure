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
        const { action, presentationId, sessionData, analyticsData, days = 30 } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let result;

        switch (action) {
            case 'track_session_start':
                const { sessionId, viewMode, userAgent, referrer, viewerIp } = sessionData;
                
                // Get user if authenticated
                let viewerId = null;
                const authHeader = req.headers.get('authorization');
                if (authHeader && authHeader !== 'Bearer null') {
                    try {
                        const token = authHeader.replace('Bearer ', '');
                        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'apikey': serviceRoleKey
                            }
                        });
                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            viewerId = userData.id;
                        }
                    } catch (error) {
                        // Continue without user ID for anonymous tracking
                        console.log('Anonymous session tracking');
                    }
                }

                const trackResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_analytics`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            presentation_id: presentationId,
                            viewer_id: viewerId,
                            session_id: sessionId,
                            viewer_ip: viewerIp,
                            user_agent: userAgent,
                            referrer: referrer,
                            view_mode: viewMode,
                            started_at: new Date().toISOString()
                        })
                    }
                );

                if (!trackResponse.ok) {
                    const errorText = await trackResponse.text();
                    throw new Error(`Failed to track session: ${errorText}`);
                }

                result = await trackResponse.json();
                break;

            case 'update_session':
                const { 
                    sessionId: updateSessionId, 
                    slidesViewed, 
                    slideDurations, 
                    interactions, 
                    currentSlideId,
                    totalTimeSeconds 
                } = analyticsData;

                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_analytics?session_id=eq.${updateSessionId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            slides_viewed: slidesViewed,
                            slide_durations: slideDurations,
                            interactions: interactions,
                            exit_slide_id: currentSlideId,
                            total_time_seconds: totalTimeSeconds,
                            ended_at: new Date().toISOString()
                        })
                    }
                );

                if (!updateResponse.ok) {
                    throw new Error('Failed to update session analytics');
                }

                result = { success: true, message: 'Session updated' };
                break;

            case 'end_session':
                const { sessionId: endSessionId, completedPresentation = false } = analyticsData;

                const endResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_analytics?session_id=eq.${endSessionId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ended_at: new Date().toISOString(),
                            completed_presentation: completedPresentation
                        })
                    }
                );

                if (!endResponse.ok) {
                    throw new Error('Failed to end session');
                }

                result = { success: true, message: 'Session ended' };
                break;

            case 'get_analytics':
                // Get engagement metrics using the database function
                const metricsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/rpc/calculate_engagement_metrics`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            p_id: presentationId, 
                            days_back: days 
                        })
                    }
                );

                const metrics = await metricsResponse.json();

                // Get detailed analytics data
                const analyticsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_analytics?presentation_id=eq.${presentationId}&started_at=gte.${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}&order=started_at.desc`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const analyticsData = await analyticsResponse.json();

                // Process slide-level analytics
                const slideAnalytics = {};
                analyticsData.forEach(session => {
                    if (session.slide_durations) {
                        Object.entries(session.slide_durations).forEach(([slideId, duration]) => {
                            if (!slideAnalytics[slideId]) {
                                slideAnalytics[slideId] = {
                                    views: 0,
                                    total_time: 0,
                                    avg_time: 0
                                };
                            }
                            slideAnalytics[slideId].views++;
                            slideAnalytics[slideId].total_time += duration;
                            slideAnalytics[slideId].avg_time = slideAnalytics[slideId].total_time / slideAnalytics[slideId].views;
                        });
                    }
                });

                // Calculate hourly view distribution
                const hourlyViews = new Array(24).fill(0);
                analyticsData.forEach(session => {
                    const hour = new Date(session.started_at).getHours();
                    hourlyViews[hour]++;
                });

                result = {
                    summary: metrics,
                    slide_analytics: slideAnalytics,
                    hourly_distribution: hourlyViews,
                    recent_sessions: analyticsData.slice(0, 10), // Last 10 sessions
                    total_sessions: analyticsData.length
                };
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics tracker error:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});