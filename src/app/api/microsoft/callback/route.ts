import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';

export async function GET(request: NextRequest) {
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

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID,
          client_secret: env.MS_AZURE_APP_SECRET,
          code: code,
          redirect_uri: `${request.nextUrl.origin}/api/microsoft/callback`,
          grant_type: 'authorization_code',
          scope: 'User.Read.All Group.Read.All',
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // TODO: Store the access token and integration data in your database
    // For now, we'll just log the successful authentication
    console.log('Successfully authenticated with Microsoft:', {
      integrationType: integrationData?.integrationType,
      integrationName: integrationData?.integrationName,
      accessToken: tokenData.access_token ? 'present' : 'missing',
      expiresIn: tokenData.expires_in,
    });

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
