'use client';

// A tiny, dependency-free Markdown renderer for the assistant's replies.
// The model returns Markdown (**bold**, ## headings, - lists, `code`), which used
// to show raw asterisks/backticks. This renders the common subset safely — no
// dangerouslySetInnerHTML, everything goes through React elements/text nodes.

// Inline: **bold**, *italic* / _italic_, `code`, [label](url). Returns React nodes.
function renderInline(text, keyPrefix = 'i') {
  const nodes = [];
  let rest = String(text ?? '');
  let k = 0;
  // Ordered so ** is tried before *.
  const patterns = [
    { re: /\*\*([^*]+)\*\*/, tag: 'strong' },
    { re: /__([^_]+)__/, tag: 'strong' },
    { re: /`([^`]+)`/, tag: 'code' },
    { re: /\*([^*\n]+)\*/, tag: 'em' },
    { re: /_([^_\n]+)_/, tag: 'em' },
    { re: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/, tag: 'a' },
  ];
  while (rest) {
    let best = null;
    for (const p of patterns) {
      const m = p.re.exec(rest);
      if (m && (best === null || m.index < best.m.index)) best = { p, m };
    }
    if (!best) { nodes.push(rest); break; }
    const { p, m } = best;
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    const key = `${keyPrefix}-${k++}`;
    if (p.tag === 'strong') nodes.push(<strong key={key}>{m[1]}</strong>);
    else if (p.tag === 'em') nodes.push(<em key={key}>{m[1]}</em>);
    else if (p.tag === 'code') nodes.push(<code key={key} className="px-1 py-0.5 rounded text-[0.92em]" style={{ background: 'rgba(16,26,19,.08)', fontFamily: 'var(--font-mono, monospace)' }}>{m[1]}</code>);
    else if (p.tag === 'a') nodes.push(<a key={key} href={m[2]} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--green)' }}>{m[1]}</a>);
    rest = rest.slice(m.index + m[0].length);
  }
  return nodes;
}

export default function Markdown({ text, className = '' }) {
  const src = String(text ?? '').replace(/\r\n/g, '\n');
  const lines = src.split('\n');
  const blocks = [];
  let list = null;         // { ordered, items: [{ text, num }] }
  let pendingBlank = false; // a blank line seen; only breaks the list if a non-list line follows

  const flushList = () => {
    if (!list) return;
    // Preserve the author's own numbers with an explicit value on each item, and
    // set the list `start`, so a single continuous ordered list never restarts at
    // 1 even if the model separated items with blank lines. (#4)
    const items = list.items.map((it, i) => (
      <li key={i} value={list.ordered ? it.num : undefined}>{renderInline(it.text, `li${blocks.length}-${i}`)}</li>
    ));
    blocks.push(list.ordered
      ? <ol key={`b${blocks.length}`} start={list.items[0]?.num || 1} className="list-decimal pl-5 space-y-1 my-1.5">{items}</ol>
      : <ul key={`b${blocks.length}`} className="list-disc pl-5 space-y-1 my-1.5">{items}</ul>);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { pendingBlank = true; continue; }

    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushList(); pendingBlank = false;
      const lvl = h[1].length;
      const size = lvl <= 1 ? 'text-[16px]' : lvl === 2 ? 'text-[15px]' : 'text-[14px]';
      blocks.push(<p key={`b${blocks.length}`} className={`font-semibold ${size} mt-2 mb-1`} style={{ color: 'var(--ink)' }}>{renderInline(h[2], `h${blocks.length}`)}</p>);
      continue;
    }
    const ol = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (ol) {
      // A blank line between ordered items is ignored — keep one continuous list.
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push({ text: ol[2], num: Number(ol[1]) });
      pendingBlank = false;
      continue;
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ul) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push({ text: ul[1] });
      pendingBlank = false;
      continue;
    }

    // A normal line: end any list, then render a paragraph.
    flushList(); pendingBlank = false;
    blocks.push(<p key={`b${blocks.length}`} className="my-1 leading-relaxed">{renderInline(line, `p${blocks.length}`)}</p>);
  }
  flushList();

  return <div className={className}>{blocks}</div>;
}
