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

        if (method === 'GET' && pathSegments[0]) {
            // GET /comments/{presentationId} - Get comments for presentation
            const presentationId = pathSegments[0];
            const slideId = url.searchParams.get('slide_id');
            return await getComments(supabaseUrl, serviceRoleKey, userId, presentationId, slideId, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0]) {
            // POST /comments/{presentationId} - Create comment
            const presentationId = pathSegments[0];
            const requestData = await req.json();
            return await createComment(supabaseUrl, serviceRoleKey, userId, presentationId, requestData, corsHeaders);
        }

        if (method === 'PUT' && pathSegments[0] === 'update') {
            // PUT /comments/update/{commentId} - Update comment
            const commentId = pathSegments[1];
            const requestData = await req.json();
            return await updateComment(supabaseUrl, serviceRoleKey, userId, commentId, requestData, corsHeaders);
        }

        if (method === 'DELETE' && pathSegments[0]) {
            // DELETE /comments/{commentId} - Delete comment
            const commentId = pathSegments[0];
            return await deleteComment(supabaseUrl, serviceRoleKey, userId, commentId, corsHeaders);
        }

        if (method === 'PATCH' && pathSegments[0] === 'resolve') {
            // PATCH /comments/resolve/{commentId} - Resolve comment
            const commentId = pathSegments[1];
            return await resolveComment(supabaseUrl, serviceRoleKey, userId, commentId, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Comments manager error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'COMMENTS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function getComments(supabaseUrl: string, serviceRoleKey: string, userId: string, presentationId: string, slideId: string | null, corsHeaders: any) {
    let query = `${supabaseUrl}/rest/v1/presentation_comments?select=*,user_profiles(full_name,email,avatar_url)&presentation_id=eq.${presentationId}&status=eq.active&order=created_at.asc`;
    
    if (slideId) {
        query += `&slide_id=eq.${slideId}`;
    }

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch comments');
    }

    const comments = await response.json();
    
    // Organize comments into threads (parent comments with replies)
    const commentThreads = organizeCommentThreads(comments);
    
    return new Response(JSON.stringify({ data: commentThreads }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function createComment(supabaseUrl: string, serviceRoleKey: string, userId: string, presentationId: string, requestData: any, corsHeaders: any) {
    const { slideId, content, parentId, positionX, positionY } = requestData;

    if (!slideId || !content) {
        throw new Error('Missing required fields: slideId, content');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_comments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            presentation_id: presentationId,
            slide_id: slideId,
            user_id: userId,
            parent_id: parentId || null,
            content,
            position_x: positionX || null,
            position_y: positionY || null
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create comment');
    }

    const comment = await response.json();
    
    // Log activity
    await fetch(`${supabaseUrl}/rest/v1/presentation_activity`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            presentation_id: presentationId,
            user_id: userId,
            action_type: 'comment',
            action_details: {
                slide_id: slideId,
                comment_id: comment[0]?.id,
                is_reply: !!parentId
            },
            slide_id: slideId
        })
    });

    return new Response(JSON.stringify({ data: comment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updateComment(supabaseUrl: string, serviceRoleKey: string, userId: string, commentId: string, requestData: any, corsHeaders: any) {
    const { content } = requestData;

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_comments?id=eq.${commentId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content,
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to update comment');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Comment updated successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function deleteComment(supabaseUrl: string, serviceRoleKey: string, userId: string, commentId: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_comments?id=eq.${commentId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'deleted',
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to delete comment');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Comment deleted successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function resolveComment(supabaseUrl: string, serviceRoleKey: string, userId: string, commentId: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_comments?id=eq.${commentId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'resolved',
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to resolve comment');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Comment resolved successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Helper function to organize comments into threaded structure
function organizeCommentThreads(comments: any[]) {
    const commentMap = new Map();
    const rootComments: any[] = [];
    
    // First pass: create map of all comments
    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: organize into threads
    comments.forEach(comment => {
        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies.push(commentMap.get(comment.id));
            }
        } else {
            rootComments.push(commentMap.get(comment.id));
        }
    });
    
    return rootComments;
}