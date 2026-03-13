// app/about/page.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Image */}
      <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1974&auto=format&fit=crop"
          alt="Majestic Boerboel dog"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
          <div className="max-w-7xl mx-auto px-6 text-white">
            <h1 className="text-5xl md:text-7xl font-black mb-4">About Dsire</h1>
            <p className="text-xl md:text-2xl max-w-2xl text-gray-200">
              Raising protectors, building bloodlines, creating lifelong companions.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left Column - Main Text */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="text-yellow-800 font-semibold italic">
                "Kings are born, but warriors are chosen."
              </p>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              <span className="text-2xl font-bold text-gray-900">Dsire Boerboel Kennel</span> is built on passion, dedication, and deep respect for the noble Boerboel breed. We are committed to raising powerful, stable, and loyal guardians that are not only protectors but true family companions.
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              Every Dsire Boerboel is carefully bred from selected bloodlines for health, temperament, and excellence. From their earliest days, our puppies are raised with intentional care, proper socialization, and close human bonding to ensure they grow into confident, dependable, and emotionally balanced dogs.
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              We believe in <span className="font-bold text-gray-900">quality over quantity</span> and responsible placement, ensuring each puppy joins a home where they will be valued, loved, and given purpose.
            </p>
            
            <p className="text-gray-700 leading-relaxed text-lg font-medium">
              At Dsire Boerboel Kennel, we are not just breeding dogs — we are raising protectors, building bloodlines, and creating lifelong companions.
            </p>
          </div>

          {/* Right Column - Stats & Values */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
                <span className="text-3xl font-black text-yellow-600">10+</span>
                <p className="text-sm text-gray-600 mt-1">Years Experience</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
                <span className="text-3xl font-black text-yellow-600">50+</span>
                <p className="text-sm text-gray-600 mt-1">Champion Lines</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
                <span className="text-3xl font-black text-yellow-600">200+</span>
                <p className="text-sm text-gray-600 mt-1">Happy Families</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
                <span className="text-3xl font-black text-yellow-600">24/7</span>
                <p className="text-sm text-gray-600 mt-1">Support</p>
              </div>
            </div>

            {/* Values Section */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Our Values</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="bg-white/20 p-1 rounded-full">✓</span>
                  <span>Health & Temperament First</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-white/20 p-1 rounded-full">✓</span>
                  <span>Ethical Breeding Practices</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-white/20 p-1 rounded-full">✓</span>
                  <span>Lifetime Support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="bg-white/20 p-1 rounded-full">✓</span>
                  <span>Champion Bloodlines</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Link 
                href="/contact" 
                className="flex-1 bg-black text-white text-center py-3 rounded-lg font-bold hover:bg-gray-800 transition shadow-md"
              >
                Contact Us
              </Link>
              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2347019996837'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white text-center py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 text-center border-t pt-12">
          <blockquote className="text-2xl italic text-gray-700 max-w-3xl mx-auto">
            "A Boerboel is not just a dog — it's a legacy, a protector, and a member of the family. 
            We take that responsibility seriously."
          </blockquote>
          <p className="mt-4 text-gray-500">— Dsire Boerboels Team</p>
        </div>
      </div>
    </div>
  );
}