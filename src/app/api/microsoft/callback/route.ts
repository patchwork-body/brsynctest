import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { createClient } from '@/lib/supabase';
import { Database, TablesInsert } from '@/types/supabase';

// Microsoft Graph API response types
interface MicrosoftUser {
  id: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  department?: string;
  manager?: {
    emailAddress?: {
      address?: string;
    };
  };
  telephoneNumber?: string;
  accountEnabled: boolean;
}

interface MicrosoftGroup {
  id: string;
  displayName?: string;
  description?: string;
  mailEnabled: boolean;
  securityEnabled: boolean;
}

interface MicrosoftGraphResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient<Database>();

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_authorization_code', request.url)
      );
    }

    // Parse state to get integration details
    let integrationData = null;
    if (state) {
      try {
        integrationData = JSON.parse(state);
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    // Extract code verifier from state for PKCE
    const codeVerifier = integrationData?.codeVerifier;
    if (!codeVerifier) {
      console.error('Missing code verifier in state');
      return NextResponse.redirect(
        new URL('/?error=missing_code_verifier', request.url)
      );
    }

    // Validate environment variables
    if (!env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID) {
      console.error('Missing NEXT_PUBLIC_MS_AZURE_CLIENT_ID');
      return NextResponse.redirect(
        new URL('/?error=missing_client_id', request.url)
      );
    }

    if (!env.MS_AZURE_APP_SECRET) {
      console.error('Missing MS_AZURE_APP_SECRET');
      return NextResponse.redirect(
        new URL('/?error=missing_client_secret', request.url)
      );
    }

    // Prepare token exchange request
    const redirectUri =
      env.NEXT_PUBLIC_MS_AZURE_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/microsoft/callback`;

    const tokenRequestBody = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID,
      client_secret: env.MS_AZURE_APP_SECRET,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope:
        'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Group.Read.All',
      code_verifier: codeVerifier,
    });

    console.log('Token exchange request:', {
      client_id: env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope:
        'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Group.Read.All',
      code_verifier_present: !!codeVerifier,
      code_length: code?.length,
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequestBody,
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
        requestBody: Object.fromEntries(tokenRequestBody.entries()),
      });

      // Try to parse error data for more details
      let errorMessage = 'token_exchange_failed';
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError.error) {
          errorMessage = `${parsedError.error}: ${parsedError.error_description || 'Unknown error'}`;
        }
      } catch {
        // If parsing fails, use the raw error data
        errorMessage = errorData;
      }

      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Failed to get current user:', userError);
      return NextResponse.redirect(
        new URL('/?error=user_not_authenticated', request.url)
      );
    }

    // Create integration record in database
    const integrationInsertData: TablesInsert<'integrations'> = {
      name: integrationData?.integrationName || 'Microsoft Entra ID',
      type: 'microsoft_entra',
      status: 'active',
      config: {
        tenant_id: tokenData.tenant_id || null,
        scope:
          'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Group.Read.All',
      },
      auth_data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: new Date(
          Date.now() + tokenData.expires_in * 1000
        ).toISOString(),
      },
      last_sync_at: new Date().toISOString(),
      created_by: user.id,
    };

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .insert(integrationInsertData)
      .select()
      .single();

    if (integrationError) {
      console.error('Failed to create integration:', integrationError);
      return NextResponse.redirect(
        new URL('/?error=integration_creation_failed', request.url)
      );
    }

    console.log('Successfully created Microsoft integration:', {
      integrationId: integration.id,
      integrationName: integration.name,
      status: integration.status,
    });

    // Fetch users and groups from Microsoft Graph API
    try {
      const accessToken = tokenData.access_token;

      // Fetch users from Microsoft Graph
      const usersResponse = await fetch(
        'https://graph.microsoft.com/v1.0/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,manager,telephoneNumber,accountEnabled&$top=999',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!usersResponse.ok) {
        console.error(
          'Failed to fetch users from Microsoft Graph:',
          usersResponse.status,
          usersResponse.statusText
        );
      } else {
        const usersData =
          (await usersResponse.json()) as MicrosoftGraphResponse<MicrosoftUser>;
        console.log(
          `Fetched ${usersData.value?.length || 0} users from Microsoft Graph`
        );

        // Transform users data for database sync
        const employeeData =
          usersData.value?.map((user: MicrosoftUser) => ({
            external_id: user.id,
            first_name: user.givenName || '',
            last_name: user.surname || '',
            email: user.mail || user.userPrincipalName || '',
            employee_id: user.id,
            job_title: user.jobTitle || null,
            department: user.department || null,
            manager_email: user.manager?.emailAddress?.address || null,
            phone: user.telephoneNumber || null,
            status: user.accountEnabled ? 'active' : 'inactive',
          })) || [];

        // Sync users to database using the stored procedure
        if (employeeData.length > 0) {
          const { data: syncResult, error: syncError } = await supabase.rpc(
            'sync_employees_from_integration',
            {
              integration_uuid: integration.id,
              employee_data: employeeData,
            }
          );

          if (syncError) {
            console.error('Failed to sync employees:', syncError);
          } else {
            console.log('Successfully synced employees:', syncResult);
          }
        }
      }

      // Fetch groups from Microsoft Graph
      const groupsResponse = await fetch(
        'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,mailEnabled,securityEnabled&$top=999',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!groupsResponse.ok) {
        console.error(
          'Failed to fetch groups from Microsoft Graph:',
          groupsResponse.status,
          groupsResponse.statusText
        );
      } else {
        const groupsData = await groupsResponse.json();
        console.log(
          `Fetched ${groupsData.value?.length || 0} groups from Microsoft Graph`
        );

        // Transform groups data for database sync
        const groupsToInsert: TablesInsert<'groups'>[] =
          groupsData.value?.map((group: MicrosoftGroup) => ({
            name: group.displayName || 'Unnamed Group',
            description: group.description || null,
            external_id: group.id,
            integration_id: integration.id,
            created_by: user.id,
          })) || [];

        // Sync groups to database
        if (groupsToInsert.length > 0) {
          const { data: groupsResult, error: groupsError } = await supabase
            .from('groups')
            .upsert(groupsToInsert, {
              onConflict: 'external_id,integration_id',
              ignoreDuplicates: false,
            })
            .select();

          if (groupsError) {
            console.error('Failed to sync groups:', groupsError);
          } else {
            console.log(
              `Successfully synced ${groupsResult?.length || 0} groups`
            );
          }
        }
      }

      // Update integration last sync time
      await supabase
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', integration.id);
    } catch (syncError) {
      console.error('Error during data sync:', syncError);
      // Don't fail the entire callback if sync fails
    }

    // Redirect back to the main page with success message
    return NextResponse.redirect(
      new URL(
        `/?success=true&integration=${encodeURIComponent(
          integrationData?.integrationName || 'Microsoft Entra ID'
        )}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=callback_error', request.url)
    );
  }
}
