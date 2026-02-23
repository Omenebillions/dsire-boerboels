// components/TestimonialCarousel.tsx
"use client";
import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: "Oluwaseun A.",
    location: "Lagos",
    image: "/testimonial1.jpg",
    text: "Getting Max from Dsire Boerboels was the best decision ever. He's healthy, intelligent, and has the perfect temperament. The breeder walked us through everything - from feeding to training. 5 stars!",
    rating: 5,
    puppy: "Max - 8 months old"
  },
  {
    id: 2,
    name: "Chioma O.",
    location: "Abuja",
    image: "/testimonial2.jpg",
    text: "I was nervous about buying a puppy online, but the team made it so easy. They sent videos, health records, and even helped with delivery to Abuja. Bella is absolutely perfect!",
    rating: 5,
    puppy: "Bella - 6 months old"
  },
  {
    id: 3,
    name: "Michael I.",
    location: "Port Harcourt",
    image: "/testimonial3.jpg",
    text: "The after-sales support is incredible. Even months after getting Rocky, they still check up on him and answer all my questions. This is how breeding should be done.",
    rating: 5,
    puppy: "Rocky - 1 year old"
  }
];

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((curr) => (curr + 1) % testimonials.length);
  const prev = () => setCurrent((curr) => (curr - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="relative">
      {/* Main Testimonial */}
      <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Image */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-yellow-500">
            <img 
              src={testimonials[current].image} 
              alt={testimonials[current].name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            {/* Rating */}
            <div className="flex gap-1 text-yellow-500 text-xl mb-3">
              {'★'.repeat(testimonials[current].rating)}
              {'☆'.repeat(5 - testimonials[current].rating)}
            </div>
            
            {/* Quote */}
            <p className="text-lg md:text-xl text-gray-700 italic mb-4">
              "{testimonials[current].text}"
            </p>
            
            {/* Author */}
            <div>
              <p className="font-bold text-lg">{testimonials[current].name}</p>
              <p className="text-gray-500">{testimonials[current].location}</p>
              <p className="text-sm text-yellow-600 mt-1">{testimonials[current].puppy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
      >
        ←
      </button>
      <button 
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
      >
        →
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition ${
              i === current ? 'bg-yellow-500 w-4' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}