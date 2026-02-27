// app/components/TestimonialCarousel.tsx
"use client";
import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: "Oluwaseun A.",
    location: "Lagos",
    image: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=100&h=100&fit=crop',
    text: "Getting Max from Dsire Boerboels was the best decision ever. He's healthy, intelligent, and has the perfect temperament.",
    rating: 5,
    puppy: "Max - 8 months old"
  },
  {
    id: 2,
    name: "Chioma O.",
    location: "Abuja",
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&h=100&fit=crop',
    text: "I was nervous about buying a puppy online, but the team made it so easy. Bella is absolutely perfect!",
    rating: 5,
    puppy: "Bella - 6 months old"
  },
  {
    id: 3,
    name: "Michael I.",
    location: "Port Harcourt",
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop',
    text: "The after-sales support is incredible. Even months after getting Rocky, they still check up on him.",
    rating: 5,
    puppy: "Rocky - 1 year old"
  }
];

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((curr) => (curr + 1) % testimonials.length);
  const prev = () => setCurrent((curr) => (curr - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="relative px-4">
      {/* Main Testimonial */}
      <div className="bg-gray-50 rounded-2xl p-4 md:p-12">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
          {/* Image */}
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-yellow-500">
            <img 
              src={testimonials[current].image} 
              alt={testimonials[current].name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            {/* Rating */}
            <div className="flex gap-1 text-yellow-500 text-lg md:text-xl mb-2 md:mb-3 justify-center md:justify-start">
              {'★'.repeat(testimonials[current].rating)}
            </div>
            
            {/* Quote */}
            <p className="text-sm md:text-lg text-gray-700 italic mb-2 md:mb-4">
              "{testimonials[current].text}"
            </p>
            
            {/* Author */}
            <div>
              <p className="font-bold text-base md:text-lg">{testimonials[current].name}</p>
              <p className="text-xs md:text-sm text-gray-500">{testimonials[current].location}</p>
              <p className="text-xs md:text-sm text-yellow-600 mt-1">{testimonials[current].puppy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 bg-white rounded-full p-2 md:p-3 shadow-lg hover:bg-gray-100 text-sm md:text-base"
      >
        ←
      </button>
      <button 
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 bg-white rounded-full p-2 md:p-3 shadow-lg hover:bg-gray-100 text-sm md:text-base"
      >
        →
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4 md:mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 md:h-2 rounded-full transition-all ${
              i === current ? 'w-4 md:w-6 bg-yellow-500' : 'w-1.5 md:w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}