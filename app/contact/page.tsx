// app/contact/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function ContactPage() {
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";
  const EMAIL = "dsireboerboels@gmail.com";
  const PHONE = "+2347019996837";

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're here to answer your questions and help you find your perfect Boerboel companion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Contact Info Cards */}
          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📞</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Phone</h3>
                <p className="text-gray-600 mb-3">Give us a call</p>
                <a href={`tel:${PHONE}`} className="text-blue-600 font-medium hover:underline">
                  {PHONE}
                </a>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="font-bold text-lg mb-2">WhatsApp</h3>
                <p className="text-gray-600 mb-3">Fastest response</p>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 font-medium hover:underline"
                >
                  Chat Now
                </a>
              </div>

              {/* Email Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-gray-600 mb-3">Send us a message</p>
                <a href={`mailto:${EMAIL}`} className="text-purple-600 font-medium hover:underline">
                  {EMAIL}
                </a>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-100">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p className="text-gray-600 mb-3">Visit our kennel</p>
                <p className="text-red-600 font-medium">Abuja, Nigeria</p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">🕒</span> Business Hours
              </h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                *Visits by appointment only
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <form 
  action="https://formsubmit.co/dsireboerboels@gmail.com" 
  method="POST"
  className="space-y-4"
>
  {/* These hidden fields control the email */}
  <input type="hidden" name="_subject" value="New Contact from Dsire Website" />
  <input type="hidden" name="_captcha" value="false" />
  <input type="hidden" name="_next" value="https://dsire-boerboels.vercel.app/contact-success" />
  <input type="hidden" name="_template" value="table" />
  
  {/* Your form fields - names will be the email labels */}
  <div className="grid sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
      <input
        type="text"
        name="First Name"
        required
        className="w-full p-3 border rounded-lg"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
      <input
        type="text"
        name="Last Name"
        required
        className="w-full p-3 border rounded-lg"
      />
    </div>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
    <input
      type="email"
      name="Email"
      required
      className="w-full p-3 border rounded-lg"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
    <input
      type="tel"
      name="Phone"
      className="w-full p-3 border rounded-lg"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
    <select
      name="Subject"
      required
      className="w-full p-3 border rounded-lg"
    >
      <option value="">Select a topic</option>
      <option value="Puppy Inquiry">Puppy Inquiry</option>
      <option value="Stud Service">Stud Service</option>
      <option value="Training Programs">Training Programs</option>
      <option value="Schedule a Visit">Schedule a Visit</option>
      <option value="Other">Other</option>
    </select>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
    <textarea
      name="Message"
      required
      rows={4}
      className="w-full p-3 border rounded-lg"
    />
  </div>

  <button
    type="submit"
    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
  >
    Send Message
  </button>
</form>            <p className="text-xs text-gray-400 text-center mt-4">
              We'll get back to you within 24 hours
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-4">📍 Our Location</h2>
          <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
            {/* Replace with actual Google Map embed */}
            <div className="text-center">
              <p className="text-lg mb-2">Abuja, Nigeria</p>
              <p className="text-sm">Exact address provided upon appointment</p>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                Get Directions
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Have questions? Check our{' '}
            <Link href="/faq" className="text-blue-600 font-medium hover:underline">
              Frequently Asked Questions
            </Link>
          </p>
        </div>
      </div>
    
  );
}