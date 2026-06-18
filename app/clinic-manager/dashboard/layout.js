'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ClinicManagerDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/clinic-manager/auth/me');
        if (!res.ok) { router.replace('/clinic-manager/login'); return; }
        const data = await res.json();
        setUser({ ...data.user, doctorName: data.doctor?.name });
      } catch { router.replace('/clinic-manager/login'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const handleLogout = async () => {
    document.cookie = 'clinic_manager_token=; path=/; max-age=0';
    router.push('/clinic-manager/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin text-4xl text-[#096b17]">&#9696;</div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (path) => pathname === path;
  const isActivePrefix = (path) => pathname?.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">Clinic Manager</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-[45] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 bottom-0 h-full bg-white shadow-lg z-[46] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64`}>
        <div className="p-4 border-b flex items-center gap-2">
          <div className="w-8 h-8 bg-[#096b17] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Clinic Manager</span>
        </div>

        <div className="p-4 border-b bg-[#096b17]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#096b17] flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.doctorName || 'Clinic Manager'}</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <Link href="/clinic-manager/dashboard/contacts"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive('/clinic-manager/dashboard/contacts') || isActivePrefix('/clinic-manager/dashboard/contacts') ? 'bg-[#096b17]/10 text-[#096b17] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Contacts</span>
          </Link>

          <Link href="/clinic-manager/dashboard/workflows"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isActive('/clinic-manager/dashboard/workflows') || isActivePrefix('/clinic-manager/dashboard/workflows') ? 'bg-[#096b17]/10 text-[#096b17] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Workflows</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="pt-16 lg:pt-0 lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
