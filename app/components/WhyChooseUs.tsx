// components/WhyChooseUs.tsx
export default function WhyChooseUs() {
  const features = [
    {
      icon: "🧬",
      title: "Champion Bloodlines",
      description: "All our breeding stock are from proven champion lines with excellent health clearances."
    },
    {
      icon: "🏥",
      title: "Health Guaranteed",
      description: "Every puppy comes with full vaccination records, health certificate, and 1-year genetic health guarantee."
    },
    {
      icon: "💝",
      title: "Ethical Breeding",
      description: "We prioritize health, temperament, and conformation over quantity. No puppy mills here."
    },
    {
      icon: "📞",
      title: "Lifetime Support",
      description: "We're here for you long after you take your puppy home. Training advice, health questions, anything."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-yellow-600 font-semibold tracking-wider text-sm">WHY DSIRE</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2">Why Choose Us</h2>
          <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
            We don't just breed dogs - we raise family members with love, care, and expertise
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="text-center p-6 rounded-xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}