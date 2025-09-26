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
        const { email } = await req.json();

        if (!email || !email.trim()) {
            throw new Error('Email address is required');
        }

        console.log('Password reset request for email:', email);

        // Get Supabase environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Check if user exists first
        const userCheckResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!userCheckResponse.ok) {
            console.error('Failed to check users');
            // Still proceed with reset request for security (don't reveal if email exists)
        } else {
            const usersData = await userCheckResponse.json();
            const userExists = usersData.users?.some((user: any) => user.email === email.trim());
            console.log('User exists check:', userExists);
        }

        // Send password reset email using Supabase Auth API
        const resetResponse = await fetch(`${supabaseUrl}/auth/v1/recover`, {
            method: 'POST',
            headers: {
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.trim(),
                redirect_to: `${req.headers.get('origin') || 'https://626bvoyech47.space.minimax.io'}/reset-password`
            })
        });

        if (!resetResponse.ok) {
            const errorText = await resetResponse.text();
            console.error('Password reset failed:', errorText);
            
            // Parse the error to provide better user feedback
            if (errorText.includes('User not found')) {
                // For security, we still return success but log this
                console.log('Password reset requested for non-existent email:', email);
            } else {
                throw new Error('Failed to send password reset email');
            }
        }

        const result = {
            data: {
                message: 'Password reset email sent successfully',
                email: email.trim(),
                success: true
            }
        };

        console.log('Password reset email sent successfully for:', email);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Password reset error:', error);

        const errorResponse = {
            error: {
                code: 'PASSWORD_RESET_FAILED',
                message: error.message || 'Failed to send password reset email'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
