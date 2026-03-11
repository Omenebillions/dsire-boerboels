// app/contact-success/page.tsx
import Link from 'next/link';

export default function ContactSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Message Sent!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}