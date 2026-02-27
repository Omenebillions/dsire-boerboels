// app/components/MobileMenu.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Hamburger Button - Made more visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none z-50 relative shadow-md"
        aria-label="Toggle menu"
      >
        <div className="w-5 h-4 relative flex flex-col justify-between">
          <span 
            className={`w-full h-0.5 bg-white transform transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}
          />
          <span 
            className={`w-full h-0.5 bg-white transition-all duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span 
            className={`w-full h-0.5 bg-white transform transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}
          />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-20 overflow-y-auto">
          <div className="flex flex-col items-center space-y-6 p-8">
            {/* Logo in menu */}
            <Image 
              src="/logo.png" 
              alt="Dsire Boerboels" 
              width={120} 
              height={40}
              className="h-12 w-auto mb-4"
            />
            
            <Link 
              href="/" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            
            <Link 
              href="/about" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            <Link 
              href="/puppies" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Puppies
            </Link>
            
            <Link 
              href="/studs" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Studs
            </Link>
            
            <Link 
              href="/females" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Females
            </Link>
            
            {/* NEW: Dsire Pawshop */}
            <Link 
              href="/pawshop" 
              className="text-2xl font-bold hover:text-yellow-600 transition flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <span>🛍️</span> Pawshop
            </Link>
            
            {/* NEW: Consult & Train */}
            <Link 
              href="/consult-train" 
              className="text-2xl font-bold hover:text-yellow-600 transition flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <span>📚</span> Consult & Train
            </Link>
            
            <Link 
              href="/gallery" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </Link>
            
            <Link 
              href="/testimonials" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Testimonials
            </Link>
            
            <Link 
              href="/contact" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            
            {/* Divider */}
            <div className="w-16 h-0.5 bg-gray-200 my-4"></div>
            
            {/* Admin Dashboard Button in Mobile Menu */}
            <a 
              href="https://mthorg.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-8 py-4 rounded-lg font-bold text-xl w-full text-center hover:bg-gray-800 transition"
              onClick={() => setIsOpen(false)}
            >
              Admin Dashboard
            </a>
            
            {/* Social Links */}
            <div className="flex gap-6 mt-8">
              <a href="https://instagram.com/dsireboerboels" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
              <a href="https://facebook.com/dsireboerboels" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}