// app/components/FeaturedPuppies.tsx
import Link from 'next/link';

// Unsplash placeholder images for puppies
const puppies = [
  {
    id: 1,
    name: 'King Max',
    age: '8 Weeks',
    gender: 'Male',
    status: 'available',
    price: '₦1,500,000',
    image: 'https://images.unsplash.com/photo-1583511655826-45700d6f3f7c?w=400&h=400&fit=crop',
    color: 'Brown Brindle',
    parents: 'Titan x Luna'
  },
  {
    id: 2,
    name: 'Queen Bella',
    age: '7 Weeks',
    gender: 'Female',
    status: 'available',
    price: '₦1,500,000',
    image: 'https://images.unsplash.com/photo-1591768575198-1d8c0c2f6e1b?w=400&h=400&fit=crop',
    color: 'Fawn',
    parents: 'Hercules x Zara'
  },
  {
    id: 3,
    name: 'Rocky',
    age: '10 Weeks',
    gender: 'Male',
    status: 'reserved',
    price: '₦1,800,000',
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop',
    color: 'Dark Brindle',
    parents: 'Titan x Luna'
  }
];

export default function FeaturedPuppies() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
      {puppies.map((puppy) => (
        <div key={puppy.id} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* Image Container */}
          <div className="relative h-48 md:h-64 overflow-hidden">
            <img 
              src={puppy.image} 
              alt={puppy.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              loading="lazy"
            />
            {/* Status Badge */}
            <span className={`absolute top-2 right-2 md:top-4 md:right-4 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold
              ${puppy.status === 'available' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
              {puppy.status.charAt(0).toUpperCase() + puppy.status.slice(1)}
            </span>
            {/* Price Badge */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-black/70 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
              {puppy.price}
            </div>
          </div>

          {/* Content */}
          <div className="p-3 md:p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg md:text-xl font-bold">{puppy.name}</h3>
              <span className="text-xs md:text-sm text-gray-500">{puppy.gender}</span>
            </div>
            
            <div className="space-y-1 text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
              <p>🎂 {puppy.age}</p>
              <p>🎨 {puppy.color}</p>
              <p>👪 {puppy.parents}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link 
                href={`/puppies/${puppy.id}`}
                className="flex-1 text-center border border-black text-black py-2 rounded-lg hover:bg-black hover:text-white transition text-sm md:text-base"
              >
                Details
              </Link>
              <a 
                href="https://wa.me/2348000000000" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm md:text-base"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}