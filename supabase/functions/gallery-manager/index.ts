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
        const { action, presentationId, galleryData, rating, review, filters } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let result;

        switch (action) {
            case 'publish_to_gallery':
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

                // Get presentation to generate preview
                const presentationResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentations?id=eq.${presentationId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const presentations = await presentationResponse.json();
                if (!presentations || presentations.length === 0) {
                    throw new Error('Presentation not found');
                }

                const presentation = presentations[0];
                const slides = presentation.content?.slides || [];
                const previewSlides = slides.slice(0, 3); // First 3 slides for preview

                // Publish to gallery
                const publishResponse = await fetch(
                    `${supabaseUrl}/rest/v1/public_gallery`,
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
                            published_by: userId,
                            category: galleryData.category,
                            tags: galleryData.tags || [],
                            is_template: galleryData.isTemplate || false,
                            thumbnail_url: galleryData.thumbnailUrl,
                            preview_slides: previewSlides
                        })
                    }
                );

                if (!publishResponse.ok) {
                    const errorText = await publishResponse.text();
                    throw new Error(`Failed to publish to gallery: ${errorText}`);
                }

                result = await publishResponse.json();
                break;

            case 'get_gallery':
                const { 
                    category, 
                    tags, 
                    isTemplate, 
                    isFeatured, 
                    sortBy = 'published_at', 
                    limit = 20, 
                    offset = 0 
                } = filters || {};

                let query = `${supabaseUrl}/rest/v1/public_gallery?limit=${limit}&offset=${offset}&order=${sortBy}.desc`;
                
                if (category) {
                    query += `&category=eq.${category}`;
                }
                if (isTemplate !== undefined) {
                    query += `&is_template=eq.${isTemplate}`;
                }
                if (isFeatured !== undefined) {
                    query += `&is_featured=eq.${isFeatured}`;
                }
                if (tags && tags.length > 0) {
                    query += `&tags=cs.{${tags.join(',')}}`;
                }

                const galleryResponse = await fetch(query, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!galleryResponse.ok) {
                    throw new Error('Failed to fetch gallery items');
                }

                const galleryItems = await galleryResponse.json();

                // Get presentation details for each item
                const itemsWithDetails = [];
                for (const item of galleryItems) {
                    const detailResponse = await fetch(
                        `${supabaseUrl}/rest/v1/presentations?id=eq.${item.presentation_id}&select=title,description,theme`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );

                    const presentationDetails = await detailResponse.json();
                    if (presentationDetails && presentationDetails.length > 0) {
                        itemsWithDetails.push({
                            ...item,
                            presentation: presentationDetails[0]
                        });
                    }
                }

                result = itemsWithDetails;
                break;

            case 'rate_presentation':
                const { galleryItemId, userId: ratingUserId } = galleryData;
                
                const rateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/gallery_ratings`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            gallery_item_id: galleryItemId,
                            user_id: ratingUserId,
                            rating: rating,
                            review_text: review || null
                        })
                    }
                );

                if (!rateResponse.ok) {
                    const errorText = await rateResponse.text();
                    throw new Error(`Failed to rate presentation: ${errorText}`);
                }

                result = await rateResponse.json();
                break;

            case 'increment_view':
                const { galleryItemId: viewItemId } = galleryData;
                
                const incrementResponse = await fetch(
                    `${supabaseUrl}/rest/v1/public_gallery?id=eq.${viewItemId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            view_count: 'increment' // This will be handled by a database function
                        })
                    }
                );

                if (!incrementResponse.ok) {
                    throw new Error('Failed to increment view count');
                }

                result = { success: true, message: 'View count incremented' };
                break;

            case 'get_featured':
                const featuredResponse = await fetch(
                    `${supabaseUrl}/rest/v1/public_gallery?is_featured=eq.true&order=published_at.desc&limit=10`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const featuredItems = await featuredResponse.json();

                // Add presentation details
                const featuredWithDetails = [];
                for (const item of featuredItems) {
                    const detailResponse = await fetch(
                        `${supabaseUrl}/rest/v1/presentations?id=eq.${item.presentation_id}&select=title,description,theme`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );

                    const presentationDetails = await detailResponse.json();
                    if (presentationDetails && presentationDetails.length > 0) {
                        featuredWithDetails.push({
                            ...item,
                            presentation: presentationDetails[0]
                        });
                    }
                }

                result = featuredWithDetails;
                break;

            case 'search':
                const { query: searchQuery, limit: searchLimit = 20 } = filters || {};
                
                if (!searchQuery) {
                    throw new Error('Search query is required');
                }

                // Search in presentation titles and tags
                const searchResponse = await fetch(
                    `${supabaseUrl}/rest/v1/public_gallery?or=(tags.cs.{${searchQuery}})&limit=${searchLimit}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const searchResults = await searchResponse.json();
                
                // Add presentation details and filter by title
                const searchWithDetails = [];
                for (const item of searchResults) {
                    const detailResponse = await fetch(
                        `${supabaseUrl}/rest/v1/presentations?id=eq.${item.presentation_id}&select=title,description,theme`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );

                    const presentationDetails = await detailResponse.json();
                    if (presentationDetails && presentationDetails.length > 0) {
                        const presentation = presentationDetails[0];
                        // Include if title matches or tags match
                        if (presentation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
                            searchWithDetails.push({
                                ...item,
                                presentation
                            });
                        }
                    }
                }

                result = searchWithDetails;
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Gallery manager error:', error);

        const errorResponse = {
            error: {
                code: 'GALLERY_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});