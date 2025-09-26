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
        const { action, presentationId, linkId, sharingData, password } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let result;

        switch (action) {
            case 'create_sharing_link':
                // Get user from auth header
                const authHeader = req.headers.get('authorization');
                if (!authHeader) {
                    throw new Error('Authorization required');
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

                // Generate unique link ID
                const generatedLinkId = await generateUniqueId();
                
                // Hash password if provided
                let passwordHash = null;
                if (sharingData.password) {
                    passwordHash = await hashPassword(sharingData.password);
                }

                // Create sharing link
                const createResponse = await fetch(
                    `${supabaseUrl}/rest/v1/sharing_links`,
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
                            created_by: userId,
                            link_id: generatedLinkId,
                            permission_level: sharingData.permissionLevel || 'view',
                            password_hash: passwordHash,
                            domain_restrictions: sharingData.domainRestrictions || null,
                            expires_at: sharingData.expiresAt || null,
                            max_views: sharingData.maxViews || null,
                            allow_download: sharingData.allowDownload !== false,
                            show_comments: sharingData.showComments !== false,
                            track_analytics: sharingData.trackAnalytics !== false,
                            custom_message: sharingData.customMessage || null
                        })
                    }
                );

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create sharing link: ${errorText}`);
                }

                const createdLink = await createResponse.json();
                result = {
                    ...createdLink[0],
                    share_url: `${req.headers.get('origin') || 'https://app.slidefast.io'}/s/${generatedLinkId}`
                };
                break;

            case 'validate_link':
                if (!linkId) {
                    throw new Error('Link ID is required');
                }

                // Get user email if authenticated
                let userEmail = null;
                const validationAuthHeader = req.headers.get('authorization');
                if (validationAuthHeader && validationAuthHeader !== 'Bearer null') {
                    try {
                        const validationToken = validationAuthHeader.replace('Bearer ', '');
                        const validationUserResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                            headers: {
                                'Authorization': `Bearer ${validationToken}`,
                                'apikey': serviceRoleKey
                            }
                        });
                        if (validationUserResponse.ok) {
                            const validationUserData = await validationUserResponse.json();
                            userEmail = validationUserData.email;
                        }
                    } catch (error) {
                        // Continue without user email
                        console.log('Anonymous link access');
                    }
                }

                // Validate link using database function
                const validateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/rpc/validate_link_access`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            p_link_id: linkId,
                            p_password: password || null,
                            p_user_email: userEmail
                        })
                    }
                );

                if (!validateResponse.ok) {
                    throw new Error('Failed to validate link');
                }

                const validation = await validateResponse.json();
                
                // If password is required and not provided, don't reveal other details
                if (!validation.valid && validation.needs_password) {
                    result = {
                        valid: false,
                        needs_password: true,
                        error: 'Password required'
                    };
                } else if (validation.valid) {
                    // Get presentation data if valid
                    const presentationResponse = await fetch(
                        `${supabaseUrl}/rest/v1/presentations?id=eq.${validation.presentation_id}&select=id,title,description,content,theme,created_at`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );

                    const presentationData = await presentationResponse.json();
                    if (presentationData && presentationData.length > 0) {
                        result = {
                            valid: true,
                            presentation: presentationData[0],
                            permissions: {
                                level: validation.permission_level,
                                allow_download: validation.allow_download,
                                show_comments: validation.show_comments
                            },
                            custom_message: validation.custom_message
                        };
                    } else {
                        result = {
                            valid: false,
                            error: 'Presentation not found'
                        };
                    }
                } else {
                    result = validation;
                }
                break;

            case 'get_sharing_links':
                const linksResponse = await fetch(
                    `${supabaseUrl}/rest/v1/sharing_links?presentation_id=eq.${presentationId}&order=created_at.desc`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                if (!linksResponse.ok) {
                    throw new Error('Failed to fetch sharing links');
                }

                const links = await linksResponse.json();
                
                // Add share URLs and clean up sensitive data
                result = links.map(link => ({
                    ...link,
                    share_url: `${req.headers.get('origin') || 'https://app.slidefast.io'}/s/${link.link_id}`,
                    password_hash: undefined // Remove hash from response
                }));
                break;

            case 'update_sharing_link':
                const updateData = {};
                if (sharingData.permissionLevel !== undefined) {
                    updateData.permission_level = sharingData.permissionLevel;
                }
                if (sharingData.expiresAt !== undefined) {
                    updateData.expires_at = sharingData.expiresAt;
                }
                if (sharingData.maxViews !== undefined) {
                    updateData.max_views = sharingData.maxViews;
                }
                if (sharingData.allowDownload !== undefined) {
                    updateData.allow_download = sharingData.allowDownload;
                }
                if (sharingData.showComments !== undefined) {
                    updateData.show_comments = sharingData.showComments;
                }
                if (sharingData.customMessage !== undefined) {
                    updateData.custom_message = sharingData.customMessage;
                }
                if (sharingData.isActive !== undefined) {
                    updateData.is_active = sharingData.isActive;
                }
                if (sharingData.password !== undefined) {
                    updateData.password_hash = sharingData.password ? await hashPassword(sharingData.password) : null;
                }

                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/sharing_links?link_id=eq.${linkId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(updateData)
                    }
                );

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update sharing link: ${errorText}`);
                }

                result = await updateResponse.json();
                break;

            case 'delete_sharing_link':
                const deleteResponse = await fetch(
                    `${supabaseUrl}/rest/v1/sharing_links?link_id=eq.${linkId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                if (!deleteResponse.ok) {
                    throw new Error('Failed to delete sharing link');
                }

                result = { success: true, message: 'Sharing link deleted' };
                break;

            case 'get_analytics':
                // Get analytics for all links of this presentation
                const analyticsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/sharing_links?presentation_id=eq.${presentationId}&select=link_id,current_views,last_accessed,created_at`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const analyticsData = await analyticsResponse.json();
                
                result = {
                    total_links: analyticsData.length,
                    total_views: analyticsData.reduce((sum, link) => sum + (link.current_views || 0), 0),
                    links: analyticsData
                };
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Advanced sharing error:', error);

        const errorResponse = {
            error: {
                code: 'SHARING_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Helper functions
    async function generateUniqueId() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
});