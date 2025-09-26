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
        const { action, code, presentationId, googleFileId, syncDirection } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (!googleClientId || !googleClientSecret) {
            throw new Error('Google OAuth configuration missing');
        }

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

        let result;

        switch (action) {
            case 'oauth_callback':
                if (!code) {
                    throw new Error('Authorization code is required');
                }

                // Exchange authorization code for access token
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        code,
                        client_id: googleClientId,
                        client_secret: googleClientSecret,
                        redirect_uri: `${req.headers.get('origin') || 'https://app.slidefast.io'}/auth/google/callback`,
                        grant_type: 'authorization_code',
                    }),
                });

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    throw new Error(`Google OAuth failed: ${errorText}`);
                }

                const tokenData = await tokenResponse.json();

                // Get user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                    },
                });

                if (!userInfoResponse.ok) {
                    throw new Error('Failed to get Google user info');
                }

                const googleUser = await userInfoResponse.json();

                // Encrypt tokens (simple base64 for demo - use proper encryption in production)
                const encryptedAccessToken = btoa(tokenData.access_token);
                const encryptedRefreshToken = tokenData.refresh_token ? btoa(tokenData.refresh_token) : null;

                // Store OAuth connection
                const oauthResponse = await fetch(
                    `${supabaseUrl}/rest/v1/google_oauth`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            google_user_id: googleUser.id,
                            google_email: googleUser.email,
                            access_token_encrypted: encryptedAccessToken,
                            refresh_token_encrypted: encryptedRefreshToken,
                            token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
                            scope: tokenData.scope || 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/presentations'
                        })
                    }
                );

                if (!oauthResponse.ok) {
                    const errorText = await oauthResponse.text();
                    throw new Error(`Failed to store OAuth connection: ${errorText}`);
                }

                result = await oauthResponse.json();
                break;

            case 'get_connection':
                const connectionResponse = await fetch(
                    `${supabaseUrl}/rest/v1/google_oauth?user_id=eq.${userId}&is_active=eq.true`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const connections = await connectionResponse.json();
                result = connections.length > 0 ? {
                    connected: true,
                    google_email: connections[0].google_email,
                    connected_at: connections[0].connected_at,
                    last_sync_at: connections[0].last_sync_at
                } : { connected: false };
                break;

            case 'disconnect':
                const disconnectResponse = await fetch(
                    `${supabaseUrl}/rest/v1/google_oauth?user_id=eq.${userId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ is_active: false })
                    }
                );

                if (!disconnectResponse.ok) {
                    throw new Error('Failed to disconnect Google account');
                }

                result = { success: true, message: 'Google account disconnected' };
                break;

            case 'import_from_drive':
                // Get OAuth connection
                const oauthConnection = await getOAuthConnection(userId);
                if (!oauthConnection) {
                    throw new Error('Google account not connected');
                }

                const accessToken = atob(oauthConnection.access_token_encrypted);

                // Get file from Google Drive
                const fileResponse = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${googleFileId}?alt=media`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        }
                    }
                );

                if (!fileResponse.ok) {
                    throw new Error('Failed to download file from Google Drive');
                }

                const fileContent = await fileResponse.text();

                // Convert Google Slides format to our format (simplified)
                const convertedContent = await convertGoogleSlidesToOurFormat(fileContent);

                // Create presentation
                const createPresentationResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentations`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            title: convertedContent.title || 'Imported from Google Slides',
                            description: convertedContent.description || 'Imported presentation',
                            content: convertedContent.content,
                            theme: 'professional',
                            status: 'draft'
                        })
                    }
                );

                const newPresentation = await createPresentationResponse.json();
                const newPresentationId = newPresentation[0].id;

                // Create mapping record
                await fetch(
                    `${supabaseUrl}/rest/v1/google_drive_files`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            presentation_id: newPresentationId,
                            google_file_id: googleFileId,
                            sync_direction: 'import'
                        })
                    }
                );

                // Log sync history
                await logSyncHistory(userId, newPresentationId, googleFileId, 'import', 'success');

                result = { 
                    success: true, 
                    presentation_id: newPresentationId,
                    message: 'Presentation imported successfully' 
                };
                break;

            case 'export_to_drive':
                const exportOauthConnection = await getOAuthConnection(userId);
                if (!exportOauthConnection) {
                    throw new Error('Google account not connected');
                }

                const exportAccessToken = atob(exportOauthConnection.access_token_encrypted);

                // Get presentation
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

                // Convert our format to Google Slides format
                const googleSlidesContent = await convertOurFormatToGoogleSlides(presentation);

                // Create file in Google Drive
                const createFileResponse = await fetch(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${exportAccessToken}`,
                            'Content-Type': 'multipart/related; boundary=boundary123'
                        },
                        body: createMultipartBody({
                            name: presentation.title,
                            mimeType: 'application/vnd.google-apps.presentation'
                        }, googleSlidesContent)
                    }
                );

                if (!createFileResponse.ok) {
                    const errorText = await createFileResponse.text();
                    throw new Error(`Failed to export to Google Drive: ${errorText}`);
                }

                const createdFile = await createFileResponse.json();

                // Create mapping record
                await fetch(
                    `${supabaseUrl}/rest/v1/google_drive_files`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            presentation_id: presentationId,
                            google_file_id: createdFile.id,
                            google_file_name: createdFile.name,
                            sync_direction: 'export'
                        })
                    }
                );

                // Log sync history
                await logSyncHistory(userId, presentationId, createdFile.id, 'export', 'success');

                result = {
                    success: true,
                    google_file_id: createdFile.id,
                    file_url: `https://docs.google.com/presentation/d/${createdFile.id}`,
                    message: 'Presentation exported to Google Drive successfully'
                };
                break;

            case 'get_sync_history':
                const historyResponse = await fetch(
                    `${supabaseUrl}/rest/v1/google_sync_history?user_id=eq.${userId}&order=created_at.desc&limit=20`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                result = await historyResponse.json();
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Google OAuth error:', error);

        const errorResponse = {
            error: {
                code: 'GOOGLE_OAUTH_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Helper functions
    async function getOAuthConnection(userId) {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/google_oauth?user_id=eq.${userId}&is_active=eq.true`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );
        const connections = await response.json();
        return connections.length > 0 ? connections[0] : null;
    }

    async function logSyncHistory(userId, presentationId, googleFileId, syncType, status, error = null) {
        await fetch(
            `${supabaseUrl}/rest/v1/google_sync_history`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    presentation_id: presentationId,
                    google_file_id: googleFileId,
                    sync_type: syncType,
                    status: status,
                    error_message: error
                })
            }
        );
    }

    async function convertGoogleSlidesToOurFormat(content) {
        // Simplified conversion - in production this would be more sophisticated
        return {
            title: 'Imported Presentation',
            description: 'Imported from Google Slides',
            content: {
                slides: [
                    {
                        id: '1',
                        title: 'Imported Slide',
                        content: ['Content imported from Google Slides'],
                        speaker_notes: 'Imported slide content'
                    }
                ],
                metadata: {
                    audience_level: 'intermediate',
                    presentation_type: 'business',
                    tone: 'professional'
                }
            }
        };
    }

    async function convertOurFormatToGoogleSlides(presentation) {
        // Simplified conversion - in production this would create proper Google Slides format
        return JSON.stringify({
            title: presentation.title,
            slides: presentation.content?.slides || []
        });
    }

    function createMultipartBody(metadata, content) {
        const boundary = 'boundary123';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;
        
        const metadataPart = delimiter + 
            'Content-Type: application/json\r\n\r\n' + 
            JSON.stringify(metadata);
            
        const contentPart = delimiter + 
            'Content-Type: application/json\r\n\r\n' + 
            content;
            
        return metadataPart + contentPart + closeDelim;
    }
});