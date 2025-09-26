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
        const url = new URL(req.url);
        const pathname = url.pathname;

        // Handle static assets
        if (pathname.startsWith('/assets/')) {
            // For now, redirect asset requests to a placeholder or return basic content
            if (pathname.includes('.js')) {
                return new Response('console.log("React app loading...");', {
                    headers: { 
                        ...corsHeaders, 
                        'Content-Type': 'application/javascript',
                        'Cache-Control': 'public, max-age=31536000'
                    }
                });
            } else if (pathname.includes('.css')) {
                return new Response('/* React app styles */', {
                    headers: { 
                        ...corsHeaders, 
                        'Content-Type': 'text/css',
                        'Cache-Control': 'public, max-age=31536000'
                    }
                });
            }
        }

        // Handle API routes by forwarding to api-gateway
        if (pathname.startsWith('/functions/v1/') || pathname.startsWith('/api/')) {
            // Forward to api-gateway function for API calls
            const apiPath = pathname.replace('/api/', '/');
            const apiGatewayUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/api-gateway${apiPath}${url.search}`;
            
            const response = await fetch(apiGatewayUrl, {
                method: req.method,
                headers: req.headers,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : null
            });

            const responseData = await response.text();
            return new Response(responseData, {
                status: response.status,
                headers: response.headers
            });
        }

        // Serve the React SPA for all other routes
        // Since this is a Single Page Application, we always return index.html 
        // and let React Router handle client-side routing
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
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  
  <!-- Additional security headers -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN" />
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
  <script type="module" crossorigin src="/assets/index-Bj5kgsv4.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-DmrOKNDg.css">
</head>

<body>
  <div id="root"></div>
</body>

</html>`;

        return new Response(indexHtml, {
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Frame-Options': 'SAMEORIGIN',
                'X-Content-Type-Options': 'nosniff'
            }
        });

    } catch (error) {
        console.error('Main routing error:', error);

        const errorResponse = {
            error: {
                code: 'ROUTING_ERROR', 
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
