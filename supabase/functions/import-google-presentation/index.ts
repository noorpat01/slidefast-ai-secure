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
    const requestData = await req.json();
    const { googlePresentationId, title, description, slides, metadata } = requestData;

    // Mock successful import - in production this would use Supabase client
    console.log('Importing Google presentation:', { googlePresentationId, title, description });

    const presentationId = `imported_${Date.now()}`;

    return new Response(JSON.stringify({ 
      success: true, 
      presentationId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error importing Google presentation:', error);
    return new Response(JSON.stringify({ 
      error: {
        code: 'IMPORT_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
