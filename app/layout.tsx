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
        <nav className="w-full flex items-center justify-between px-4 md:px-6 py-3 shadow sticky top-0 bg-white z-50">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Dsire Boerboels" 
              width={150} 
              height={50}
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Menu - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link href="/" className="hover:text-yellow-600 transition font-medium">Home</Link>
            <Link href="/puppies" className="hover:text-yellow-600 transition font-medium">Puppies</Link>
            <Link href="/studs" className="hover:text-yellow-600 transition font-medium">Studs</Link>
            <Link href="/females" className="hover:text-yellow-600 transition font-medium">Females</Link>
            <Link href="/gallery" className="hover:text-yellow-600 transition font-medium">Gallery</Link>
            <Link href="/testimonials" className="hover:text-yellow-600 transition font-medium">Testimonials</Link>
            <Link href="/about" className="hover:text-yellow-600 transition font-medium">About</Link>
            <Link href="/contact" className="hover:text-yellow-600 transition font-medium">Contact</Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Desktop Admin Button */}
            <Link
              href="https://matthorg.com/login"
              className="hidden md:block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition text-sm lg:text-base font-medium whitespace-nowrap"
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
            {/* Logo in footer */}
            <Image 
              src="/logo.png" 
              alt="Dsire Boerboels" 
              width={100} 
              height={30}
              className="h-8 w-auto opacity-70 hover:opacity-100 transition"
            />
            <p className="text-sm md:text-base">© {new Date().getFullYear()} Dsire Boerboels — All Rights Reserved</p>
          </div>
          <div className="mt-2 text-xs md:text-sm">
            <span>Powered by </span>
            <a 
              href="https://matthorg.com" 
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