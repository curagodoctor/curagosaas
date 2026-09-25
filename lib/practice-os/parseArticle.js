// Deterministic markdown → BlogArticle parser.
//
// Why this exists: publishing a day's content used to re-run the text through the
// LLM ("turn this into a blog article"), which SUMMARISED it — dropping sections
// (About the doctor, Consultation/phone, When Not Appropriate, Alternatives…),
// merging others, and rewriting the FAQs. The doctor pasted rich content and got
// a shorter, different page. This parser instead preserves the doctor's content
// VERBATIM: every section becomes a block, the FAQ list is kept as-is, and the
// only things removed are internal/leaked scaffolding (image prompt, semantic
// universe) that were never meant to be published.

const clean = (s) => String(s || '').replace(/^\s*[:#>*\-\s]+|\s+$/g, '').trim();

// Pull the numbered / bold Q&A list out of an FAQ section body.
function parseFaqs(body) {
  const faqs = [];
  // Each item starts with an optional "1." then a bolded question: **Q?**
  const items = String(body || '')
    .split(/\n(?=\s*(?:\d+[.)]\s*)?\*\*)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const it of items) {
    const qm = it.match(/^\s*(?:\d+[.)]\s*)?\*\*([\s\S]+?)\*\*/);
    if (!qm) continue;
    const question = qm[1].replace(/\s+/g, ' ').replace(/[:#]+$/, '').trim();
    const answer = it.slice(qm.index + qm[0].length).replace(/^[\s:—-]+/, '').replace(/\s*\n\s*/g, ' ').trim();
    if (question) faqs.push({ question: question.slice(0, 300), answer: answer.slice(0, 1200) });
  }
  return faqs;
}

// Returns { title, excerpt, metaDescription, blocks:[{heading,content}], faqs:[{question,answer}] }
// or null when the text has no usable structure (caller can fall back to the LLM).
export function parseArticleFromMarkdown(raw) {
  let text = String(raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return null;

  // 1) Cut internal/leaked scaffolding from the first such marker onward.
  const cutMarkers = [
    /\n[\s>*_-]*\**\s*image\s+generation\s+prompt\b/i,
    /\n[\s>*_-]*\**\s*semantic\s+universe\b/i,
    /\n[\s>*_-]*\**\s*internal\s+(reference|notes?|use only)\b/i,
    /\n[\s>*_-]*\**\s*step\s+\d+\s*[—:-]\s*derive\b/i,
  ];
  for (const re of cutMarkers) {
    const m = text.match(re);
    if (m && m.index > 40) text = text.slice(0, m.index).trim();
  }

  // 2) Title = first #/##/### heading, else first **bold** line.
  let title = '';
  const th = text.match(/^#{1,3}\s+(.+)$/m);
  if (th) {
    title = clean(th[1]);
    text = (text.slice(0, th.index) + text.slice(th.index + th[0].length)).trim();
  } else {
    const bh = text.match(/^\*\*(.+?)\*\*\s*$/m);
    if (bh) { title = clean(bh[1]); text = (text.slice(0, bh.index) + text.slice(bh.index + bh[0].length)).trim(); }
  }

  // 3) Normalise both heading grammars to "### Heading":
  //    horizontal rules dropped; a standalone **Bold** line becomes a heading.
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  text = text.replace(/^\s*\*\*(.+?)\*\*\s*:?\s*$/gm, '### $1');
  text = text.replace(/^\s*(#{1,2})\s+/gm, '### '); // fold #/## down to ### section level

  // 4) Slice into sections at each ### heading.
  const headingRe = /^###\s+(.+)$/gm;
  const matches = [...text.matchAll(headingRe)];

  const blocks = [];
  let faqs = [];
  let excerpt = '';

  const routeSection = (heading, body) => {
    const h = clean(heading);
    const b = String(body || '').trim();
    if (!h && !b) return;
    if (/^(faqs?\b|frequently asked)/i.test(h)) { faqs = parseFaqs(b); return; }
    if (/^snippet$/i.test(h)) { if (b) excerpt = b.replace(/\s+/g, ' ').trim().slice(0, 300); return; }
    if (/^hero$/i.test(h)) { if (b) blocks.push({ heading: '', content: b }); return; } // intro, no visible heading
    blocks.push({ heading: h.slice(0, 160), content: b });
  };

  if (!matches.length) {
    // No sections at all — keep the whole thing as one block (still verbatim).
    if (text.trim()) blocks.push({ heading: '', content: text.trim() });
  } else {
    const intro = text.slice(0, matches[0].index).trim();
    if (intro) blocks.push({ heading: '', content: intro });
    for (let i = 0; i < matches.length; i++) {
      const heading = matches[i][1];
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      routeSection(heading, text.slice(start, end));
    }
  }

  if (!blocks.length && !faqs.length) return null;

  if (!excerpt) {
    const firstBody = (blocks.find((b) => b.content)?.content || '').replace(/\s+/g, ' ').trim();
    excerpt = firstBody.slice(0, 300);
  }
  const metaDescription = excerpt.slice(0, 155);

  return { title, excerpt, metaDescription, blocks, faqs };
}
