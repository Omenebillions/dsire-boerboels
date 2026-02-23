export default function PuppiesPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">Puppies for Sale</h1>
      <p className="text-gray-600 mb-8">View all available puppies.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="shadow p-4 rounded">
            <img src={`/pup${i}.jpg`} className="rounded mb-2" />
            <h3 className="font-bold">Puppy {i}</h3>
            <p className="text-gray-500">Age: 8 Weeks</p>
            <p className="text-green-600">Available</p>

            <button className="mt-3 w-full bg-black text-white py-2 rounded">
              Reserve Puppy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}