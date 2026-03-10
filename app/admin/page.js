'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page - auth is handled there now
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin text-4xl text-[#096b17] mb-4">&#9696;</div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
