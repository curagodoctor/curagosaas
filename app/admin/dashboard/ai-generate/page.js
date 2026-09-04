'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BlogChat from '@/components/admin/BlogChat';

// AI Website Builder — the paid AI surface. Generate the homepage (live first
// time, draft + approve afterwards), draft blogs for review, and see homepage
// version history. All actions draw from the shared daily AI credit pool.
export default function AIGeneratePage() {
  const router = useRouter();
  const [credits, setCredits] = useState(null); // { access, remaining }
  const [home, setHome] = useState(null);        // site-draft GET result
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);          // { type:'ok'|'err', text }
  const [blogCtx, setBlogCtx] = useState('');

  const loadCredits = useCallback(async () => {
    try { const r = await fetch('/api/practice-os/actions/credits', { credentials: 'include' }); setCredits(await r.json()); }
    catch { setCredits({ access: false, remaining: 0 }); }
  }, []);
  const loadHome = useCallback(async () => {
    try { const r = await fetch('/api/practice-os/actions/site-draft', { credentials: 'include' }); setHome(await r.json()); }
    catch { /* ignore */ }
  }, []);
  useEffect(() => { loadCredits(); loadHome(); }, [loadCredits, loadHome]);

  const noCredits = credits && credits.access && credits.remaining <= 0;
  const locked = credits && !credits.access;

  const flash = (type, text) => setMsg({ type, text });

  const generateHome = async (force = false) => {
    setBusy('home'); setMsg(null);
    try {
      const res = await fetch('/api/practice-os/actions/generate-site', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ force }),
      });
      const d = await res.json();
      if (d.skipped && d.reason === 'customized') {
        if (window.confirm("Your website has your own changes. Generate a fresh AI draft anyway (your current version is saved to history)?")) { setBusy(''); return generateHome(true); }
      } else if (d.success) {
        flash('ok', d.mode === 'live' ? 'Your homepage was generated and is live.' : 'A homepage draft is ready — review and approve it below.');
        if (typeof d.creditsRemaining === 'number') setCredits((c) => ({ ...c, remaining: d.creditsRemaining }));
        await loadHome();
      } else {
        flash('err', d.message || d.error || 'Could not generate the homepage.');
      }
    } catch { flash('err', 'Something went wrong.'); }
    finally { setBusy(''); }
  };

  const draftAction = async (action, index) => {
    setBusy(`draft:${action}`); setMsg(null);
    try {
      const res = await fetch('/api/practice-os/actions/site-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action, index }),
      });
      const d = await res.json();
      if (d.success) { flash('ok', action === 'approve' ? 'Draft approved — your homepage is updated.' : action === 'restore' ? 'Previous version restored.' : 'Draft discarded.'); await loadHome(); }
      else flash('err', d.error || 'Could not update the page.');
    } catch { flash('err', 'Something went wrong.'); }
    finally { setBusy(''); }
  };

  const draftBlog = async () => {
    if (!blogCtx.trim()) return;
    setBusy('blog'); setMsg(null);
    try {
      const res = await fetch('/api/practice-os/actions/draft-blog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ context: blogCtx.trim() }),
      });
      const d = await res.json();
      if (d.success && d.id) router.push(`/admin/dashboard/blog-articles/${d.id}`);
      else flash('err', d.message || d.error || 'Could not draft the article.');
    } catch { flash('err', 'Something went wrong.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✨ AI Website Builder</h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate and edit your website and blog with AI.</p>
        </div>
        {credits?.access && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[#096b17] leading-none">{credits.remaining}</div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wide">credits left today</div>
          </div>
        )}
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
      )}

      {locked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-900 font-medium">The AI Website Builder is a paid feature.</p>
          <p className="text-amber-800 text-sm mt-1">Get a Builder Pack to unlock AI website + blog generation (30 AI credits/day).</p>
          <a href="/app/zero-to-practice-builder" className="inline-block mt-3 px-5 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium">See Builder Packs →</a>
        </div>
      )}

      {credits?.access && (
        <>
          {noCredits && <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">You&apos;ve used all of today&apos;s AI credits. They reset tomorrow.</div>}

          {/* Homepage generation */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900">Homepage</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-3">
              {home?.exists ? 'Regenerate a fresh AI homepage as a draft — your live page stays up until you approve it.' : 'Generate your homepage from your profile and publish it instantly.'}
            </p>
            <button onClick={() => router.push('/admin/dashboard/ai-generate/questions')} disabled={noCredits} className="px-5 py-2.5 bg-[#096b17] text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {home?.exists ? 'Generate new draft' : 'Generate my homepage'}
            </button>

            {/* Pending draft */}
            {home?.hasDraft && (
              <div className="mt-4 border border-[#096b17]/30 bg-[#096b17]/5 rounded-lg p-4">
                <p className="text-sm font-medium text-[#096b17]">A homepage draft is waiting for approval.</p>
                <p className="text-xs text-gray-600 mt-0.5">Approve to make it live, or discard to keep your current homepage.</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => draftAction('approve')} disabled={!!busy} className="px-4 py-2 bg-[#096b17] text-white rounded-lg text-sm font-medium disabled:opacity-50">{busy === 'draft:approve' ? 'Publishing…' : 'Approve & publish'}</button>
                  <a href="/admin/dashboard/ai-generate/edit" className="px-4 py-2 border border-[#096b17] text-[#096b17] rounded-lg text-sm font-medium hover:bg-[#096b17]/5">Preview &amp; edit</a>
                  <button onClick={() => draftAction('discard')} disabled={!!busy} className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">Discard</button>
                </div>
              </div>
            )}

            {/* Version history */}
            {home?.versions?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Version history</p>
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {home.versions.map((v) => (
                    <li key={v.index} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-gray-600">{v.source || 'version'} · {v.sectionCount} sections</span>
                      <button onClick={() => draftAction('restore', v.index)} disabled={!!busy} className="text-blue-600 hover:underline disabled:opacity-50">Restore</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Blog drafting — conversational assistant (same as the mission assistant) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">Write a blog with AI</h2>
                <p className="text-sm text-gray-500 mt-0.5">Chat to draft and refine an article, then tap “Draft as blog” to review &amp; publish.</p>
              </div>
              <a href="/admin/dashboard/blog-articles" className="text-sm text-blue-600 hover:underline whitespace-nowrap">All articles →</a>
            </div>
            <BlogChat onCredits={(n) => setCredits((c) => ({ ...c, remaining: n }))} />
          </div>

          {/* Fine edits pointer */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            Want to fine-tune with AI chat + live preview and edit sections by hand? Open the <a href="/admin/dashboard/ai-generate/edit" className="text-blue-600 hover:underline">AI Website Editor</a>.
          </div>
        </>
      )}
    </div>
  );
}
