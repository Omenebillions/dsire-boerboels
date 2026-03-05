// app/terms-of-service/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - dsire-boerboels',
  description: 'Terms of Service for dsire-boerboels website and services.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto p-8 my-10 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">Terms of Service</h1>
      <p className="text-gray-700 mb-4">
        Welcome to dsire-boerboels! These Terms of Service ("Terms") govern your use of our website located at https://dsire-boerboels.vercel.app/ (the "Site") and any related services provided by Dsire Boerboels.
      </p>
      <p className="text-gray-700 mb-4">
        By accessing or using the Site, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">1. Use of the Site</h2>
      <p className="text-gray-700 mb-4">
        You agree to use the Site only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the Site. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our Site.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">2. Intellectual Property</h2>
      <p className="text-gray-700 mb-4">
        The content on the Site, including but not limited to text, graphics, images, photographs, videos, and logos, is the property of Dsire Boerboels and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Site, except as generally permitted by law for personal, non-commercial use.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">3. Disclaimers</h2>
      <p className="text-gray-700 mb-4">
        The information on this Site is for general informational purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the Site or the information, products, services, or related graphics contained on the Site for any purpose.
      </p>
      <p className="text-gray-700 mb-4">
        Our services relating to the sale of puppies are subject to separate contractual agreements.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">4. Limitation of Liability</h2>
      <p className="text-gray-700 mb-4">
        In no event will Dsire Boerboels be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this Site.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">5. Changes to Terms</h2>
      <p className="text-gray-700 mb-4">
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice before any new terms take effect. By continuing to access or use our Site after those revisions become effective, you agree to be bound by the revised terms.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">6. Governing Law</h2>
      <p className="text-gray-700 mb-4">
        These Terms shall be governed and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">7. Contact Us</h2>
      <p className="text-gray-700 mb-4">
        If you have any questions about these Terms, please contact us at dsireboerboels@gmail.com].
      </p>
      <p className="text-gray-700 mb-4 mt-8 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </p>
    </div>
  );
}