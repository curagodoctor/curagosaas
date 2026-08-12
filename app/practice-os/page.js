import Link from 'next/link';

export const metadata = {
  title: 'Zero To Practice Builder — Build your practice, one mission a day | CuraGo',
  description: 'CuraGo Zero To Practice Builder is an execution platform for doctors. Complete one guided mission every day — with education, an AI assistant, evidence tracking, and progress scoring — to systematically build your medical practice.',
};

const FEATURES = [
  { title: 'One mission a day', body: 'No overwhelm. A single, clear, guided action each day — from Google Business Profile to reviews, website, and referrals.' },
  { title: 'Context-aware AI assistant', body: 'Every mission comes with an AI helper scoped to that exact task, so you never start from a blank page.' },
  { title: 'Evidence & progress', body: 'Upload proof, log your KPIs, and watch your streak, execution score, and practice timeline grow.' },
  { title: 'Built for accountability', body: 'Tomorrow unlocks only after today. Celebrations, XP, and streaks keep you executing consistently.' },
];

export default function PracticeOSProductPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-black tracking-wide text-[#096b17]">CuraGo</Link>
          <Link href="/login?entry=practice-os" className="text-sm font-semibold text-gray-700 hover:text-[#096b17]">Sign in</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <span className="inline-block text-[11px] font-bold text-[#096b17] bg-[#096b17]/10 px-3 py-1 rounded-full uppercase tracking-wide mb-5">CuraGo Zero To Practice Builder</span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Build your practice, one guided mission a day.
          </h1>
          <p className="text-lg text-gray-600 mt-5">
            Zero To Practice Builder is not a course. It&apos;s an execution platform — it educates, guides, tracks, and holds you
            accountable until your practice is established.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login?entry=practice-os" className="inline-flex items-center justify-center gap-2 bg-[#096b17] hover:bg-[#075110] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              Get Zero To Practice Builder
            </Link>
            <a href="#how" className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50">
              How it works
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">Sign in with Google or email, then unlock instant access.</p>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
              <p className="text-gray-600 mt-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#096b17]">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to start executing?</h2>
          <p className="text-emerald-100 mt-3">Sign in, unlock Zero To Practice Builder, and complete your first mission today.</p>
          <Link href="/login?entry=practice-os" className="inline-flex items-center gap-2 bg-white text-[#096b17] px-8 py-4 rounded-xl font-semibold text-lg mt-7 hover:bg-emerald-50 transition-colors">
            Get Zero To Practice Builder
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-gray-400">
        Powered by <span className="text-[#096b17] font-medium">CuraGo</span>
      </footer>
    </div>
  );
}
