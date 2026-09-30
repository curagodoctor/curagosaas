import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyActionToken } from '@/lib/practice-os/actionToken';
import { publishDayBlog } from '@/lib/practice-os/autoContent';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Rebuild markdown (the format parseArticleFromMarkdown expects) from the editor's
// structured payload, so the edited page publishes exactly as edited.
function toMarkdown({ title, blocks = [], faqs = [] }) {
  let md = `## ${String(title || 'Untitled').trim()}\n\n`;
  for (const b of blocks) {
    const heading = String(b?.heading || '').trim();
    const content = String(b?.content || '').trim();
    if (!content && !heading) continue;
    md += heading ? `### ${heading}\n${content}\n\n` : `${content}\n\n`;
  }
  const cleanFaqs = (faqs || []).filter((f) => String(f?.question || '').trim() && String(f?.answer || '').trim());
  if (cleanFaqs.length) {
    md += `### FAQs\n\n`;
    cleanFaqs.forEach((f, i) => { md += `${i + 1}. **${String(f.question).trim()}**\n   ${String(f.answer).trim()}\n\n`; });
  }
  return md;
}

// POST /api/p/edit/<token> — save the edited content and publish it. Token is the
// only auth (no login). An 'edit' token is allowed to publish.
export async function POST(request, { params }) {
  const { token } = await params;
  const claim = verifyActionToken(token);
  if (!claim || claim.action !== 'edit') {
    return NextResponse.json({ success: false, error: 'This link has expired or is invalid.' }, { status: 400 });
  }
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const md = toMarkdown(body);
    const result = await publishDayBlog(claim.doctorId, claim.missionId, md);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (e) {
    console.error('[p/edit POST]', e);
    return NextResponse.json({ success: false, error: 'Could not publish. Please try again.' }, { status: 500 });
  }
}
