'use client';

import { useState } from 'react';

// A minimal, self-contained blog editor for the tokenised /p/edit page. It never
// navigates into the CuraGo app — it only POSTs to /api/p/edit/<token> to publish.
const card = { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,.06)', marginBottom: 18 };
const label = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#5E6B5F', margin: '0 0 6px' };
const input = { width: '100%', boxSizing: 'border-box', border: '1px solid #DDE4D9', borderRadius: 9, padding: '11px 13px', fontSize: 15, color: '#101A13', background: '#F7F9F5', outline: 'none', fontFamily: 'inherit' };

export default function StandaloneEditor({ token, initial }) {
  const [title, setTitle] = useState(initial.title || '');
  const [blocks, setBlocks] = useState(initial.blocks || []);
  const [faqs, setFaqs] = useState(initial.faqs || []);
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [publishedUrl, setPublishedUrl] = useState('');
  const [err, setErr] = useState('');

  const setBlock = (i, key, v) => setBlocks((arr) => arr.map((b, j) => (j === i ? { ...b, [key]: v } : b)));
  const removeBlock = (i) => setBlocks((arr) => arr.filter((_, j) => j !== i));
  const addBlock = () => setBlocks((arr) => [...arr, { heading: '', content: '' }]);
  const setFaq = (i, key, v) => setFaqs((arr) => arr.map((f, j) => (j === i ? { ...f, [key]: v } : f)));
  const removeFaq = (i) => setFaqs((arr) => arr.filter((_, j) => j !== i));
  const addFaq = () => setFaqs((arr) => [...arr, { question: '', answer: '' }]);

  const publish = async () => {
    if (status === 'saving') return;
    setStatus('saving'); setErr('');
    try {
      const res = await fetch(`/api/p/edit/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, blocks, faqs }),
      });
      const d = await res.json();
      if (d.success) { setPublishedUrl(d.url || ''); setStatus('done'); }
      else { setErr(d.error || 'Could not publish.'); setStatus('error'); }
    } catch { setErr('Could not publish. Please try again.'); setStatus('error'); }
  };

  if (status === 'done') {
    const view = /^https?:\/\//i.test(publishedUrl) ? publishedUrl : '';
    return (
      <div style={{ ...card, textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12 }}>✓</div>
        <h1 style={{ fontSize: 23, margin: '0 0 8px' }}>Published</h1>
        <p style={{ color: '#5E6B5F', fontSize: 15, lineHeight: 1.6, margin: '0 0 22px' }}>Your edits are live on your website.</p>
        {view && <a href={view} style={{ display: 'inline-block', background: '#096B17', color: '#fff', padding: '13px 30px', borderRadius: 9, textDecoration: 'none', fontWeight: 600, fontSize: 16 }}>View the page →</a>}
        <p style={{ color: '#99A399', fontSize: 12.5, margin: '18px 0 0' }}>You can close this tab.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: '0 0 4px', fontWeight: 700 }}>Edit your page</h1>
      <p style={{ color: '#5E6B5F', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 22px' }}>Make any changes, then publish straight to your website.</p>

      {initial.imageUrl && (
        <img src={initial.imageUrl} alt="" style={{ width: '100%', maxWidth: 520, borderRadius: 12, marginBottom: 18, display: 'block' }} />
      )}

      <div style={card}>
        <label style={label}>Title</label>
        <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {blocks.map((b, i) => (
        <div key={i} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...label, margin: 0 }}>Section {i + 1}</label>
            <button onClick={() => removeBlock(i)} style={{ background: 'none', border: 0, color: '#b42318', fontSize: 13, cursor: 'pointer' }}>Remove</button>
          </div>
          <input style={{ ...input, fontWeight: 600, marginBottom: 8 }} placeholder="Heading (optional)" value={b.heading} onChange={(e) => setBlock(i, 'heading', e.target.value)} />
          <textarea style={{ ...input, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }} value={b.content} onChange={(e) => setBlock(i, 'content', e.target.value)} />
        </div>
      ))}
      <button onClick={addBlock} style={{ background: '#fff', border: '1px dashed #DDE4D9', borderRadius: 9, padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#101A13', cursor: 'pointer', marginBottom: 22 }}>+ Add section</button>

      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '10px 0 12px' }}>FAQs</h2>
      {faqs.map((f, i) => (
        <div key={i} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...label, margin: 0 }}>Question {i + 1}</label>
            <button onClick={() => removeFaq(i)} style={{ background: 'none', border: 0, color: '#b42318', fontSize: 13, cursor: 'pointer' }}>Remove</button>
          </div>
          <input style={{ ...input, fontWeight: 600, marginBottom: 8 }} placeholder="Question" value={f.question} onChange={(e) => setFaq(i, 'question', e.target.value)} />
          <textarea style={{ ...input, minHeight: 70, resize: 'vertical', lineHeight: 1.6 }} placeholder="Answer" value={f.answer} onChange={(e) => setFaq(i, 'answer', e.target.value)} />
        </div>
      ))}
      <button onClick={addFaq} style={{ background: '#fff', border: '1px dashed #DDE4D9', borderRadius: 9, padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#101A13', cursor: 'pointer', marginBottom: 24, display: 'block' }}>+ Add question</button>

      {err && <p style={{ color: '#b42318', fontSize: 14, margin: '0 0 14px' }}>{err}</p>}

      <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(180deg,rgba(247,249,245,0),#F7F9F5 40%)', padding: '16px 0 8px' }}>
        <button onClick={publish} disabled={status === 'saving'}
          style={{ background: '#096B17', color: '#fff', border: 0, borderRadius: 10, padding: '15px 34px', fontSize: 16, fontWeight: 700, cursor: status === 'saving' ? 'default' : 'pointer', opacity: status === 'saving' ? 0.7 : 1 }}>
          {status === 'saving' ? 'Publishing…' : 'Publish to my website →'}
        </button>
      </div>
    </div>
  );
}
