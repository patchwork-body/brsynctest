import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { createClient } from '@supabase/supabase-js';
import { Database, TablesInsert } from '@/types/supabase';

// Google API response types
interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: {
    givenName?: string;
    familyName?: string;
    fullName?: string;
  };
  organizations?: Array<{
    title?: string;
    department?: string;
  }>;
  phones?: Array<{
    value?: string;
    type?: string;
  }>;
  suspended: boolean;
  customSchemas?: {
    [key: string]: unknown;
  };
}

interface GoogleGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
}

interface GoogleApiResponse<T> {
  users?: T[];
  groups?: T[];
  nextPageToken?: string;
}

export async function GET(request: NextRequest) {
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

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

    // Parse state
    let integrationData = null;
    if (state) {
      try {
        integrationData = JSON.parse(state);
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    const codeVerifier = integrationData?.codeVerifier;
    if (!codeVerifier) {
      console.error('Missing code verifier in state');
      return NextResponse.redirect(
        new URL('/?error=missing_code_verifier', request.url)
      );
    }

    // Exchange code for token
    const redirectUri =
      env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_APP_CLIENT_ID,
        client_secret: env.GOOGLE_APP_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(`/?error=token_exchange_failed`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Create integration record
    const integrationInsertData: TablesInsert<'integrations'> = {
      name: integrationData?.integrationName || 'Google Workspace',
      type: 'google_workspace',
      status: 'active',
      config: {
        scope: 'admin.directory.user.readonly admin.directory.group.readonly',
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

    console.log('Successfully created Google integration:', {
      integrationId: integration.id,
      integrationName: integration.name,
    });

    // Fetch users and groups from Google Admin SDK
    try {
      const accessToken = tokenData.access_token;

      // Fetch all users with pagination
      const allUsers: GoogleUser[] = [];
      let nextPageToken: string | undefined = undefined;

      do {
        const usersUrl = new URL(
          'https://admin.googleapis.com/admin/directory/v1/users'
        );
        usersUrl.searchParams.set('customer', 'my_customer'); // Gets all users in the domain
        usersUrl.searchParams.set('maxResults', '500');
        if (nextPageToken) {
          usersUrl.searchParams.set('pageToken', nextPageToken);
        }

        const usersResponse = await fetch(usersUrl.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!usersResponse.ok) {
          console.error(
            'Failed to fetch users from Google:',
            usersResponse.status,
            await usersResponse.text()
          );
          break;
        }

        const usersData =
          (await usersResponse.json()) as GoogleApiResponse<GoogleUser>;
        if (usersData.users) {
          allUsers.push(...usersData.users);
        }
        nextPageToken = usersData.nextPageToken;
      } while (nextPageToken);

      console.log(`Fetched ${allUsers.length} users from Google Workspace`);

      // Transform users data
      const employeeData = allUsers.map(user => ({
        external_id: user.id,
        first_name: user.name?.givenName || '',
        last_name: user.name?.familyName || '',
        email: user.primaryEmail,
        employee_id: user.id,
        job_title: user.organizations?.[0]?.title || null,
        department: user.organizations?.[0]?.department || null,
        manager_email: null, // Google doesn't provide manager directly
        phone: user.phones?.[0]?.value || null,
        status: user.suspended ? 'inactive' : 'active',
      }));

      // Sync users to database
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

      // Fetch all groups with pagination
      const allGroups: GoogleGroup[] = [];
      nextPageToken = undefined;

      do {
        const groupsUrl = new URL(
          'https://admin.googleapis.com/admin/directory/v1/groups'
        );
        groupsUrl.searchParams.set('customer', 'my_customer');
        groupsUrl.searchParams.set('maxResults', '200');
        if (nextPageToken) {
          groupsUrl.searchParams.set('pageToken', nextPageToken);
        }

        const groupsResponse = await fetch(groupsUrl.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!groupsResponse.ok) {
          console.error(
            'Failed to fetch groups from Google:',
            groupsResponse.status,
            await groupsResponse.text()
          );
          break;
        }

        const groupsData =
          (await groupsResponse.json()) as GoogleApiResponse<GoogleGroup>;
        if (groupsData.groups) {
          allGroups.push(...groupsData.groups);
        }
        nextPageToken = groupsData.nextPageToken;
      } while (nextPageToken);

      console.log(`Fetched ${allGroups.length} groups from Google Workspace`);

      // Transform groups data
      const groupsToInsert: TablesInsert<'groups'>[] = allGroups.map(group => ({
        name: group.name,
        description: group.description || null,
        external_id: group.id,
        integration_id: integration.id,
      }));

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
    }

    return NextResponse.redirect(
      new URL(
        `/?success=true&integration=${encodeURIComponent(
          integrationData?.integrationName || 'Google Workspace'
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
