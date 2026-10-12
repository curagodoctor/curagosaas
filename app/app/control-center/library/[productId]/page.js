'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function LibraryItemPage({ params }) {
  const { productId } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessonIdx, setLessonIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/store/item/${productId}`, { credentials: 'include' }).then((r) => r.json())
      .then((d) => { if (d.success) setData(d); else setError(d.error || 'Could not open this item.'); })
      .catch(() => setError('Could not open this item.')).finally(() => setLoading(false));
  }, [productId]);

  return (
    <div className="pos-root" style={{ background: 'var(--paper)', minHeight: '100%' }}>
      <div className="mx-auto max-w-[820px] px-5 md:px-8 py-6">
        <Link href="/app/control-center/library" className="text-[13px] font-semibold inline-flex items-center gap-1 mb-4" style={{ color: 'var(--green)' }}>← My library</Link>

        {loading ? <p className="text-[14px]" style={{ color: 'var(--muted)' }}>Opening…</p>
          : error ? <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--rule-soft)', color: 'var(--ink)' }}>{error}</div>
          : data?.type === 'book' ? <BookReader data={data} />
          : <CoursePlayer productId={productId} data={data} lessonIdx={lessonIdx} setLessonIdx={setLessonIdx} />}
      </div>
    </div>
  );
}

// Kindle-like reader — serif, comfortable measure, warm paper. Renders the
// server-extracted (sanitized) HTML; the original file is never served.
function BookReader({ data }) {
  return (
    <article>
      <h1 className="text-[26px] md:text-[30px] font-semibold mb-6" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{data.title}</h1>
      <div className="store-reader" dangerouslySetInnerHTML={{ __html: data.html }} />
      <style jsx global>{`
        .store-reader { font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif; color: #2a2320; font-size: 19px; line-height: 1.75; }
        .store-reader p { margin: 0 0 1.1em; }
        .store-reader h1, .store-reader h2, .store-reader h3 { font-family: 'Instrument Sans', system-ui, sans-serif; color: #101A13; line-height: 1.3; margin: 1.6em 0 0.6em; font-weight: 600; }
        .store-reader h1 { font-size: 24px; } .store-reader h2 { font-size: 21px; } .store-reader h3 { font-size: 18px; }
        .store-reader ul, .store-reader ol { margin: 0 0 1.1em 1.4em; } .store-reader li { margin: 0.3em 0; }
        .store-reader img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
        .store-reader strong { color: #101A13; }
        .store-reader table { max-width: 100%; display: block; overflow-x: auto; border-collapse: collapse; }
        .store-reader td, .store-reader th { border: 1px solid #DDE4D9; padding: 6px 10px; }
      `}</style>
    </article>
  );
}

function CoursePlayer({ productId, data, lessonIdx, setLessonIdx }) {
  const lessons = data.lessons || [];
  const current = lessons[lessonIdx] || lessons[0];
  return (
    <div>
      <h1 className="text-[24px] md:text-[28px] font-semibold mb-4" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{data.title}</h1>
      {!lessons.length ? (
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>No lessons in this course yet.</p>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          <div className="rounded-xl overflow-hidden" style={{ background: '#000' }}>
            {/* Streamed from GCS via the ownership-gated redirect route. */}
            <video key={current.id} src={`/api/store/stream/${productId}?lesson=${current.id}`} controls autoPlay playsInline style={{ width: '100%', aspectRatio: '16/9', background: '#000' }} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.11em] mb-2" style={{ color: 'var(--muted)' }}>Lessons</p>
            <div className="flex flex-col gap-1">
              {lessons.map((l, i) => (
                <button key={l.id} onClick={() => setLessonIdx(i)} className="text-left rounded-lg px-3 py-2.5 flex items-center justify-between gap-2" style={{ background: i === lessonIdx ? 'rgba(9,107,23,.08)' : 'transparent', border: '1px solid ' + (i === lessonIdx ? 'rgba(9,107,23,.2)' : 'var(--rule-soft)') }}>
                  <span className="text-[14px]" style={{ color: i === lessonIdx ? 'var(--green)' : 'var(--ink)', fontWeight: i === lessonIdx ? 600 : 400 }}>{i + 1}. {l.title}</span>
                  {l.durationLabel && <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{l.durationLabel}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
