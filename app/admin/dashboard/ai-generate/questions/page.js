'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Pre-generation intake: the AI asks a few questions (dynamic input types +
// asset uploads) so it can build an accurate, rich website. Answers are passed
// to generate-site.
export default function AiSiteQuestions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [uploading, setUploading] = useState('');
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState('');

  const loadQuestions = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/practice-os/actions/site-intake', { method: 'POST', credentials: 'include' });
      const d = await res.json();
      if (d.success) {
        setQuestions(d.questions || []);
        // If the AI has no questions, generate straight away.
        if (!d.questions || d.questions.length === 0) { await generate({}); return; }
      } else {
        setErr(d.error === 'PaymentRequired' ? 'The AI website builder is a paid feature — you need an active Builder Pack.' : (d.error || 'Could not prepare questions.'));
      }
    } catch { setErr('Something went wrong.'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));
  const toggleMulti = (id, opt) => setAnswers((a) => {
    const cur = Array.isArray(a[id]) ? a[id] : [];
    return { ...a, [id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
  });

  const uploadImage = async (id, file) => {
    if (!file) return;
    setUploading(id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', 'ai-site');
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd, credentials: 'include' });
      const d = await res.json();
      if (d.success && d.url) setAnswer(id, d.url);
      else setErr(d.error || 'Upload failed.');
    } catch { setErr('Upload failed.'); }
    finally { setUploading(''); }
  };

  const generate = async (finalAnswers) => {
    setGenerating(true); setErr('');
    try {
      const res = await fetch('/api/practice-os/actions/generate-site', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answers: finalAnswers ?? answers }),
      });
      const d = await res.json();
      if (d.skipped && d.reason === 'customized') {
        if (window.confirm("You've made your own changes to this website. Generate a fresh AI draft anyway? Your live site stays up until you approve.")) {
          const res2 = await fetch('/api/practice-os/actions/generate-site', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ answers: finalAnswers ?? answers, force: true }),
          });
          const d2 = await res2.json();
          if (d2.success) { router.push('/admin/dashboard/ai-generate/edit'); return; }
          setErr(d2.message || d2.error || 'Could not generate.');
        }
      } else if (d.success) {
        // Straight to the split editor to preview / refine / approve.
        router.push('/admin/dashboard/ai-generate/edit');
        return;
      } else {
        setErr(d.message || d.error || 'Could not generate your website.');
      }
    } catch { setErr('Something went wrong.'); }
    finally { setGenerating(false); }
  };

  if (loading || generating) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#096b17] border-t-transparent animate-spin" />
        <p className="text-gray-500 mt-4 text-sm">{generating ? 'Building your website…' : 'Preparing a few questions…'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <button onClick={() => router.push('/admin/dashboard/ai-generate')} className="text-gray-500 hover:text-gray-800 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">A few quick questions</h1>
        <p className="text-gray-500 text-sm mt-1">Answer what you can — the more you share, the better your website. Everything is optional.</p>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{err}</div>}

      <div className="space-y-5">
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-800">{q.label}</label>
            {q.help && <p className="text-xs text-gray-400 mt-0.5 mb-2">{q.help}</p>}

            {q.type === 'text' && (
              <input value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder={q.placeholder} className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#096b17] focus:border-transparent" />
            )}
            {q.type === 'textarea' && (
              <textarea value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} rows={3} placeholder={q.placeholder} className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#096b17] focus:border-transparent" />
            )}
            {q.type === 'select' && (
              <select value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select…</option>
                {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {q.type === 'multiselect' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const on = Array.isArray(answers[q.id]) && answers[q.id].includes(o);
                  return (
                    <button key={o} type="button" onClick={() => toggleMulti(q.id, o)} className={`px-3 py-1.5 rounded-full text-[13px] border ${on ? 'border-[#096b17] bg-[#096b17]/8 text-[#096b17]' : 'border-gray-300 text-gray-600'}`}>{o}</button>
                  );
                })}
              </div>
            )}
            {q.type === 'image' && (
              <div className="mt-2 flex items-center gap-3">
                {answers[q.id] && <img src={answers[q.id]} alt="" className="h-14 rounded border border-gray-200 object-contain" />}
                <label className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  {uploading === q.id ? 'Uploading…' : (answers[q.id] ? 'Change' : 'Upload')}
                  <input type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(e) => uploadImage(q.id, e.target.files?.[0])} />
                </label>
                {answers[q.id] && <button onClick={() => setAnswer(q.id, '')} className="text-sm text-gray-400 hover:text-red-500">Remove</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => generate()} disabled={generating} className="px-6 py-3 bg-[#096b17] text-white rounded-lg font-medium hover:bg-[#075512] disabled:opacity-50">Generate my website →</button>
        <button onClick={() => generate({})} disabled={generating} className="text-sm text-gray-500 hover:text-gray-700">Skip &amp; generate anyway</button>
      </div>
    </div>
  );
}
