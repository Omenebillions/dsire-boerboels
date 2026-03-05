    // app/privacy-policy/page.tsx
    import { Metadata } from 'next';
    import Link from 'next/link';

    export const metadata: Metadata = {
      title: 'Privacy Policy - dsire-boerboels',
      description: 'Privacy Policy for dsire-boerboels website and services.',
    };

    export default function PrivacyPolicyPage() {
      return (
        <div className="max-w-4xl mx-auto p-8 my-10 bg-white shadow-lg rounded-lg">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
          <p className="text-gray-700 mb-4">
            This Privacy Policy describes how Dsire Boerboels collects, uses, and discloses your personal information when you use our website and services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">1. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            We collect personal information you voluntarily provide to us when you express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us. The personal information that we collect depends on the context of your interactions with us and the website, the choices you make, and the products and features you use.
          </p>
          <p className="text-gray-700 mb-4">
            For our Instagram integration, we collect your Facebook User ID, Instagram Business Account ID, and an access token to display your Instagram feed on our website. This data is stored securely in our database.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <p className="text-gray-700 mb-4">
            Specifically, we use the Instagram data collected to display your Instagram feed on our website, ensuring you can showcase your Boerboels effectively.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">3. Disclosure of Your Information</h2>
          <p className="text-gray-700 mb-4">
            We do not share or sell your personal information with third parties except as necessary to provide our services, comply with law, or protect our rights. Your Instagram access token and account IDs are not shared with any third party outside of our immediate service providers.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">4. Your Privacy Rights</h2>
          <p className="text-gray-700 mb-4">
            You have certain rights regarding your personal information, including the right to access, correct, or delete your data. To exercise these rights, please contact us at [Your Contact Email].
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">5. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this privacy policy from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">6. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions or comments about this policy, you may email us at [Your Contact Email] or by post to: [Your Address, if applicable].
          </p>
          <p className="text-gray-700 mb-4 mt-8 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
          </p>
        </div>
      );
    }