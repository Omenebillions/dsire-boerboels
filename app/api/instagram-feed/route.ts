    // app/api/instagram-feed/route.ts
    import { NextResponse } from 'next/server';
    import { supabaseServerClient } from '@/utils/supabase/server'; // Your Supabase client

    const FACEBOOK_GRAPH_API_VERSION = 'v19.0'; // Match your Meta App version

    export async function GET(request: Request) {
      // You might want to add authentication here to ensure only authorized users/requests can get the feed
      // For now, it's open, but consider protecting this endpoint in production.

      try {
        // 1. Fetch Instagram Credentials from Supabase
        // You'll likely need a way to identify *which* client's feed to get.
        // For simplicity, let's assume you have only one client's data or fetch the most recent one.
        // In a multi-client app, you'd filter by a specific client_id or user_id.
        const { data: credentials, error: dbError } = await supabaseServerClient
          .from('instagram_credentials')
          .select('*')
          .single(); // Assuming one set of credentials for now

        if (dbError || !credentials) {
          console.error('Error fetching Instagram credentials from Supabase:', dbError);
          return NextResponse.json({ error: 'Instagram credentials not found' }, { status: 500 });
        }

        const { instagram_account_id, access_token } = credentials;

        if (!instagram_account_id || !access_token) {
          console.error('Instagram credentials incomplete:', credentials);
          return NextResponse.json({ error: 'Incomplete Instagram credentials' }, { status: 500 });
        }

        // 2. Query Instagram Graph API for media
        console.log(`Fetching Instagram feed for account ID: ${instagram_account_id}`);
        const instagramFeedResponse = await fetch(
          `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${instagram_account_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username&access_token=${access_token}`,
          { cache: 'no-store' } // Ensure fresh data on each request
        );

        const instagramFeedData = await instagramFeedResponse.json();

        if (!instagramFeedResponse.ok || instagramFeedData.error) {
          console.error('Error fetching Instagram feed from Graph API:', instagramFeedData);
          // Check for token expiration (code 190) and handle refreshing if needed
          if (instagramFeedData.error?.code === 190) {
            console.error("Access token expired or invalid. Refreshing token might be necessary.");
            // You'd implement token refresh logic here
          }
          return NextResponse.json({ error: 'Failed to fetch Instagram feed', details: instagramFeedData.error }, { status: 500 });
        }

        return NextResponse.json(instagramFeedData.data); // Return the array of media objects

      } catch (e: any) {
        console.error('Unhandled server error fetching Instagram feed:', e);
        return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
      }
    }