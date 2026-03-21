// app/shipping/page.tsx
import Link from 'next/link';

export default function ShippingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[50vh] w-full overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50"></div>
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <span className="inline-block bg-yellow-500 text-black text-sm font-semibold px-4 py-2 rounded-full mb-6 w-fit">
            🚚 Safe & Reliable
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white max-w-4xl leading-tight">
            Shipping & Delivery
            <span className="block text-yellow-400">Bringing Your Puppy Home Safely</span>
          </h1>
          <p className="text-xl text-gray-200 mt-6 max-w-2xl">
            Worldwide shipping with professional care. We handle everything so your new family member arrives safely.
          </p>
        </div>
      </section>

      {/* Local Delivery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-600 font-semibold tracking-wider text-sm">LOCAL DELIVERY</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Delivery Within Nigeria</h2>
            <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
              Safe, secure road transport to anywhere in Nigeria
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18L12 22M12 22L16 18M12 22V2M3 6H21M5 6L5 16C5 17.1046 5.89543 18 7 18H17C18.1046 18 19 17.1046 19 16V6" />
                  </svg>
                  <span className="text-2xl md:text-3xl font-bold text-black">Abuja & Nationwide</span>
                </div>
                <p className="text-4xl md:text-5xl font-bold text-yellow-600 mb-4">₦300,000</p>
                <p className="text-gray-600 mb-4 max-w-md">
                  Professional road transport with secure crate, pre-departure health check, and direct door-to-door delivery.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Custom travel crate included
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pre-departure vet health check
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Door-to-door delivery
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Real-time tracking updates
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-500 text-black px-6 py-4 rounded-xl text-center min-w-[180px]">
                <p className="text-sm font-semibold">Starting from</p>
                <p className="text-3xl font-bold">₦300,000</p>
                <p className="text-xs mt-1">varies by location</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
              📍 For deliveries outside Abuja or to remote locations, contact us for an exact quote.
            </p>
          </div>
        </div>
      </section>

      {/* International Shipping Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-600 font-semibold tracking-wider text-sm">WORLDWIDE SHIPPING</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">International Delivery</h2>
            <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
              Estimated flight costs to countries we ship to most frequently
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-500 text-black">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Destination</th>
                    <th className="px-6 py-4 text-left font-semibold">Minimum Age</th>
                    <th className="px-6 py-4 text-left font-semibold">Estimated Cost (GBP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { country: "USA", age: "6 Months", cost: "£2,500" },
                    { country: "Canada", age: "12 Weeks", cost: "£1,800" },
                    { country: "South America", age: "12 Weeks", cost: "£1,800" },
                    { country: "Europe", age: "15 Weeks", cost: "£1,500" },
                    { country: "Middle East", age: "15 Weeks", cost: "£1,700" },
                    { country: "Far East", age: "15 Weeks", cost: "£1,800" },
                    { country: "Australia", age: "10 Months", cost: "£2,500" },
                    { country: "Norway", age: "15 Weeks", cost: "£1,500" },
                    { country: "Sweden", age: "15 Weeks", cost: "£1,500" },
                    { country: "India", age: "15 Weeks", cost: "£1,800" },
                    { country: "Caribbean", age: "15+ Weeks", cost: "£2,400" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.country}</td>
                      <td className="px-6 py-4 text-gray-600">{row.age}</td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
            <p className="text-gray-700">
              <strong className="text-yellow-800">Important Note:</strong> These are estimated flight costs only. Final prices vary by season and flight availability. 
              <strong>No markup is added</strong> — what we're charged is what you pay. Preparation for export costs are additional (see packages below).
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">We can also arrange road travel for EU countries and UK delivery. Contact us for a personalized quote.</p>
          </div>
        </div>
      </section>

      {/* Preparation Packages Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-yellow-600 font-semibold tracking-wider text-sm">PREPARATION SERVICES</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Export Preparation Packages</h2>
            <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
              Everything needed to get your puppy ready for international travel
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* USA Package */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">USA Package</h3>
                <span className="bg-yellow-500 text-black px-4 py-1 rounded-full font-bold text-lg">£2,099</span>
              </div>
              <p className="text-gray-600 mb-6">Complete preparation for puppies traveling to the USA (up to 6 months)</p>
              <ul className="space-y-3">
                {[
                  "2nd Vaccinations and Vet Health Examination",
                  "Rabies Vaccination and Vet Health Examination",
                  "Additional Worming Treatment x 4",
                  "Additional Kenneling from 8 weeks to 6 months",
                  "Fit to Fly Vet Health Check",
                  "Admin and Travel Costs",
                  "Delivery to Airport"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* EU Package */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">EU Package</h3>
                <span className="bg-yellow-500 text-black px-4 py-1 rounded-full font-bold text-lg">£1,349</span>
              </div>
              <p className="text-gray-600 mb-6">Complete preparation for puppies traveling to the EU (up to 16 weeks)</p>
              <ul className="space-y-3">
                {[
                  "2nd Vaccinations and Vet Health Examination",
                  "Rabies Vaccination and Vet Health Examination",
                  "Additional Worming Treatment x 2",
                  "Additional Kenneling from 8 - 16 weeks",
                  "EU Export Certificate",
                  "Fit to Fly Vet Health Check",
                  "Admin and Travel Costs",
                  "Delivery to Airport"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-700">
              <strong>Note:</strong> Puppies cannot be shipped until a minimum age of 12 weeks. For USA, minimum age is 6 months (since August 2024).<br />
              Additional kenneling: £12/day for export waiting, £20/day for other needs.
            </p>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Pickup Options</h3>
              <p className="text-gray-600">
                Clients can collect their new family members directly from us and travel with them after we've completed the export preparation. We're happy to coordinate pickup arrangements.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Get a Custom Quote</h3>
              <p className="text-gray-600 mb-4">
                Need shipping to a country not listed? Want an exact price for your location? Contact us and we'll get a quote from our shipping partners.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="mailto:info@dsirekennel.com" 
                  className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Us
                </a>
                <a 
                  href="https://wa.me/2347019996837" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771z"/>
                  </svg>
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Welcome Your Puppy Home?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Contact us to arrange shipping or to get a personalized quote for your location.
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
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771z"/>
              </svg>
              WhatsApp Chat
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}