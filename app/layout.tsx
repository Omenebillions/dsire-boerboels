import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Dsire Boerboels",
  description: "Premium Boerboel Kennel & Puppies For Sale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <nav className="w-full flex items-center justify-between px-6 py-4 shadow">
          <h1 className="text-2xl font-bold">Dsire Boerboels</h1>

          <div className="flex space-x-6">
            <Link href="/">Home</Link>
            <Link href="/puppies">Puppies</Link>
            <Link href="/studs">Studs</Link>
            <Link href="/females">Females</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/testimonials">Testimonials</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <Link
            href="https://matthorg.com/login"
            className="px-4 py-2 bg-black text-white rounded-md"
          >
            Admin Dashboard
          </Link>
        </nav>

        <main className="min-h-screen">{children}</main>

        <footer className="p-6 text-center text-gray-500 border-t mt-10">
          © {new Date().getFullYear()} Dsire Boerboels — All Rights Reserved
        </footer>
      </body>
    </html>
  );
}