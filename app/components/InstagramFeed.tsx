// app/components/InstagramFeed.tsx
"use client";
import { useState } from 'react';

// Unsplash placeholder images (dog-related)
const placeholderPosts = [
  { 
    id: 1, 
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop', 
    likes: 234, 
    comments: 12,
    url: 'https://instagram.com/dsireboerboels'
  },
  { 
    id: 2, 
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop', 
    likes: 567, 
    comments: 23,
    url: 'https://instagram.com/dsireboerboels'
  },
  { 
    id: 3, 
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop', 
    likes: 189, 
    comments: 8,
    url: 'https://instagram.com/dsireboerboels'
  },
  { 
    id: 4, 
    image: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=400&h=400&fit=crop', 
    likes: 892, 
    comments: 45,
    url: 'https://instagram.com/dsireboerboels'
  },
  { 
    id: 5, 
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&h=400&fit=crop', 
    likes: 445, 
    comments: 19,
    url: 'https://instagram.com/dsireboerboels'
  },
  { 
    id: 6, 
    image: 'https://images.unsplash.com/photo-1579213838747-495914e6fb9f?w=400&h=400&fit=crop', 
    likes: 678, 
    comments: 31,
    url: 'https://instagram.com/dsireboerboels'
  },
];

export default function InstagramFeed() {
  return (
    <div className="my-8">
      <div className="text-center mb-6">
        <a 
          href="https://instagram.com/dsireboerboels" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:opacity-90 transition shadow-lg text-sm md:text-base"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
          </svg>
          Follow @dsireboerboels on Instagram
        </a>
      </div>

      {/* Placeholder Grid - Responsive */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {placeholderPosts.map((post) => (
          <a 
            key={post.id}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition"
          >
            <img 
              src={post.image} 
              alt="Instagram post"
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 md:gap-4">
              <span className="text-white text-xs md:text-sm flex items-center gap-1">
                ❤️ {post.likes}
              </span>
              <span className="text-white text-xs md:text-sm flex items-center gap-1">
                💬 {post.comments}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Temporary notice */}
      <p className="text-center text-xs md:text-sm text-gray-400 mt-4">
        Live Instagram feed coming soon • Follow us for daily updates
      </p>
    </div>
  );
}