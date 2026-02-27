// app/consult-train/page.tsx
import Link from 'next/link';

export default function ConsultTrainPage() {
  const services = [
    {
      title: "1-on-1 Dog Training",
      price: "₦35,000/session",
      duration: "60 mins",
      description: "Personalized training for your Boerboel at your home",
      icon: "🎯"
    },
    {
      title: "Puppy Obedience Classes",
      price: "₦80,000/4 sessions",
      duration: "Group class",
      description: "Basic commands, socialization, and leash training",
      icon: "🐕"
    },
    {
      title: "Behavioral Consultation",
      price: "₦45,000",
      duration: "90 mins",
      description: "Address aggression, anxiety, or behavioral issues",
      icon: "🧠"
    },
    {
      title: "Virtual Training",
      price: "₦25,000/session",
      duration: "45 mins",
      description: "Online video consultation and training",
      icon: "💻"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Consultation & Dog Training</h1>
      <p className="text-gray-600 mb-8">Professional training for your Boerboel</p>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {services.map((service, i) => (
          <div key={i} className="border rounded-xl p-6 hover:shadow-lg transition">
            <div className="text-4xl mb-3">{service.icon}</div>
            <h3 className="text-xl font-bold mb-2">{service.title}</h3>
            <p className="text-gray-600 mb-3">{service.description}</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{service.price}</p>
                <p className="text-sm text-gray-500">{service.duration}</p>
              </div>
              <Link 
                href="/contact" 
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Trainer Bio */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">Meet Your Trainer</h2>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
          <div>
            <h3 className="text-xl font-bold">Mr Ezenwa Christain</h3>
            <p className="text-yellow-600 mb-2">Certified Dog Trainer • 10+ years experience</p>
            <p className="text-gray-600">
              Specializing in Boerboels and large breed training.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}