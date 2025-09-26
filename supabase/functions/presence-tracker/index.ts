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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
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
            throw new Error('Invalid authentication token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        const url = new URL(req.url);
        const method = req.method;
        const pathSegments = url.pathname.split('/').filter(Boolean);

        if (method === 'POST' && pathSegments[0] === 'join') {
            // POST /presence-tracker/join - Join presentation session
            const requestData = await req.json();
            return await joinSession(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'update') {
            // POST /presence-tracker/update - Update user presence
            const requestData = await req.json();
            return await updatePresence(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'leave') {
            // POST /presence-tracker/leave - Leave presentation session
            const requestData = await req.json();
            return await leaveSession(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'GET' && pathSegments[0]) {
            // GET /presence-tracker/{presentationId} - Get active users in presentation
            const presentationId = pathSegments[0];
            return await getActiveUsers(supabaseUrl, serviceRoleKey, userId, presentationId, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'cursor') {
            // POST /presence-tracker/cursor - Update cursor position
            const requestData = await req.json();
            return await updateCursor(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'cleanup') {
            // POST /presence-tracker/cleanup - Cleanup inactive sessions (admin only)
            return await cleanupSessions(supabaseUrl, serviceRoleKey, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Presence tracker error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'PRESENCE_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function joinSession(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, sessionId, slideId } = requestData;

    if (!presentationId || !sessionId) {
        throw new Error('Missing required fields: presentationId, sessionId');
    }

    // First, clean up any existing sessions for this user and presentation
    await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?presentation_id=eq.${presentationId}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    // Create new session
    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_sessions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            presentation_id: presentationId,
            user_id: userId,
            session_id: sessionId,
            slide_id: slideId || null,
            status: 'active',
            last_activity: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create session');
    }

    const session = await response.json();
    return new Response(JSON.stringify({ data: session }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updatePresence(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, sessionId, slideId, status = 'active' } = requestData;

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?presentation_id=eq.${presentationId}&user_id=eq.${userId}&session_id=eq.${sessionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            slide_id: slideId,
            status,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to update presence');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Presence updated successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function leaveSession(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, sessionId } = requestData;

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?presentation_id=eq.${presentationId}&user_id=eq.${userId}&session_id=eq.${sessionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'disconnected',
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to leave session');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Session ended successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getActiveUsers(supabaseUrl: string, serviceRoleKey: string, userId: string, presentationId: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?select=*,user_profiles(full_name,email,avatar_url)&presentation_id=eq.${presentationId}&status=in.(active,idle)&order=last_activity.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch active users');
    }

    const sessions = await response.json();
    
    // Group by slide for better organization
    const usersBySlide = {};
    const allUsers = [];
    
    sessions.forEach(session => {
        const slideId = session.slide_id || 'unknown';
        
        if (!usersBySlide[slideId]) {
            usersBySlide[slideId] = [];
        }
        
        const userInfo = {
            userId: session.user_id,
            sessionId: session.session_id,
            slideId: session.slide_id,
            status: session.status,
            lastActivity: session.last_activity,
            cursorPosition: session.cursor_position,
            profile: session.user_profiles
        };
        
        usersBySlide[slideId].push(userInfo);
        allUsers.push(userInfo);
    });

    return new Response(JSON.stringify({ 
        data: {
            usersBySlide,
            allUsers,
            totalActiveUsers: sessions.length
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updateCursor(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, sessionId, cursorPosition } = requestData;

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?presentation_id=eq.${presentationId}&user_id=eq.${userId}&session_id=eq.${sessionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cursor_position: cursorPosition,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to update cursor position');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Cursor position updated'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function cleanupSessions(supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Mark sessions as disconnected if no activity for 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?last_activity=lt.${fiveMinutesAgo}&status=neq.disconnected`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'disconnected',
            updated_at: new Date().toISOString()
        })
    });
    
    // Delete disconnected sessions older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    await fetch(`${supabaseUrl}/rest/v1/presentation_sessions?updated_at=lt.${oneHourAgo}&status=eq.disconnected`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Sessions cleaned up successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}