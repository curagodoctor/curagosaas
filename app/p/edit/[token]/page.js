import connectDB from '@/lib/mongodb';
import { verifyActionToken } from '@/lib/practice-os/actionToken';
import { parseArticleFromMarkdown } from '@/lib/practice-os/parseArticle';
import PracticeOsChatMessage from '@/models/practice-os/PracticeOsChatMessage';
import StandaloneEditor from '@/components/practice-os/StandaloneEditor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit your page · Curago', robots: { index: false, follow: false } };

// A standalone editor opened from the daily-task email. NOT the CuraGo app: no
// dashboard, no nav, no login — just this page, authorised by the signed token.
function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F9F5', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif", color: '#101A13' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ color: '#096B17', fontSize: 20, fontWeight: 700 }}>Curago</span>
          <span style={{ color: '#5E6B5F', fontSize: 12, marginLeft: 8 }}>Dominate Organic Search</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function EditPage({ params }) {
  const { token } = await params;
  const claim = verifyActionToken(token);
  if (!claim || claim.action !== 'edit') {
    return (
      <Shell>
        <div style={{ background: '#fff', borderRadius: 14, padding: 36, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 10px' }}>This edit link has expired</h1>
          <p style={{ color: '#5E6B5F', fontSize: 15, lineHeight: 1.6, margin: 0 }}>Open the task in your dashboard to edit and publish it there.</p>
        </div>
      </Shell>
    );
  }

  await connectDB();
  const draft = await PracticeOsChatMessage.findOne({ doctorId: claim.doctorId, missionId: claim.missionId, role: 'assistant' })
    .sort({ createdAt: -1 }).lean();
  const parsed = parseArticleFromMarkdown(draft?.content || '');

  if (!parsed || !parsed.blocks.length) {
    return (
      <Shell>
        <div style={{ background: '#fff', borderRadius: 14, padding: 36, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 10px' }}>Nothing to edit yet</h1>
          <p style={{ color: '#5E6B5F', fontSize: 15, lineHeight: 1.6, margin: 0 }}>This task's content isn't ready. Please try again shortly.</p>
        </div>
      </Shell>
    );
  }

  const initial = {
    title: parsed.title || '',
    blocks: parsed.blocks.map((b) => ({ heading: b.heading || '', content: b.content || '' })),
    faqs: parsed.faqs || [],
    imageUrl: draft?.imageUrl || '',
  };

  return (
    <Shell>
      <StandaloneEditor token={token} initial={initial} />
    </Shell>
  );
}
