export default function ContactPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>

      <p className="text-gray-600 mb-4">We respond within minutes.</p>

      <div className="space-y-3">
        <p>📞 Phone: +234 800 000 0000</p>
        <p>💬 WhatsApp: <a className="text-blue-600" href="https://wa.me/2348000000000">Chat Now</a></p>
        <p>📧 Email: dsireboerboels@gmail.com</p>
        <p>📍 Location: Nigeria</p>
      </div>
    </div>
  );
}