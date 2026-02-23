// src/app/admin/page.tsx
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // This automatically redirects to your MatthOrg subdomain
  redirect('https://dsireboerboels.matthorg.com');
  
  // This return is never reached but needed for TypeScript
  return null;
}

// Optional: Add metadata for the redirect page
export const metadata = {
  title: 'Redirecting to Admin Dashboard...',
  description: 'You are being redirected to the Dsire Boerboels admin dashboard',
};