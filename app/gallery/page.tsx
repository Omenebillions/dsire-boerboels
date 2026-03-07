// app/gallery/page.tsx
import { redirect } from 'next/navigation';

export default function GalleryPage() {
  redirect('/#instagram-feed'); // Redirects to the homepage's Instagram section
}