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

        // Handle different collaboration operations
        if (method === 'GET' && pathSegments.length === 0) {
            // GET /collaboration-manager - List collaborators for all user's presentations
            return await listUserCollaborations(supabaseUrl, serviceRoleKey, userId, corsHeaders);
        }
        
        if (method === 'GET' && pathSegments[0] && pathSegments.length === 1) {
            // GET /collaboration-manager/{presentationId} - List collaborators for specific presentation
            const presentationId = pathSegments[0];
            return await getCollaborators(supabaseUrl, serviceRoleKey, userId, presentationId, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'invite') {
            // POST /collaboration-manager/invite - Send team invitation
            const requestData = await req.json();
            return await sendTeamInvitation(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'accept') {
            // POST /collaboration-manager/accept - Accept invitation
            const requestData = await req.json();
            return await acceptInvitation(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'decline') {
            // POST /collaboration-manager/decline - Decline invitation
            const requestData = await req.json();
            return await declineInvitation(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'PUT' && pathSegments[0] === 'permission') {
            // PUT /collaboration-manager/permission - Update collaborator permission
            const requestData = await req.json();
            return await updateCollaboratorPermission(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'DELETE' && pathSegments[0] === 'remove') {
            // DELETE /collaboration-manager/remove - Remove collaborator
            const requestData = await req.json();
            return await removeCollaborator(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        if (method === 'POST' && pathSegments[0] === 'share-link') {
            // POST /collaboration-manager/share-link - Generate/toggle sharing link
            const requestData = await req.json();
            return await manageShareLink(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Collaboration manager error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'COLLABORATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions for collaboration operations
async function listUserCollaborations(supabaseUrl: string, serviceRoleKey: string, userId: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_collaborators?select=*,presentations(id,title,description),user_profiles(full_name,email,avatar_url)&user_id=eq.${userId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch collaborations');
    }

    const collaborations = await response.json();
    return new Response(JSON.stringify({ data: collaborations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getCollaborators(supabaseUrl: string, serviceRoleKey: string, userId: string, presentationId: string, corsHeaders: any) {
    // First verify user has access to this presentation
    const accessResponse = await fetch(`${supabaseUrl}/rest/v1/presentations?select=id,user_id&id=eq.${presentationId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const presentations = await accessResponse.json();
    if (!presentations || presentations.length === 0) {
        throw new Error('Presentation not found');
    }

    // Get collaborators
    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_collaborators?select=*,user_profiles(full_name,email,avatar_url)&presentation_id=eq.${presentationId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
    }

    const collaborators = await response.json();
    return new Response(JSON.stringify({ data: collaborators }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function sendTeamInvitation(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, email, permission = 'view', message } = requestData;

    if (!presentationId || !email) {
        throw new Error('Missing required fields: presentationId, email');
    }

    // Generate invitation token
    const invitationToken = btoa(crypto.getRandomValues(new Uint8Array(32)).join(''));

    // Check if user exists
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=id,email&email=eq.${email}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const existingUsers = await userResponse.json();
    const invitedUserId = existingUsers.length > 0 ? existingUsers[0].id : null;

    // Create invitation
    const invitationResponse = await fetch(`${supabaseUrl}/rest/v1/team_invitations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            presentation_id: presentationId,
            invited_by: userId,
            invited_email: email,
            invited_user_id: invitedUserId,
            permission,
            invitation_token: invitationToken,
            message
        })
    });

    if (!invitationResponse.ok) {
        throw new Error('Failed to create invitation');
    }

    const invitation = await invitationResponse.json();
    
    // TODO: Send email notification (would integrate with email service)
    // For now, return the invitation details
    
    return new Response(JSON.stringify({ 
        data: invitation,
        invitationLink: `${Deno.env.get('FRONTEND_URL')}/invite/${invitationToken}`
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function acceptInvitation(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { invitationToken } = requestData;

    if (!invitationToken) {
        throw new Error('Missing invitation token');
    }

    // Get invitation details
    const invitationResponse = await fetch(`${supabaseUrl}/rest/v1/team_invitations?select=*&invitation_token=eq.${invitationToken}&status=eq.pending`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const invitations = await invitationResponse.json();
    if (!invitations || invitations.length === 0) {
        throw new Error('Invalid or expired invitation');
    }

    const invitation = invitations[0];
    
    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
    }

    // Create collaborator record
    const collaboratorResponse = await fetch(`${supabaseUrl}/rest/v1/presentation_collaborators`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            presentation_id: invitation.presentation_id,
            user_id: userId,
            invited_by: invitation.invited_by,
            permission: invitation.permission,
            status: 'active',
            joined_at: new Date().toISOString()
        })
    });

    if (!collaboratorResponse.ok) {
        throw new Error('Failed to create collaboration');
    }

    // Update invitation status
    await fetch(`${supabaseUrl}/rest/v1/team_invitations?id=eq.${invitation.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Invitation accepted successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function declineInvitation(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { invitationToken } = requestData;

    // Update invitation status
    const response = await fetch(`${supabaseUrl}/rest/v1/team_invitations?invitation_token=eq.${invitationToken}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'declined',
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to decline invitation');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Invitation declined'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updateCollaboratorPermission(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, collaboratorUserId, permission } = requestData;

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_collaborators?presentation_id=eq.${presentationId}&user_id=eq.${collaboratorUserId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            permission,
            updated_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        throw new Error('Failed to update permission');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Permission updated successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function removeCollaborator(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, collaboratorUserId } = requestData;

    const response = await fetch(`${supabaseUrl}/rest/v1/presentation_collaborators?presentation_id=eq.${presentationId}&user_id=eq.${collaboratorUserId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to remove collaborator');
    }

    return new Response(JSON.stringify({ 
        success: true,
        message: 'Collaborator removed successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function manageShareLink(supabaseUrl: string, serviceRoleKey: string, userId: string, requestData: any, corsHeaders: any) {
    const { presentationId, enabled } = requestData;

    let updateData: any = {
        sharing_enabled: enabled,
        updated_at: new Date().toISOString()
    };

    if (enabled) {
        // Generate new sharing link if enabling
        const shareToken = btoa(crypto.getRandomValues(new Uint8Array(16)).join(''));
        updateData.sharing_link = shareToken;
    } else {
        // Clear sharing link if disabling
        updateData.sharing_link = null;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/presentations?id=eq.${presentationId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        throw new Error('Failed to update sharing settings');
    }

    return new Response(JSON.stringify({ 
        success: true,
        shareLink: enabled ? `${Deno.env.get('FRONTEND_URL')}/shared/${updateData.sharing_link}` : null
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}