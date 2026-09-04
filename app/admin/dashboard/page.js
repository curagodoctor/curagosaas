'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState({
    bookingPages: 0,
    websiteViews: 0,
  });
  const [loading, setLoading] = useState(true);

  // Website-address (subdomain) editor — domain setup lives here now, not at signup.
  const [editDomain, setEditDomain] = useState(false);
  const [subInput, setSubInput] = useState('');
  const [subAvail, setSubAvail] = useState(null);   // 'checking' | 'available' | 'taken' | 'invalid'
  const [subMsg, setSubMsg] = useState('');
  const [subSaving, setSubSaving] = useState(false);

  const refreshDoctor = async () => {
    try {
      const r = await fetch('/api/auth/me');
      if (r.ok) { const d = await r.json(); setDoctor(d.doctor); }
    } catch { /* ignore */ }
  };

  // Favicon (browser-tab icon) for the doctor's published site.
  const [faviconBusy, setFaviconBusy] = useState(false);
  const uploadFavicon = async (file) => {
    if (!file) return;
    setFaviconBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', 'favicons');
      const up = await fetch('/api/admin/upload-image', { method: 'POST', body: fd, credentials: 'include' });
      const ud = await up.json();
      if (!ud.success || !ud.url) throw new Error(ud.error || 'Upload failed');
      const res = await fetch('/api/doctor/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ favicon: ud.url }),
      });
      const rd = await res.json();
      if (rd.error) throw new Error(rd.error);
      setDoctor((d) => ({ ...d, favicon: ud.url }));
    } catch (e) { alert(e.message || 'Could not update the favicon.'); }
    finally { setFaviconBusy(false); }
  };
  const removeFavicon = async () => {
    setFaviconBusy(true);
    try {
      await fetch('/api/doctor/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ favicon: '' }),
      });
      setDoctor((d) => ({ ...d, favicon: '' }));
    } finally { setFaviconBusy(false); }
  };

  // AI: generate website content from the doctor's profile and publish it.
  const [genBusy, setGenBusy] = useState(false);
  const [genResult, setGenResult] = useState(null); // { url, hasAddress } | { error }
  const generateSite = async (force = false) => {
    setGenBusy(true); setGenResult(null);
    try {
      const res = await fetch('/api/practice-os/actions/generate-site', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const d = await res.json();
      if (d.skipped && d.reason === 'customized') {
        // Don't silently overwrite the doctor's own edits — ask first.
        const ok = window.confirm("You've made your own changes to this website. Generating a fresh AI draft won't overwrite your live site — you'll review and approve it. Continue?");
        if (ok) { setGenBusy(false); return generateSite(true); }
        setGenResult(null);
      } else if (d.success) {
        // mode 'live' = published now; mode 'draft' = saved as a draft to approve.
        setGenResult({ mode: d.mode, url: d.url, hasAddress: d.hasAddress });
      } else {
        const friendly = d.error === 'PaymentRequired'
          ? 'The AI website builder is a paid feature — you need an active Builder Pack.'
          : d.error === 'NoCredits'
            ? (d.message || "You've used all of today's AI credits. They reset tomorrow.")
            : (d.error || 'Could not generate your website.');
        setGenResult({ error: friendly });
      }
    } catch { setGenResult({ error: 'Something went wrong.' }); }
    finally { setGenBusy(false); }
  };

  useEffect(() => {
    if (!editDomain) return;
    const v = subInput.trim().toLowerCase();
    if (!v) { setSubAvail(null); setSubMsg(''); return; }
    if (!/^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/.test(v)) { setSubAvail('invalid'); setSubMsg('3–30 chars: lowercase letters, numbers, hyphens.'); return; }
    setSubAvail('checking'); setSubMsg('Checking…');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-subdomain?subdomain=${encodeURIComponent(v)}`);
        const d = await res.json();
        if (d.available) { setSubAvail('available'); setSubMsg(`${v}.curago.in is available`); }
        else { setSubAvail('taken'); setSubMsg(d.reason || d.message || 'That address is taken.'); }
      } catch { setSubAvail(null); setSubMsg(''); }
    }, 400);
    return () => clearTimeout(t);
  }, [subInput, editDomain]);

  const saveSubdomain = async () => {
    const v = subInput.trim().toLowerCase();
    if (!v || subAvail !== 'available') return;
    setSubSaving(true);
    try {
      // PUT changes an existing address; POST claims a first one.
      const method = doctor?.subdomain ? 'PUT' : 'POST';
      const res = await fetch('/api/doctor/subdomain', {
        method, headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ subdomain: v }),
      });
      const d = await res.json();
      if (d.success) { await refreshDoctor(); setEditDomain(false); setSubInput(''); }
      else { setSubMsg(d.error || 'Could not save. Try another address.'); setSubAvail('taken'); }
    } catch { setSubMsg('Something went wrong.'); }
    finally { setSubSaving(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctor info
        const doctorRes = await fetch('/api/auth/me');
        if (doctorRes.ok) {
          const doctorData = await doctorRes.json();
          setDoctor(doctorData.doctor);
        }

        // Fetch website stats
        const pagesRes = await fetch('/api/admin/booking-pages?limit=1');
        const pagesData = pagesRes.ok ? await pagesRes.json() : { pagination: { total: 0 } };

        setStats({
          bookingPages: pagesData.pagination?.total || 0,
          websiteViews: pagesData.pages?.[0]?.views || 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate onboarding progress
  const getOnboardingSteps = () => {
    if (!doctor) return [];

    return [
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Add your specialization, qualification, and bio',
        completed: !!(doctor.displayName && doctor.specialization),
        href: '/admin/dashboard/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        id: 'whatsapp',
        title: 'Set Up WhatsApp',
        description: 'Add your WhatsApp number for patient communication',
        completed: !!doctor.whatsappNumber,
        href: '/admin/dashboard/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        id: 'website',
        title: 'Customize Your Website',
        description: 'Set up your clinic website sections',
        completed: stats.bookingPages > 0,
        href: '/admin/dashboard/pages',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        ),
      },
    ];
  };

  const onboardingSteps = getOnboardingSteps();
  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = onboardingSteps.length > 0 ? (completedSteps / onboardingSteps.length) * 100 : 0;

  const liveWebsiteUrl = doctor?.customDomain
    ? `https://${doctor.customDomain}`
    : doctor?.subdomain ? `https://${doctor.subdomain}.curago.in` : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#096b17]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {doctor?.displayName || doctor?.name}!
            </h1>
            <p className="mt-1 text-gray-500">
              Here&apos;s what&apos;s happening with your clinic today.
            </p>
          </div>
          {doctor?.profileImage ? (
            <img
              src={doctor.profileImage}
              alt={doctor.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#096b17]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#096b17]/10 flex items-center justify-center">
              <span className="text-2xl font-semibold text-[#096b17]">
                {doctor?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Website Card */}
      <div className="bg-[#096b17] rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                <span className="w-2 h-2 rounded-full bg-green-300 mr-1.5 animate-pulse"></span>
                Live
              </span>
            </div>
            <h2 className="text-lg font-semibold mb-1">Your Live Website</h2>
            {editDomain ? (
              <div className="mt-1">
                <div className="flex items-stretch max-w-sm">
                  <input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && subAvail === 'available') saveSubdomain(); }}
                    autoFocus maxLength={30}
                    placeholder="yourname"
                    className="flex-1 min-w-0 px-3 py-2 rounded-l-lg text-gray-900 outline-none"
                  />
                  <span className="px-3 flex items-center bg-white/20 text-white rounded-r-lg text-sm whitespace-nowrap">.curago.in</span>
                </div>
                {subMsg && <p className={`text-xs mt-1.5 ${subAvail === 'available' ? 'text-green-200' : 'text-white/80'}`}>{subMsg}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={saveSubdomain} disabled={subAvail !== 'available' || subSaving} className="px-3 py-1.5 rounded-lg bg-white text-[#096b17] text-sm font-semibold disabled:opacity-50">{subSaving ? 'Saving…' : 'Save address'}</button>
                  <button onClick={() => { setEditDomain(false); setSubInput(''); setSubMsg(''); setSubAvail(null); }} className="px-3 py-1.5 rounded-lg text-white/80 text-sm hover:text-white">Cancel</button>
                </div>
              </div>
            ) : liveWebsiteUrl ? (
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={liveWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white underline underline-offset-2 flex items-center gap-1"
                >
                  {liveWebsiteUrl}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {!doctor?.customDomain && (
                  <button onClick={() => { setEditDomain(true); setSubInput(doctor?.subdomain || ''); }} className="text-white/70 hover:text-white text-sm underline underline-offset-2">Edit address</button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-white/70">No website address yet.</p>
                <button onClick={() => { setEditDomain(true); setSubInput(''); }} className="px-3 py-1.5 rounded-lg bg-white text-[#096b17] text-sm font-semibold">Set up address</button>
              </div>
            )}

            {/* Favicon — the browser-tab icon for this site */}
            <div className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-white/15 border border-white/20 grid place-items-center overflow-hidden shrink-0">
                {doctor?.favicon
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={doctor.favicon} alt="favicon" className="w-full h-full object-contain" />
                  : <span className="text-white/50 text-[10px]">icon</span>}
              </div>
              <span className="text-white/70 text-sm">Tab icon</span>
              <label className="text-white/90 hover:text-white text-sm underline underline-offset-2 cursor-pointer">
                {faviconBusy ? 'Uploading…' : (doctor?.favicon ? 'Change' : 'Upload favicon')}
                <input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => uploadFavicon(e.target.files?.[0])} disabled={faviconBusy} />
              </label>
              {doctor?.favicon && !faviconBusy && (
                <button onClick={removeFavicon} className="text-white/60 hover:text-white text-sm">Remove</button>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={liveWebsiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                liveWebsiteUrl
                  ? 'bg-white text-[#096b17] hover:bg-gray-100'
                  : 'bg-white/30 text-white/70 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Site
            </a>
            <Link
              href="/admin/dashboard/pages"
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Website
            </Link>
          </div>
        </div>
      </div>

      {/* AI: generate website content instantly */}
      <div className="bg-gradient-to-br from-[#096b17] to-[#053d0b] rounded-xl shadow-sm p-6 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">✨ Generate your website with AI</h2>
          <p className="text-white/85 text-sm max-w-xl">Write your homepage from your profile — about, services and FAQs — and publish it in one click.</p>
        </div>
        <Link href="/admin/dashboard/ai-generate/questions" className="bg-white text-[#096b17] font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100">
          Generate my website
        </Link>
      </div>

      {/* Generate-site result popup */}
      {genResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setGenResult(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            {genResult.error ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Couldn&apos;t generate</h3>
                <p className="text-sm text-gray-500 mt-1">{genResult.error}</p>
                <button onClick={() => setGenResult(null)} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">Close</button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-[#096b17]/10">
                  <svg className="w-6 h-6 text-[#096b17]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
                </div>
                {genResult.mode === 'draft' ? (
                  <>
                    {/* A homepage already existed — we saved a draft, live site unchanged. */}
                    <h3 className="text-lg font-semibold text-gray-900">Draft ready to review</h3>
                    <p className="text-sm text-gray-500 mt-1">Your live website is unchanged. We wrote a fresh AI version as a <strong>draft</strong> — review and approve it to publish.</p>
                    <Link href="/admin/dashboard/ai-generate" onClick={() => setGenResult(null)} className="inline-block mt-4 px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-semibold">Review &amp; approve →</Link>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">Your website is ready 🎉</h3>
                    {genResult.hasAddress ? (
                      <>
                        <p className="text-sm text-gray-500 mt-1">Your homepage has been written and published.</p>
                        <a href={genResult.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-semibold">View my live site →</a>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500 mt-1">Your homepage content is written and published. Set a website address in <strong>Your Live Website</strong> above to make it reachable.</p>
                        <button onClick={() => { setGenResult(null); setEditDomain(true); setSubInput(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-block mt-4 px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-semibold">Set my address</button>
                      </>
                    )}
                  </>
                )}
                <button onClick={() => setGenResult(null)} className="block mx-auto mt-3 text-gray-400 text-sm">Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Website Creation Pathways */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Your Website</h2>
        <p className="text-sm text-gray-500 mb-6">Choose how you want to build your clinic website</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DIY - First */}
          <div className="border-2 border-[#096b17] rounded-xl p-5 relative">
            <span className="absolute -top-3 left-4 bg-[#096b17] text-white text-xs font-medium px-3 py-1 rounded-full">
              Start Here
            </span>
            <div className="w-10 h-10 rounded-lg bg-[#096b17]/10 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#096b17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Do It Yourself</h3>
            <p className="text-2xl font-bold text-[#096b17] mb-2">Free</p>
            <p className="text-sm text-gray-600 mb-4">
              Use our drag-and-drop Website Builder to create your clinic website yourself.
            </p>
            <Link
              href="/admin/dashboard/pages"
              className="block w-full text-center bg-[#096b17] text-white py-2.5 rounded-lg font-medium hover:bg-[#075110] transition-colors"
            >
              Open Website Builder
            </Link>
          </div>

          {/* Done For You */}
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Done For You</h3>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              &#x20B9;2,000 <span className="text-xs font-normal text-gray-500">incl. GST</span>
            </p>
            <ul className="text-sm text-gray-600 space-y-1.5 mb-4">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1-time full website setup
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Includes 2 free changes
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                3-5 working days turnaround
              </li>
            </ul>
            <p className="text-xs text-gray-400 mb-3">Terms and conditions apply</p>
            <a
              href="mailto:support@curago.in?subject=Done For You Website Setup"
              className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Reach Out to Us
            </a>
          </div>

          {/* AI-Powered */}
          <div className="border border-gray-200 rounded-xl p-5 opacity-60 relative">
            <span className="absolute top-3 right-3 bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">AI-Powered</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use AI to auto-generate your clinic website. Fill a quick form, upload docs, and get a professional site instantly.
            </p>
            <button
              disabled
              className="block w-full text-center bg-gray-200 text-gray-500 py-2.5 rounded-lg font-medium cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.bookingPages > 0 ? 'Active' : 'Not Set'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Website Views</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.websiteViews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Steps */}
      {progressPercent < 100 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Complete Your Setup</h2>
              <p className="text-sm text-gray-500">
                {completedSteps} of {onboardingSteps.length} steps completed
              </p>
            </div>
            <span className="text-sm font-medium text-[#096b17]">{Math.round(progressPercent)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-[#096b17] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {onboardingSteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  step.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/dashboard/contacts"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Contacts</span>
          </Link>

          <Link
            href="/admin/dashboard/pages"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Edit Website</span>
          </Link>

          <Link
            href="/admin/dashboard/blog-articles"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Blog Articles</span>
          </Link>

          <Link
            href="/admin/dashboard/settings"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#096b17] hover:bg-[#096b17]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
