// Microsoft OAuth callback handler
import { NextRequest, NextResponse } from 'next/server';
import { authConfig, microsoftEndpoints } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Validate state parameter for security
  const storedState = request.cookies.get('oauth_state')?.value;
  if (state && storedState && state !== storedState) {
    return NextResponse.redirect(
      new URL('/auth/signin?error=invalid_state', request.url)
    );
  }

  // Handle OAuth errors
  if (error) {
    console.error('Microsoft OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/signin?error=missing_code', request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(microsoftEndpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: authConfig.microsoft.clientId,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: authConfig.microsoft.redirectUri,
        scope: authConfig.microsoft.scopes.join(' '),
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user information from Microsoft Graph
    const userResponse = await fetch(microsoftEndpoints.userInfo, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`User info request failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Create user session (implement based on your session management)
    const user = {
      id: userData.id,
      email: userData.mail || userData.userPrincipalName,
      name: userData.displayName,
      avatar: userData.photo?.url || null,
      provider: 'microsoft',
      role: 'user', // Set based on your business logic
    };

    // In a real implementation, you would:
    // 1. Store the user in your database
    // 2. Create a JWT token
    // 3. Set secure HTTP-only cookies
    // 4. Handle refresh tokens

    // For now, redirect to dashboard with success
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set a temporary cookie for demonstration
    response.cookies.set('auth_user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/signin?error=callback_failed', request.url)
    );
  }
}