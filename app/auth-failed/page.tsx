// app/auth-failed/page.tsx
// This component is a Server Component by default.

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integration Failed - dsire-boerboels',
  description: 'Instagram integration failed for dsire-boerboels',
};

export default function AuthFailedPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error = searchParams.error as string | undefined;
  const details = searchParams.details as string | undefined;

  let errorMessage = 'An unexpected error occurred during Instagram integration.';
  let detailedInfo = '';

  // Parse and display errors more user-friendly
  if (error === 'oauth_error') {
    try {
      const errorData = JSON.parse(decodeURIComponent(details as string));
      errorMessage = `Instagram/Facebook authorization failed: ${errorData.error_description || errorData.error_reason || errorData.error || 'Unknown reason.'}`;
      detailedInfo = `Error Code: ${errorData.error}`;
      if (errorData.error_reason) detailedInfo += `, Reason: ${errorData.error_reason}`;
    } catch {
      errorMessage = `Instagram/Facebook authorization failed. The OAuth provider returned an error.`;
      detailedInfo = `Error Type: ${error}`;
    }
  } else if (error === 'short_token_exchange_failed') {
      errorMessage = 'Failed to get a short-lived access token from Facebook. This might be due to incorrect app settings or permissions.';
      detailedInfo = `Details: ${details ? decodeURIComponent(details) : 'Check server logs for more info.'}`;
  } else if (error === 'long_token_exchange_failed') {
      errorMessage = 'Failed to exchange for a long-lived access token. The temporary token might be invalid or expired.';
      detailedInfo = `Details: ${details ? decodeURIComponent(details) : 'Check server logs for more info.'}`;
  } else if (error === 'fetch_instagram_account_failed') {
      errorMessage = 'Failed to retrieve connected Instagram accounts. This could mean required permissions are missing (e.g., "pages_show_list").';
      detailedInfo = `Details: ${details ? decodeURIComponent(details) : 'Check server logs for more info.'}`;
  } else if (error === 'no_instagram_business_account_found') {
      errorMessage = 'No Instagram Business or Creator Account was found connected to any of your Facebook Pages.';
      detailedInfo = 'Please ensure the Facebook Page you authorized is linked to an Instagram Business or Creator Account in your Facebook Page settings.';
  } else if (error === 'no_facebook_pages') {
      errorMessage = 'No Facebook Pages were found associated with your account, or you did not grant permission to manage pages.';
      detailedInfo = 'Ensure you granted all requested permissions ("pages_show_list") and your Instagram Account is linked to a Facebook Page.';
  } else if (error === 'server_exception') {
      errorMessage = 'A server-side error prevented the integration from completing. Our apologies!';
      detailedInfo = `Details: ${details ? decodeURIComponent(details) : 'Please check server logs for more specific information.'}`;
  } else if (error === 'missing_code') {
      errorMessage = 'The authorization code was not received. The OAuth flow might have been interrupted or malformed.';
  } else if (error === 'db_store_failed') {
      errorMessage = 'Failed to save your Instagram credentials to our database. This is a backend issue.';
      detailedInfo = `Details: ${details ? decodeURIComponent(details) : 'Please inform support.'}`;
  } else if (error === 'instagram_account_id_missing') {
      errorMessage = 'The Instagram Business Account ID could not be extracted from the response.';
  } else if (error === 'short_token_data_missing') {
      errorMessage = 'Essential data (access token, user ID) was missing from the initial token exchange response.';
  } else if (error === 'long_token_data_missing') {
      errorMessage = 'Essential data (access token, expiry) was missing from the long-lived token exchange response.';
  }
  
  // Generic error fallback
  if (!detailedInfo && details) {
    detailedInfo = `Raw Details: ${decodeURIComponent(details as string)}`;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '50px auto', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {/* <Head> is replaced by the metadata export above. */}

      <h1 style={{ color: '#dc3545', borderBottom: '1px solid #dc3545', paddingBottom: '10px', marginBottom: '20px' }}>
        ❌ Instagram Integration Failed
      </h1>

      <p style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#333' }}>
        We encountered an issue while trying to connect your Instagram account.
      </p>

      <div style={{ backgroundColor: '#fff0f0', borderLeft: '3px solid #dc3545', padding: '15px', marginTop: '25px', borderRadius: '4px' }}>
        <p><strong>Error Message:</strong></p>
        <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{errorMessage}</p>
        {detailedInfo && (
            <>
                <p style={{ marginTop: '10px' }}><strong>Details:</strong></p>
                <p style={{ fontSize: '0.9em', color: '#666' }}>{detailedInfo}</p>
            </>
        )}
      </div>

      <p style={{ marginTop: '30px', textAlign: 'center' }}>
        Please ensure you've authorized all requested permissions and that your Instagram Business/Creator Account is correctly
        linked to a Facebook Page. You can try again or contact support if the issue persists.
      </p>

      <p style={{ marginTop: '30px', textAlign: 'center' }}>
        <a href="/" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Go to Homepage
        </a>
      </p>
    </div>
  );
}