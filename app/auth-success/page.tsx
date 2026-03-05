// app/auth-success/page.tsx
// This component is a Server Component by default, perfect for displaying data from searchParams.

import Head from 'next/head'; // No longer needed for metadata, but can be for other head elements
import { Metadata } from 'next';

// Define metadata for the page (similar to <Head> in Pages Router)
export const metadata: Metadata = {
  title: 'Integration Success - dsire-boerboels',
  description: 'Instagram integration successful for dsire-boerboels',
};

// The component receives searchParams directly as props
export default function AuthSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const instagramAccountId = searchParams.instagramAccountId as string | undefined;
  const facebookUserId = searchParams.facebookUserId as string | undefined;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '50px auto', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {/* <Head> is replaced by the metadata export above. */}

      <h1 style={{ color: '#28a745', borderBottom: '1px solid #28a745', paddingBottom: '10px', marginBottom: '20px' }}>
        🎉 Instagram Integration Successful!
      </h1>

      <p style={{ fontSize: '1.1em', lineHeight: '1.6' }}>
        Congratulations! Your Instagram Business Account is now successfully connected to dsire-boerboels.
        You can now start pulling your feeds to your website.
      </p>

      <div style={{ backgroundColor: '#f9f9f9', borderLeft: '3px solid #28a745', padding: '15px', marginTop: '25px', borderRadius: '4px' }}>
        <p><strong>Connected Details:</strong></p>
        {facebookUserId && <p>Facebook User ID: <code>{facebookUserId}</code></p>}
        {instagramAccountId && <p>Instagram Business Account ID: <code>{instagramAccountId}</code></p>}
        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
          (These IDs are for our system's reference and are securely stored.)
        </p>
      </div>

      <p style={{ marginTop: '30px', textAlign: 'center' }}>
        {/* For client-side navigation like this link, you might eventually use <Link> from next/link */}
        <a href="/" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Go to Homepage
        </a>
      </p>
    </div>
  );
}