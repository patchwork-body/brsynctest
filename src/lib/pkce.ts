/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Required by Microsoft Entra ID for cross-origin authorization code redemption
 */

/**
 * Generate a cryptographically random string for code verifier
 * @param length - Length of the code verifier (43-128 characters)
 * @returns Base64URL-encoded code verifier
 */
export function generateCodeVerifier(length: number = 128): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  // Convert to base64url encoding
  const base64 = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return base64;
}

/**
 * Generate code challenge from code verifier using SHA256
 * @param codeVerifier - The code verifier string
 * @returns Base64URL-encoded code challenge
 */
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url encoding
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return base64;
}

/**
 * Generate both code verifier and challenge
 * @param length - Length of the code verifier
 * @returns Object containing code verifier and challenge
 */
export async function generatePKCEPair(length: number = 128): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateCodeVerifier(length);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
  };
}
