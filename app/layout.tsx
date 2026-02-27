// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import MobileMenu from "@/app/components/MobileMenu";

export const metadata = {
  title: "Dsire Boerboels",
  description: "Premium Boerboel Kennel & Puppies For Sale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <nav className="w-full flex items-center justify-between px-4 md:px-6 py-3 shadow-md sticky top-0 bg-white z-50 border-b border-gray-200">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl md:text-2xl font-bold text-black">
              DSIRE Boerboels
            </span>
          </Link>

          {/* Desktop Menu - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="/" className="text-black hover:text-yellow-600 transition font-medium">
              Home
            </Link>
            <Link href="/about" className="text-black hover:text-yellow-600 transition font-medium">
              About
            </Link>
            <Link href="/puppies" className="text-black hover:text-yellow-600 transition font-medium">
              Puppies
            </Link>
            <Link href="/studs" className="text-black hover:text-yellow-600 transition font-medium">
              Studs
            </Link>
            <Link href="/females" className="text-black hover:text-yellow-600 transition font-medium">
              Females
            </Link>
            
            {/* NEW: Dsire Pawshop */}
            <Link href="/pawshop" className="text-black hover:text-yellow-600 transition font-medium flex items-center gap-1">
              <span>🛍️</span> Pawshop
            </Link>
            
            {/* NEW: Consult & Train (combined) */}
            <Link href="/consult-train" className="text-black hover:text-yellow-600 transition font-medium flex items-center gap-1">
              <span>📚</span> Consult & Train
            </Link>
            
            <Link href="/gallery" className="text-black hover:text-yellow-600 transition font-medium">
              Gallery
            </Link>
            <Link href="/testimonials" className="text-black hover:text-yellow-600 transition font-medium">
              Testimonials
            </Link>
            <Link href="/contact" className="text-black hover:text-yellow-600 transition font-medium">
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Desktop Admin Button */}
            <Link
              href="https://mthorg.com/login"
              className="hidden md:block px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition text-sm lg:text-base font-medium shadow-sm"
            >
              Admin Dashboard
            </Link>
            
            {/* Mobile Menu Component */}
            <MobileMenu />
          </div>
        </nav>

        <main className="min-h-screen">{children}</main>

        <footer className="p-4 md:p-6 text-center text-gray-500 border-t mt-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-lg font-bold text-gray-700">DSIRE Boerboels</span>
            <p className="text-sm md:text-base">© {new Date().getFullYear()} Dsire Boerboels — All Rights Reserved</p>
          </div>
          <div className="mt-2 text-xs md:text-sm">
            <span>A tintville Design. Powered by </span>
            <a 
              href="https://mthorg.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black font-medium hover:underline"
            >
              MatthOrg
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}