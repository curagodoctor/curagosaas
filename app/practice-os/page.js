'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Practice OS — doctor-facing entry (scaffold).
 *
 * Access model: authenticated doctors only. The full execution experience
 * (today's mission, education, AI assistant, evidence, progress, timeline) is
 * built in Week 2 on top of this route and the UserMissionProgress model.
 */
export default function PracticeOSHome() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        setDoctor(data.doctor);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#096b17]" />
      </div>
    );
  }
  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-[#096b17]/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {doctor.displayName || doctor.name}
        </h1>
        <p className="text-gray-600 mb-8">
          Your practice-building journey — one guided mission every day.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-gray-500">
          Your first mission is being prepared. Today&apos;s Mission, your progress, streak,
          and achievements will appear here.
        </div>
      </div>
    </div>
  );
}
