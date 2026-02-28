// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import InstagramFeed from '@/app/components/InstagramFeed';
import FeaturedPuppies from '@/app/components/FeaturedPuppies';
import TestimonialCarousel from '@/app/components/TestimonialCarousel';
import WhyChooseUs from '@/app/components/WhyChooseUs';

export default function Page() {
  return (
    <div>
      {/* HERO SECTION - Fixed with Next.js Image */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        {/* Background Image using Next.js Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/hero.png"
            alt="Dsire Boerboels - Premium Boerboel Kennel"
            fill
            className="object-cover"
            priority
            onError={(e) => {
              // Fallback if image fails to load
              console.log('Image failed to load, check if hero.png exists in public folder');
            }}
          />
        </div>
        
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        
        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          {/* Badge */}
          <span className="inline-block bg-yellow-500 text-black text-sm font-semibold px-4 py-2 rounded-full mb-6 w-fit">
            🏆 Premier Boerboel Kennel in Nigeria
          </span>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white max-w-4xl leading-tight">
            Premium Boerboels
            <span className="block text-yellow-400">Strong • Healthy • Champion Bloodline</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl text-gray-200 mt-6 max-w-2xl">
            Home of champion bloodlines. Ethically bred for health, temperament, and conformation.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mt-10">
            <Link 
              href="/puppies" 
              className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg"
            >
              View Available Puppies →
            </Link>
            
            <a 
              href="https://wa.me/2347019996837" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.177.181-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.043.072.043.419-.101.824z"/>
              </svg>
              WhatsApp Us
            </a>
          </div>
          
          {/* Social Proof */}
          <div className="flex items-center gap-6 mt-12">
            <div className="flex -space-x-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-300"></div>
              ))}
            </div>
            <p className="text-white">
              <span className="font-bold">100+</span> Happy Families
            </p>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES / STATS SECTION */}
      <section className="bg-gray-50 py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { number: '10+', label: 'Years Experience' },
            { number: '50+', label: 'Champion Bloodlines' },
            { number: '200+', label: 'Puppies Placed' },
            { number: '24/7', label: 'Support' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-black">{stat.number}</p>
              <p className="text-gray-600 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PUPPIES SECTION */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-yellow-600 font-semibold tracking-wider text-sm">OUR PUPPIES</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Featured Puppies</h2>
            <p className="text-gray-600 mt-3 text-lg">Available elite litters from champion parents</p>
          </div>
          <Link href="/puppies" className="text-black font-semibold hover:underline hidden md:block">
            View All →
          </Link>
        </div>

        <FeaturedPuppies />
        
        <div className="text-center mt-12 md:hidden">
          <Link href="/puppies" className="inline-block bg-black text-white px-8 py-3 rounded-lg">
            View All Puppies
          </Link>
        </div>
      </section>

      {/* INSTAGRAM LIVE FEED SECTION */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <span className="text-yellow-600 font-semibold tracking-wider text-sm">FOLLOW US</span>
              <h2 className="text-4xl md:text-5xl font-bold mt-2">Live Instagram Feed</h2>
              <p className="text-gray-600 mt-3 text-lg">See our dogs in action, daily updates, and behind the scenes</p>
            </div>
            <a 
              href="https://instagram.com/dsireboerboels" 
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 md:mt-0 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
              </svg>
              Follow @dsireboerboels
            </a>
          </div>
          
          <InstagramFeed />
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <WhyChooseUs />

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-600 font-semibold tracking-wider text-sm">TESTIMONIALS</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">What Our Families Say</h2>
            <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
              Don't just take our word for it - hear from families who've welcomed our puppies home
            </p>
          </div>
          
          <TestimonialCarousel />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Welcome a Boerboel Home?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Contact us today to learn about available puppies, upcoming litters, or to schedule a visit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              Contact Us Now
            </Link>
            <a 
              href="https://wa.me/2347019996837" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.177.181-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.043.072.043.419-.101.824z"/>
              </svg>
              WhatsApp Chat
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}