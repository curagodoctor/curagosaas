'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Your record now lives inside the combined Journey & record page (Record tab).
// This route redirects there so old links keep working.
function RecordRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const packId = params.get('pack');
  useEffect(() => {
    const q = packId ? `?pack=${packId}&view=record` : '?view=record';
    router.replace(`/app/practice-os/journey${q}`);
  }, [packId, router]);
  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" /></div>;
}

export default function RecordPage() {
  return (
    <Suspense fallback={null}>
      <RecordRedirect />
    </Suspense>
  );
}
