// app/contact/page.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function ContactPage() {
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347019996837";
  const EMAIL = "dsire.boerboels@gmail.com";
  const PHONE = "+2347019996837";
  
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Sanitize input - remove harmful characters
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/[&]/g, 'and') // Replace & with 'and'
      .slice(0, 500); // Limit length
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return emailRegex.test(email);
  };

  // Validate phone number (basic Nigerian format)
  const isValidPhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormStatus({ type: null, message: '' });

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Sanitize all form data
    const firstName = sanitizeInput(formData.get('First Name') as string || '');
    const lastName = sanitizeInput(formData.get('Last Name') as string || '');
    const email = formData.get('Email') as string || '';
    const phone = sanitizeInput(formData.get('Phone') as string || '');
    const subject = sanitizeInput(formData.get('Subject') as string || '');
    const message = sanitizeInput(formData.get('Message') as string || '');

    // Validation
    if (!firstName || firstName.length < 2) {
      setFormStatus({ type: 'error', message: 'Please enter a valid first name (minimum 2 characters)' });
      setSubmitting(false);
      return;
    }

    if (!lastName || lastName.length < 2) {
      setFormStatus({ type: 'error', message: 'Please enter a valid last name (minimum 2 characters)' });
      setSubmitting(false);
      return;
    }

    if (!email || !isValidEmail(email)) {
      setFormStatus({ type: 'error', message: 'Please enter a valid email address' });
      setSubmitting(false);
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setFormStatus({ type: 'error', message: 'Please enter a valid phone number (10-11 digits)' });
      setSubmitting(false);
      return;
    }

    if (!subject) {
      setFormStatus({ type: 'error', message: 'Please select a subject' });
      setSubmitting(false);
      return;
    }

    if (!message || message.length < 10) {
      setFormStatus({ type: 'error', message: 'Please enter a message (minimum 10 characters)' });
      setSubmitting(false);
      return;
    }

    try {
      // Create a new FormData with sanitized values
      const sanitizedFormData = new FormData();
      sanitizedFormData.append('First Name', firstName);
      sanitizedFormData.append('Last Name', lastName);
      sanitizedFormData.append('Email', email.toLowerCase());
      sanitizedFormData.append('Phone', phone.replace(/\D/g, ''));
      sanitizedFormData.append('Subject', subject);
      sanitizedFormData.append('Message', message);
      sanitizedFormData.append('_subject', `New Contact from Dsire Website - ${subject}`);
      sanitizedFormData.append('_captcha', 'false');
      sanitizedFormData.append('_template', 'table');

      const response = await fetch('https://formsubmit.co/dsireboerboels@gmail.com', {
        method: 'POST',
        body: sanitizedFormData,
      });

      if (response.ok) {
        setFormStatus({ type: 'success', message: 'Thank you! Your message has been sent. We\'ll get back to you soon.' });
        form.reset();
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormStatus({ type: 'error', message: 'Unable to send message. Please try again or contact us directly.' });
    } finally {
      setSubmitting(false);
    }
  };

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
                <a 
                  href="https://www.google.com/maps/place/D+Sire+Kennels/@8.9667859,7.3363227,15z/data=!4m6!3m5!1s0x104e73ecba8f3d89:0xbedde5de55a0a2dd!8m2!3d8.9667859!4d7.3363227!16s%2Fg%2F11x953y1l3?entry=ttu&g_ep=EgoyMDI2MDMxMC4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 font-medium hover:underline"
                >
                  Abuja, Nigeria
                </a>
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
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            
            {formStatus.type && (
              <div className={`p-4 rounded-lg mb-6 ${
                formStatus.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {formStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="First Name"
                    required
                    maxLength={50}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="Last Name"
                    required
                    maxLength={50}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="Email"
                  required
                  maxLength={255}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="Phone"
                  maxLength={15}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  name="Subject"
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                  maxLength={1000}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Please provide details about your inquiry..."
                />
                <p className="text-xs text-gray-400 mt-1">Maximum 1000 characters</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            
            <p className="text-xs text-gray-400 text-center mt-4">
              We'll get back to you within 24 hours
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-4">📍 Our Location</h2>
          <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Abuja, Nigeria</p>
              <p className="text-sm">Exact address provided upon appointment</p>
              <a 
                href="https://www.google.com/maps/place/D+Sire+Kennels/@8.9667859,7.3363227,15z/data=!4m6!3m5!1s0x104e73ecba8f3d89:0xbedde5de55a0a2dd!8m2!3d8.9667859!4d7.3363227!16s%2Fg%2F11x953y1l3?entry=ttu&g_ep=EgoyMDI2MDMxMC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Directions
              </a>
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
    </div>
  );
}