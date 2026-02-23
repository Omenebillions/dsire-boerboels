export default function GalleryPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">Gallery</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <img
            key={i}
            src={`/gallery${i}.jpg`}
            className="rounded shadow"
          />
        ))}
      </div>
    </div>
  );
}