Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(req.url);
    let pathname = url.pathname;
    
    // Handle custom domain routing: when slidefast.ai routes through api-gateway
    // the pathname will be /functions/v1/api-gateway, but we want to treat it as /
    if (pathname === '/functions/v1/api-gateway' || pathname === '/functions/v1/api-gateway/') {
        pathname = '/';
        console.log(`🔄 Custom domain detected - treating as root path`);
    }
    
    // Debug logging to understand what path we're receiving
    console.log(`🔍 Received request - URL: ${req.url}, pathname: ${pathname}, original pathname: ${url.pathname}, host: ${req.headers.get('host')}, method: ${req.method}`);
    
    // For GET requests: If it's not explicitly an API route, serve the React app
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
        console.log(`🌐 Serving React app for static route: ${pathname}`);
        const indexHtml = `<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Slidefast AI - Create Amazing Presentations</title>
  <meta name="description" content="Create stunning, AI-powered presentations with Slidefast. Transform your ideas into professional slides instantly with intelligent design and content generation." />
  <meta name="keywords" content="AI presentations, slides, presentation maker, artificial intelligence, design, business presentations" />
  <meta name="author" content="Slidefast AI" />
  
  <!-- Security and OAuth Configuration -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com https://ssl.gstatic.com https://www.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https: http:;
    connect-src 'self' https://xhlpnnoskmewqkjriqxq.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com;
    frame-src 'self' https://accounts.google.com https://content.googleapis.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accounts.google.com;
  " />
  
  <!-- Preconnect for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://accounts.google.com">
  <link rel="preconnect" href="https://xhlpnnoskmewqkjriqxq.supabase.co">
  
  <!-- DNS prefetch for OAuth domains -->
  <link rel="dns-prefetch" href="//accounts.google.com">
  <link rel="dns-prefetch" href="//apis.google.com">
  <link rel="dns-prefetch" href="//oauth2.googleapis.com">
  
  <!-- Meta tags for OAuth and social sharing -->
  <meta property="og:title" content="Slidefast AI - Create Amazing Presentations" />
  <meta property="og:description" content="Transform your ideas into professional slides instantly with AI-powered design and content generation." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://slidefast.ai" />
  
  <!-- Favicon and app icons -->
  <link rel="icon" type="image/svg+xml" href="https://dl4quu77k06i.space.minimax.io/vite.svg" />
  
  <!-- Additional security headers -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN" />
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
  <script type="module" crossorigin src="https://dl4quu77k06i.space.minimax.io/assets/index-Bj5kgsv4.js"></script>
  <link rel="stylesheet" crossorigin href="https://dl4quu77k06i.space.minimax.io/assets/index-DmrOKNDg.css">
</head>

<body>
  <div id="root"></div>
</body>

</html>`;
        
        return new Response(indexHtml, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                ...corsHeaders
            }
        });
    }

    // Handle static assets by redirecting to the working deployment
    if (req.method === 'GET' && (pathname.startsWith('/assets/') || pathname.endsWith('.js') || pathname.endsWith('.css') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.svg') || pathname.endsWith('.ico') || pathname.endsWith('.woff') || pathname.endsWith('.woff2') || pathname.endsWith('.ttf') || pathname.includes('worker'))) {
        console.log(`🔗 Redirecting static asset: ${pathname}`);
        const reactAppUrl = 'https://dl4quu77k06i.space.minimax.io';
        const redirectUrl = reactAppUrl + pathname + url.search;
        
        return new Response(null, {
            status: 302,
            headers: {
                'Location': redirectUrl,
                ...corsHeaders
            }
        });
    }

    // From here on, handle API routes only
    console.log(`🔧 Processing API route: ${pathname}`);
    
    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Authentication: Check for API key or auth token
        const apiKey = req.headers.get('x-api-key');
        const authHeader = req.headers.get('authorization');
        let userId = null;
        let apiKeyRecord = null;

        if (apiKey) {
            // Validate API key
            const keyResponse = await fetch(
                `${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${await hashApiKey(apiKey)}&is_active=eq.true`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const keys = await keyResponse.json();
            if (keys.length === 0) {
                throw new Error('Invalid API key');
            }

            apiKeyRecord = keys[0];
            userId = apiKeyRecord.user_id;

            // Check rate limits
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            const usageResponse = await fetch(
                `${supabaseUrl}/rest/v1/api_usage_logs?api_key_id=eq.${apiKeyRecord.id}&created_at=gte.${oneHourAgo.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const usage = await usageResponse.json();
            if (usage.length >= apiKeyRecord.rate_limit_per_hour) {
                throw new Error('API rate limit exceeded');
            }

            // Update usage count
            await fetch(
                `${supabaseUrl}/rest/v1/api_keys?id=eq.${apiKeyRecord.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        last_used_at: now.toISOString(),
                        usage_count: apiKeyRecord.usage_count + 1
                    })
                }
            );

        } else if (authHeader) {
            // Validate auth token
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!userResponse.ok) {
                throw new Error('Invalid auth token');
            }

            const userData = await userResponse.json();
            userId = userData.id;
        } else {
            throw new Error('Authentication required: provide either x-api-key or authorization header');
        }

        // Parse URL to determine endpoint
        const pathSegments = pathname.split('/').filter(Boolean);
        const [resource, id, subResource, subId] = pathSegments;

        let result;
        const startTime = Date.now();

        // Route requests based on resource
        switch (resource) {
            case 'presentations':
                result = await handlePresentationsAPI(req.method, id, subResource, subId, url.searchParams, userId, req);
                break;

            case 'gallery':
                result = await handleGalleryAPI(req.method, id, url.searchParams);
                break;

            case 'analytics':
                result = await handleAnalyticsAPI(req.method, id, url.searchParams, userId);
                break;

            case 'sharing':
                result = await handleSharingAPI(req.method, id, url.searchParams, userId, req);
                break;

            case 'templates':
                result = await handleTemplatesAPI(req.method, id, url.searchParams);
                break;

            default:
                throw new Error(`Unknown API resource: ${resource}`);
        }

        // Log API usage if using API key
        if (apiKeyRecord) {
            const responseTime = Date.now() - startTime;
            await fetch(
                `${supabaseUrl}/rest/v1/api_usage_logs`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        api_key_id: apiKeyRecord.id,
                        endpoint: pathname,
                        method: req.method,
                        status_code: 200,
                        response_time_ms: responseTime,
                        user_agent: req.headers.get('user-agent'),
                        ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')
                    })
                }
            );
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Gateway error:', error);

        const errorResponse = {
            error: {
                code: 'API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: error.message.includes('rate limit') ? 429 : 
                   error.message.includes('Invalid') ? 401 : 
                   error.message.includes('Authentication required') ? 401 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Helper function to hash API keys
    async function hashApiKey(apiKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // API handlers (keeping the existing implementation)
    async function handlePresentationsAPI(method, id, subResource, subId, searchParams, userId, req) {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        switch (method) {
            case 'GET':
                if (id) {
                    // Get specific presentation
                    const response = await fetch(
                        `${supabaseUrl}/rest/v1/presentations?id=eq.${id}&user_id=eq.${userId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    const data = await response.json();
                    return data.length > 0 ? data[0] : null;
                } else {
                    // List presentations
                    const limit = searchParams.get('limit') || '20';
                    const offset = searchParams.get('offset') || '0';
                    const response = await fetch(
                        `${supabaseUrl}/rest/v1/presentations?user_id=eq.${userId}&limit=${limit}&offset=${offset}&order=updated_at.desc`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    return await response.json();
                }

            case 'POST':
                // Create presentation
                const createData = await req.json();
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/presentations`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({ ...createData, user_id: userId })
                    }
                );
                const result = await response.json();
                return result[0];

            case 'PUT':
            case 'PATCH':
                // Update presentation
                const updateData = await req.json();
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentations?id=eq.${id}&user_id=eq.${userId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({ ...updateData, updated_at: new Date().toISOString() })
                    }
                );
                const updateResult = await updateResponse.json();
                return updateResult[0];

            case 'DELETE':
                // Delete presentation
                await fetch(
                    `${supabaseUrl}/rest/v1/presentations?id=eq.${id}&user_id=eq.${userId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                return { success: true };

            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    async function handleGalleryAPI(method, id, searchParams) {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        switch (method) {
            case 'GET':
                const limit = searchParams.get('limit') || '20';
                const offset = searchParams.get('offset') || '0';
                const category = searchParams.get('category');
                
                let query = `${supabaseUrl}/rest/v1/public_gallery?limit=${limit}&offset=${offset}&order=created_at.desc`;
                if (category) {
                    query += `&category=eq.${category}`;
                }
                
                const response = await fetch(query, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                return await response.json();
                
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    async function handleAnalyticsAPI(method, id, searchParams, userId) {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        switch (method) {
            case 'GET':
                if (id) {
                    // Get analytics for specific presentation
                    const response = await fetch(
                        `${supabaseUrl}/rest/v1/presentation_analytics?presentation_id=eq.${id}&user_id=eq.${userId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    return await response.json();
                } else {
                    // Get user analytics summary
                    const response = await fetch(
                        `${supabaseUrl}/rest/v1/presentation_analytics?user_id=eq.${userId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    return await response.json();
                }
                
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    async function handleSharingAPI(method, id, searchParams, userId, req) {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        switch (method) {
            case 'GET':
                // Get sharing links for presentation
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/sharing_links?presentation_id=eq.${id}&user_id=eq.${userId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );
                return await response.json();
                
            case 'POST':
                // Create sharing link
                const linkData = await req.json();
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
                        body: JSON.stringify({ ...linkData, user_id: userId })
                    }
                );
                const result = await createResponse.json();
                return result[0];
                
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    async function handleTemplatesAPI(method, id, searchParams) {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        switch (method) {
            case 'GET':
                if (id) {
                    // Get specific template
                    const response = await fetch(
                        `${supabaseUrl}/rest/v1/templates?id=eq.${id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    const data = await response.json();
                    return data.length > 0 ? data[0] : null;
                } else {
                    // List templates
                    const limit = searchParams.get('limit') || '20';
                    const offset = searchParams.get('offset') || '0';
                    const category = searchParams.get('category');
                    
                    let query = `${supabaseUrl}/rest/v1/templates?limit=${limit}&offset=${offset}&order=created_at.desc`;
                    if (category) {
                        query += `&category=eq.${category}`;
                    }
                    
                    const response = await fetch(query, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    return await response.json();
                }
                
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }
});