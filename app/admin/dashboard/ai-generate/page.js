'use client';

// Full AI Generate implementation saved in page.backup.js.txt
// Restore from that file when ready to launch AI features

export default function AIGeneratePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md opacity-60">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-400 mb-3">AI Website Generator</h1>
        <p className="text-gray-400 mb-6">
          Generate your clinic website using AI. Fill a quick form, upload documents, and get a professional website in seconds.
        </p>
        <span className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Coming Soon
        </span>
        <p className="text-xs text-gray-400 mt-4">AI-powered website generation with token-based pricing will be available soon.</p>
      </div>
    </div>
  );
}
