export default function TestimonialsPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">Testimonials</h1>

      <div className="space-y-6">
        <div className="shadow p-4 rounded">
          <p>"Strong puppy, arrived healthy and active."</p>
          <p className="text-sm text-gray-500 mt-2">— Lagos Customer</p>
        </div>

        <div className="shadow p-4 rounded">
          <p>"Best breeder experience I’ve had. Highly recommended."</p>
          <p className="text-sm text-gray-500 mt-2">— Abuja Customer</p>
        </div>
      </div>
    </div>
  );
}