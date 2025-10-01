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

    // Note: For public clients, client_secret is not required and should not be included

    // Prepare token exchange request
    const redirectUri =
      env.NEXT_PUBLIC_MS_AZURE_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/microsoft/callback`;

    const tokenRequestBody = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID,
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
