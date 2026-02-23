export default function StudsPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">Stud Males</h1>
      <p className="text-gray-600 mb-8">Champion bloodlines available for breeding.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shadow p-4 rounded">
            <img src={`/stud${i}.jpg`} className="rounded mb-2" />
            <h3 className="font-bold">Stud Male {i}</h3>
            <p className="text-gray-500">Weight: 65kg • Height: 70cm</p>
            <button className="mt-3 w-full bg-black text-white py-2 rounded">
              Book Mating
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}