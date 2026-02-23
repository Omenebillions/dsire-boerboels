// app/components/InstagramFeed.tsx
"use client";
import { useEffect, useState } from 'react';

export default function InstagramFeed() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load LightWidget script
    const script = document.createElement('script');
    script.src = 'https://cdn.lightwidget.com/widgets/lightwidget.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://cdn.lightwidget.com/widgets/lightwidget.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="my-8">
      <div className="text-center mb-4">
        <a 
          href="https://instagram.com/dsireboerboels" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
          </svg>
          <span>Follow @dsireboerboels</span>
        </a>
      </div>

      {/* Loading skeleton */}
      {!loaded && (
        <div className="w-full min-h-[500px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Loading Instagram feed...</p>
        </div>
      )}

      {/* LightWidget iframe - FIXED: changed "true" to {true} */}
      <iframe 
  src="https://lightwidget.com/widgets/a269b6d8c9285c9cb70f9437fef36f5a.html" 
  scrolling="no" 
  // @ts-ignore - allowTransparency is a legacy attribute
  allowTransparency="true"
  className={`lightwidget-widget w-full min-h-[500px] border-0 overflow-hidden rounded-lg shadow-lg transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
  style={{ width: '100%', border: 0, overflow: 'hidden' }}
  title="Dsire Boerboels Instagram Feed"
  onLoad={() => setLoaded(true)}
/>
    </div>
  );
}