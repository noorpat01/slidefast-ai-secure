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
        const { action, category, search, favorites_only, template_id, template_data } = await req.json();

        console.log('Template manager request:', { action, category, search, favorites_only, template_id });

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header if provided
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
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
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        switch (action) {
            case 'get_templates': {
                // Build query parameters
                let url = `${supabaseUrl}/rest/v1/presentation_templates?select=*`;
                const params = [];

                if (category && category !== 'all') {
                    params.push(`category=eq.${encodeURIComponent(category)}`);
                }

                if (search) {
                    params.push(`or=(name.ilike.*${encodeURIComponent(search)}*,description.ilike.*${encodeURIComponent(search)}*,tags.cs.{"${encodeURIComponent(search)}"},category.ilike.*${encodeURIComponent(search)}*)`);
                }

                params.push('is_active=eq.true');
                params.push('order=created_at.desc');

                if (params.length > 0) {
                    url += '&' + params.join('&');
                }

                console.log('Fetching templates from:', url);

                const templatesResponse = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!templatesResponse.ok) {
                    const errorText = await templatesResponse.text();
                    throw new Error(`Failed to fetch templates: ${errorText}`);
                }

                let templates = await templatesResponse.json();

                // If user is authenticated, check favorites
                if (userId && templates.length > 0) {
                    const templateIds = templates.map((t: any) => t.id);
                    const favoritesResponse = await fetch(`${supabaseUrl}/rest/v1/user_template_favorites?select=template_id&user_id=eq.${userId}&template_id=in.(${templateIds.join(',')})`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (favoritesResponse.ok) {
                        const favorites = await favoritesResponse.json();
                        const favoriteIds = new Set(favorites.map((f: any) => f.template_id));
                        
                        templates = templates.map((template: any) => ({
                            ...template,
                            is_favorited: favoriteIds.has(template.id)
                        }));
                    }
                }

                // Filter by favorites if requested
                if (favorites_only && userId) {
                    templates = templates.filter((t: any) => t.is_favorited);
                }

                return new Response(JSON.stringify({
                    data: {
                        templates,
                        total: templates.length,
                        category_counts: await getCategoryCounts(supabaseUrl, serviceRoleKey)
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'toggle_favorite': {
                if (!userId) {
                    throw new Error('Authentication required to manage favorites');
                }

                if (!template_id) {
                    throw new Error('Template ID is required');
                }

                // Check if already favorited
                const existingResponse = await fetch(`${supabaseUrl}/rest/v1/user_template_favorites?user_id=eq.${userId}&template_id=eq.${template_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!existingResponse.ok) {
                    throw new Error('Failed to check favorite status');
                }

                const existing = await existingResponse.json();
                
                if (existing.length > 0) {
                    // Remove from favorites
                    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/user_template_favorites?user_id=eq.${userId}&template_id=eq.${template_id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!deleteResponse.ok) {
                        throw new Error('Failed to remove favorite');
                    }

                    return new Response(JSON.stringify({
                        data: { is_favorited: false, message: 'Removed from favorites' }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                } else {
                    // Add to favorites
                    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_template_favorites`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            template_id: template_id,
                            created_at: new Date().toISOString()
                        })
                    });

                    if (!insertResponse.ok) {
                        throw new Error('Failed to add favorite');
                    }

                    return new Response(JSON.stringify({
                        data: { is_favorited: true, message: 'Added to favorites' }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }

            case 'get_template_details': {
                if (!template_id) {
                    throw new Error('Template ID is required');
                }

                const templateResponse = await fetch(`${supabaseUrl}/rest/v1/presentation_templates?id=eq.${template_id}&is_active=eq.true`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!templateResponse.ok) {
                    throw new Error('Failed to fetch template details');
                }

                const templates = await templateResponse.json();
                if (templates.length === 0) {
                    throw new Error('Template not found');
                }

                const template = templates[0];

                // Check if favorited by user
                if (userId) {
                    const favResponse = await fetch(`${supabaseUrl}/rest/v1/user_template_favorites?user_id=eq.${userId}&template_id=eq.${template_id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (favResponse.ok) {
                        const favorites = await favResponse.json();
                        template.is_favorited = favorites.length > 0;
                    }
                }

                return new Response(JSON.stringify({
                    data: { template }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Template manager error:', error);

        const errorResponse = {
            error: {
                code: 'TEMPLATE_MANAGER_ERROR',
                message: error.message || 'Template operation failed'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to get category counts
async function getCategoryCounts(supabaseUrl: string, serviceRoleKey: string) {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/presentation_templates?select=category&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return {};

        const templates = await response.json();
        const counts: Record<string, number> = {};
        
        templates.forEach((template: any) => {
            const category = template.category || 'uncategorized';
            counts[category] = (counts[category] || 0) + 1;
        });

        return counts;
    } catch (error) {
        console.error('Failed to get category counts:', error);
        return {};
    }
}
