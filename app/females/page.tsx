export default function FemalesPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">Females</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shadow p-4 rounded">
            <img src={`/female${i}.jpg`} className="rounded mb-2" />
            <h3 className="font-bold">Female {i}</h3>
            <p className="text-gray-500">Next Heat: April 2026</p>
          </div>
        ))}
      </div>
    </div>
  );
}