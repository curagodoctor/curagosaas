'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClinicManagerDashboardPage() {
  const router = useRouter();
  // Redirect to contacts by default
  useEffect(() => {
    router.replace('/clinic-manager/dashboard/contacts');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17]"></div>
    </div>
  );
}
