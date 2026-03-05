// app/api/auth/callback/route.ts
// This file handles the OAuth callback for Instagram Graph API using Next.js App Router Route Handlers.

import { URLSearchParams } from 'url';
import { NextResponse } from 'next/server'; // Import NextResponse for App Router Route Handlers
import { supabaseServerClient } from '@/utils/supabase/server'; // Adjust path if needed

// --- Configuration Constants ---
// IMPORTANT: Match this to the Graph API version you're using in your Meta for Developers app.
const FACEBOOK_GRAPH_API_VERSION = 'v19.0'; 

// --- Helper for consistent error redirection in Route Handlers ---
function redirectWithError(errorType: string, details?: any): NextResponse {
  const encodedDetails = details ? encodeURIComponent(JSON.stringify(details)) : '';
  const redirectUrl = `/auth-failed?error=${errorType}${encodedDetails ? `&details=${encodedDetails}` : ''}`;
  // Ensure NEXT_PUBLIC_BASE_URL is correctly set in your environment variables (e.g., https://dsire-boerboels.vercel.app)
  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}

// Route Handlers export HTTP methods as functions (e.g., GET, POST, PUT, DELETE)
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_reason = searchParams.get('error_reason');
  const error_description = searchParams.get('error_description');

  // --- Step 0: Handle initial authorization errors from Meta ---
  if (error) {
    console.error('Meta OAuth Error:', { error, error_reason, error_description });
    return redirectWithError('oauth_error', { error, error_reason, error_description });
  }

  // Ensure 'code' parameter is present
  if (!code) {
    console.error('Missing or invalid "code" parameter in callback.');
    return redirectWithError('missing_code');
  }

  console.log('Received OAuth authorization code. Initiating token exchange...');

  try {
    // --- Step 1.1: Exchange the short-lived authorization code for a short-lived Facebook User Access Token ---
    console.log('Attempting to exchange code for short-lived access token...');
    const shortLivedTokenResponse = await fetch(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/oauth/access_token`, // CORRECTED URL
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID || '', // Your Facebook App ID
          client_secret: process.env.INSTAGRAM_APP_SECRET || '', // Your Facebook App Secret
          grant_type: 'authorization_code',
          // IMPORTANT: This redirect_uri must EXACTLY match the one registered in your Meta App settings.
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || '',
          code: code,
        }).toString(),
      }
    );

    const shortLivedTokenData = await shortLivedTokenResponse.json();

    if (!shortLivedTokenResponse.ok || shortLivedTokenData.error) {
      console.error('Failed to get short-lived access token:', shortLivedTokenData);
      return redirectWithError('short_token_exchange_failed', shortLivedTokenData.error);
    }

    const { access_token: shortLivedAccessToken, user_id: facebookUserId } = shortLivedTokenData;
    if (!shortLivedAccessToken || !facebookUserId) {
        console.error('Short-lived token response missing expected data:', shortLivedTokenData);
        return redirectWithError('short_token_data_missing');
    }
    console.log('Successfully obtained short-lived Facebook User Access Token. User ID:', facebookUserId);

    // --- Step 1.2: Exchange short-lived token for a LONG-LIVED Facebook User Access Token ---
    console.log('Attempting to exchange short-lived token for long-lived token...');
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/oauth/access_token?` + // CORRECTED URL
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: process.env.INSTAGRAM_APP_ID || '',
          client_secret: process.env.INSTAGRAM_APP_SECRET || '',
          fb_exchange_token: shortLivedAccessToken,
        }).toString(),
      { method: 'GET' }
    );

    const longLivedTokenData = await longLivedTokenResponse.json();

    if (!longLivedTokenResponse.ok || longLivedTokenData.error) {
      console.error('Failed to get long-lived access token:', longLivedTokenData);
      return redirectWithError('long_token_exchange_failed', longLivedTokenData.error);
    }

    const { access_token: longLivedAccessToken, expires_in: expiresInSeconds } = longLivedTokenData;
    if (!longLivedAccessToken || !expiresInSeconds) {
        console.error('Long-lived token response missing expected data:', longLivedTokenData);
        return redirectWithError('long_token_data_missing');
    }
    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    console.log(`Successfully obtained LONG-LIVED Facebook User Access Token. Expires in: ${expiresInSeconds} seconds.`);

    // --- Step 2: Get Instagram Business/Creator Account ID ---
    console.log('Attempting to fetch Instagram Business Account ID...');
    const instagramAccountResponse = await fetch(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${facebookUserId}/accounts?fields=instagram_business_account&access_token=${longLivedAccessToken}` // CORRECTED URL
    );
    const instagramAccountData = await instagramAccountResponse.json();

    if (!instagramAccountResponse.ok || instagramAccountData.error) {
        console.error('Failed to fetch Facebook Pages/Instagram Business Account:', instagramAccountData);
        return redirectWithError('fetch_instagram_account_failed', instagramAccountData.error);
    }

    // Ensure there are data results
    if (!instagramAccountData.data || instagramAccountData.data.length === 0) {
        console.warn('No Facebook Pages found for user, or pages have no Instagram Business Account connected.');
        return redirectWithError('no_facebook_pages');
    }

    // Filter to find a page that has an instagram_business_account connected
    const connectedInstagramAccount = instagramAccountData.data.find(
      (page: any) => page.instagram_business_account
    );

    if (!connectedInstagramAccount) {
      console.warn('No Instagram Business Account found connected to any of the user\'s Facebook Pages.');
      return redirectWithError('no_instagram_business_account_found');
    }

    const instagramAccountId = connectedInstagramAccount.instagram_business_account.id;
    if (!instagramAccountId) {
        console.error('Instagram Business Account ID not found in response:', connectedInstagramAccount);
        return redirectWithError('instagram_account_id_missing');
    }
    console.log('Successfully obtained Instagram Business Account ID:', instagramAccountId);

    // --- Step 3 & 4: Store all necessary data in your Supabase database ---
    console.log('Attempting to store data in Supabase...');

    const { data, error: dbError } = await supabaseServerClient
      .from('instagram_credentials')
      .upsert(
        {
          facebook_user_id: facebookUserId,
          instagram_account_id: instagramAccountId,
          access_token: longLivedAccessToken,
          expires_at: tokenExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
          // created_at is handled by DB default on new inserts, but explicitly setting on upsert is fine
          created_at: new Date().toISOString(), 
        },
        {
          onConflict: 'facebook_user_id', // If a record with this Facebook User ID already exists, update it.
          ignoreDuplicates: false,
        }
      )
      .select(); // Optionally select the updated/inserted row to confirm

    if (dbError) {
      console.error('Error storing Instagram credentials in Supabase:', dbError);
      return redirectWithError('db_store_failed', dbError.message);
    }

    console.log('Successfully stored Instagram credentials in Supabase:', data);

    // --- Final Step: Redirect to success page ---
    const successRedirectUrl = `/auth-success?instagramAccountId=${instagramAccountId}&facebookUserId=${facebookUserId}`;
    return NextResponse.redirect(new URL(successRedirectUrl, request.url));

  } catch (e: any) {
    console.error('Unhandled server error during Instagram Graph API process:', e);
    // In production, avoid exposing raw error messages to the client.
    return redirectWithError('server_exception', { message: 'An unexpected server error occurred.' });
  }
}

// IMPORTANT: Add NEXT_PUBLIC_BASE_URL to your .env.local (and Vercel config)
// Example: NEXT_PUBLIC_BASE_URL="https://dsire-boerboels.vercel.app"