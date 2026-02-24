// app/components/MobileMenu.tsx
"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-black focus:outline-none z-50 relative"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 relative flex flex-col justify-between">
          <span className={`w-full h-0.5 bg-black transform transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-full h-0.5 bg-black transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-full h-0.5 bg-black transform transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-20">
          <div className="flex flex-col items-center space-y-6 p-8">
            <Link 
              href="/" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
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
              href="/about" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="text-2xl font-bold hover:text-yellow-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <a 
              href="https://dsireboerboels.matthorg.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-8 py-4 rounded-lg font-bold text-xl w-full text-center mt-4"
              onClick={() => setIsOpen(false)}
            >
              Admin Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}