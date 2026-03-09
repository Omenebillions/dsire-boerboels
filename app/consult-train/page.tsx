// app/consult-train/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function ConsultTrainPage() {
  const trainingPrograms = [
    {
      title: "Basic Obedient Training",
      price: "₦200,000",
      duration: "2 Months (3 days/week)",
      description: "Perfect foundation for your Boerboel with essential commands",
      icon: "🐕",
      features: [
        "Socialization",
        "Sit",
        "Down",
        "Shake",
        "Heel without pulling",
        "Stay",
        "No command"
      ],
      color: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      title: "Advanced Training",
      price: "Contact for price",
      duration: "3 Months (3 days/week)",
      description: "Take your dog's training to the next level with advanced commands",
      icon: "🎯",
      features: [
        "Food Control",
        "Speak",
        "Eat on Command",
        "High Five",
        "Spin",
        "Fetch and Retrieve",
        "Off Leash Heel Walk",
        "Step Forward & Backward",
        "Crawl"
      ],
      color: "bg-purple-50",
      border: "border-purple-200"
    }
  ];

  const virtualTraining = [
    {
      level: "Basic",
      price: "₦150,000",
      duration: "1 Month (3x/week, 1hr sessions)",
      description: "Foundation training via video calls",
      icon: "💻",
      color: "bg-green-50"
    },
    {
      level: "Advanced",
      price: "₦400,000",
      duration: "3 Months (3x/week, 1hr sessions)",
      description: "Comprehensive virtual training program",
      icon: "📱",
      color: "bg-yellow-50"
    },
    {
      level: "Premium",
      price: "₦550,000",
      duration: "3 Months (4x/week, 1hr sessions)",
      description: "Intensive virtual training with more sessions",
      icon: "⭐",
      color: "bg-orange-50"
    }
  ];

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348177391928";
  const EMAIL = "dsire.boerboels@gmail.com";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Consultation & Dog Training
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Professional training programs designed specifically for Boerboels and large breeds
          </p>
        </div>

        {/* Main Training Programs */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {trainingPrograms.map((program, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl shadow-lg overflow-hidden border ${program.border} hover:shadow-2xl transition`}
            >
              <div className={`${program.color} p-6 border-b ${program.border}`}>
                <div className="text-5xl mb-3">{program.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{program.title}</h2>
                <p className="text-gray-600">{program.description}</p>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-3xl font-bold text-green-600">{program.price}</span>
                  <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">{program.duration}</span>
                </div>
                
                <h3 className="font-bold mb-3">What's included:</h3>
                <ul className="space-y-2 mb-6">
                  {program.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-600">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, I'm interested in the ${program.title} program. Please provide more information.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-black text-white text-center py-3 rounded-lg font-bold hover:bg-gray-800 transition"
                >
                  Enquire About {program.title}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Virtual Training Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Virtual Training Programs</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
            Professional training from the comfort of your home via video calls
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {virtualTraining.map((program, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition`}>
                <div className={`${program.color} p-4 text-center border-b`}>
                  <div className="text-4xl mb-2">{program.icon}</div>
                  <h3 className="text-xl font-bold">{program.level}</h3>
                </div>
                <div className="p-5">
                  <p className="text-2xl font-bold text-green-600 text-center mb-2">{program.price}</p>
                  <p className="text-sm text-gray-500 text-center mb-3">{program.duration}</p>
                  <p className="text-gray-600 text-sm text-center mb-4">{program.description}</p>
                  <Link
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, I'm interested in the ${program.level} Virtual Training program.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-black text-white text-center py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
                  >
                    Enquire Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trainer Bio - UPDATED WITH IMAGE */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          <div className="grid md:grid-cols-3">
            <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 p-8 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/50 shadow-xl">
                <Image
                  src="/obinna nwosu.jpeg"
                  alt="Mr. Ezenwa Christian - Dog Trainer"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:col-span-2 p-8">
              <h2 className="text-2xl font-bold mb-2">Meet Your Trainer</h2>
              <h3 className="text-xl font-bold text-blue-600 mb-3">Mr. Ezenwa Christian</h3>
              <p className="text-yellow-600 font-medium mb-4">Certified Dog Trainer • 10+ years experience</p>
              <p className="text-gray-600 mb-4">
                Specializing in Boerboels and large breed training with a proven track record of transforming 
                dogs into well-behaved companions. Using positive reinforcement techniques tailored to each 
                dog's unique personality and needs.
              </p>
              <div className="flex gap-4">
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition text-sm"
                >
                  Chat on WhatsApp
                </a>
                <a 
                  href={`mailto:${EMAIL}`}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition text-sm"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Training?</h2>
          <p className="mb-6 opacity-90">
            Contact us today to discuss your dog's training needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-full font-bold hover:bg-green-600 transition shadow-lg"
            >
              📱 WhatsApp: +234 817 739 1928
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg"
            >
              ✉️ dsire.boerboels@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}