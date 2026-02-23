// components/FeaturedPuppies.tsx
import Link from 'next/link';

const puppies = [
  {
    id: 1,
    name: 'King Max',
    age: '8 Weeks',
    gender: 'Male',
    status: 'available',
    price: '₦1,500,000',
    image: '/pup1.jpg',
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
    image: '/pup2.jpg',
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
    image: '/pup3.jpg',
    color: 'Dark Brindle',
    parents: 'Titan x Luna'
  }
];

export default function FeaturedPuppies() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {puppies.map((puppy) => (
        <div key={puppy.id} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* Image Container */}
          <div className="relative h-64 overflow-hidden">
            <img 
              src={puppy.image} 
              alt={puppy.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
            {/* Status Badge */}
            <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold
              ${puppy.status === 'available' ? 'bg-green-500 text-white' : 
                puppy.status === 'reserved' ? 'bg-orange-500 text-white' : 
                'bg-gray-500 text-white'}`}>
              {puppy.status.charAt(0).toUpperCase() + puppy.status.slice(1)}
            </span>
            {/* Price Badge */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
              {puppy.price}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">{puppy.name}</h3>
              <span className="text-sm text-gray-500">{puppy.gender}</span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>🎂 {puppy.age}</p>
              <p>🎨 {puppy.color}</p>
              <p>👪 {puppy.parents}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link 
                href={`/puppies/${puppy.id}`}
                className="flex-1 text-center border border-black text-black py-2 rounded-lg hover:bg-black hover:text-white transition"
              >
                View Details
              </Link>
              <a 
                href="https://wa.me/2348000000000" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
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