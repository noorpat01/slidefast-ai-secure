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
        const { action, presentationId, branchName = 'main', versionData, versionId, changeSummary } = await req.json();

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
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
            case 'create_version':
                // Get next version number
                const versionResponse = await fetch(
                    `${supabaseUrl}/rest/v1/rpc/get_next_version_number`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            p_id: presentationId, 
                            branch: branchName 
                        })
                    }
                );

                const nextVersion = await versionResponse.json();
                const versionNumber = nextVersion || 1;

                // Create new version
                const createResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions`,
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
                            version_number: versionNumber,
                            branch_name: branchName,
                            created_by: userId,
                            title: versionData.title,
                            description: versionData.description,
                            content: versionData.content,
                            theme: versionData.theme,
                            change_summary: changeSummary,
                            is_current_version: true
                        })
                    }
                );

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create version: ${errorText}`);
                }

                // Mark previous version as not current
                await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions?presentation_id=eq.${presentationId}&branch_name=eq.${branchName}&is_current_version=eq.true`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ is_current_version: false })
                    }
                );

                result = await createResponse.json();
                break;

            case 'get_versions':
                const versionsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions?presentation_id=eq.${presentationId}&order=created_at.desc`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                if (!versionsResponse.ok) {
                    throw new Error('Failed to fetch versions');
                }

                result = await versionsResponse.json();
                break;

            case 'restore_version':
                // Get version to restore
                const restoreResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions?id=eq.${versionId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const versionToRestore = await restoreResponse.json();
                if (!versionToRestore || versionToRestore.length === 0) {
                    throw new Error('Version not found');
                }

                const version = versionToRestore[0];

                // Update the main presentation
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentations?id=eq.${presentationId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: version.title,
                            description: version.description,
                            content: version.content,
                            theme: version.theme,
                            updated_at: new Date().toISOString()
                        })
                    }
                );

                if (!updateResponse.ok) {
                    throw new Error('Failed to restore version');
                }

                // Create a new version entry for this restoration
                const restoreVersionNumber = await getNextVersionNumber(presentationId, branchName);
                await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            presentation_id: presentationId,
                            version_number: restoreVersionNumber,
                            branch_name: branchName,
                            parent_version_id: versionId,
                            created_by: userId,
                            title: version.title,
                            description: version.description,
                            content: version.content,
                            theme: version.theme,
                            change_summary: `Restored from version ${version.version_number}`,
                            is_current_version: true
                        })
                    }
                );

                result = { success: true, message: 'Version restored successfully' };
                break;

            case 'create_branch':
                const { parentVersionId, newBranchName } = versionData;
                
                // Get parent version
                const parentResponse = await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions?id=eq.${parentVersionId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    }
                );

                const parentVersion = await parentResponse.json();
                if (!parentVersion || parentVersion.length === 0) {
                    throw new Error('Parent version not found');
                }

                const parent = parentVersion[0];

                // Create first version in new branch
                await fetch(
                    `${supabaseUrl}/rest/v1/presentation_versions`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            presentation_id: presentationId,
                            version_number: 1,
                            branch_name: newBranchName,
                            parent_version_id: parentVersionId,
                            created_by: userId,
                            title: parent.title,
                            description: parent.description,
                            content: parent.content,
                            theme: parent.theme,
                            change_summary: `Created branch '${newBranchName}' from version ${parent.version_number}`,
                            is_current_version: false
                        })
                    }
                );

                result = { success: true, message: `Branch '${newBranchName}' created successfully` };
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Version management error:', error);

        const errorResponse = {
            error: {
                code: 'VERSION_MANAGEMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Helper function
    async function getNextVersionNumber(presentationId, branchName) {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/get_next_version_number`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    p_id: presentationId, 
                    branch: branchName 
                })
            }
        );
        return await response.json() || 1;
    }
});