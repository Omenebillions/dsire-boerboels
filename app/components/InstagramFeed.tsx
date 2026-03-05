    // app/components/InstagramFeed.tsx
    "use client"; // This component needs client-side interactivity

    import React, { useEffect, useState } from 'react';
    import Image from 'next/image'; // Assuming you have Next.js Image component setup

    interface InstagramMedia {
      id: string;
      caption?: string;
      media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
      media_url: string;
      thumbnail_url?: string; // For videos
      permalink: string;
      timestamp: string;
      username: string;
    }

    export default function InstagramFeed() {
      const [feed, setFeed] = useState<InstagramMedia[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        async function fetchInstagramFeed() {
          try {
            const response = await fetch('/api/instagram-feed'); // Call your new API route
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch feed data.');
            }
            const data: InstagramMedia[] = await response.json();
            setFeed(data.slice(0, 6)); // Display first 6 items
          } catch (err: any) {
            console.error("Error loading Instagram feed:", err);
            setError(err.message || "Could not load Instagram feed.");
          } finally {
            setLoading(false);
          }
        }
        fetchInstagramFeed();
      }, []);

      if (loading) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        );
      }

      if (error) {
        return (
          <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">
            <p className="font-semibold mb-2">Error loading Instagram feed:</p>
            <p>{error}</p>
            <p className="text-sm mt-4">Please ensure your Instagram account is correctly connected via the admin panel, and the app has the necessary permissions.</p>
          </div>
        );
      }

      if (feed.length === 0) {
        return (
          <div className="text-center p-8 bg-blue-100 text-blue-700 rounded-lg">
            No Instagram posts found yet. Check your Instagram account or connect it.
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {feed.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <Image
                src={post.media_type === 'VIDEO' ? (post.thumbnail_url || '/placeholder.jpg') : post.media_url}
                alt={post.caption || 'Instagram Post'}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {post.media_type === 'VIDEO' && (
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                {/* You can add a caption overlay here if desired */}
              </div>
            </a>
          ))}
        </div>
      );
    }