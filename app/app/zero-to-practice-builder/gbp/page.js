'use client';

import { useRouter } from 'next/navigation';
import PosNav from '@/components/practice-os/PosNav';
import GbpGuide from '@/components/practice-os/GbpGuide';

// §8 — the standalone Google Business Profile guide, reachable from the setup
// checklist and engagement nudges. Same guided flow as the onboarding wizard
// (no OAuth — the doctor makes the changes in their own Google account).
export default function GbpPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto px-5 pt-[64px] pb-10">
      <PosNav breadcrumb="Google Business Profile" />

      <div className="mt-8 mb-4">
        <p className="pos-label" style={{ color: 'var(--green)' }}>Google Business Profile</p>
        <h1 className="text-[26px] font-semibold text-[var(--ink)] mt-1" style={{ letterSpacing: '-0.02em' }}>Set up your Google profile — carefully.</h1>
        <p className="text-sm text-[var(--muted)] mt-2" style={{ maxWidth: '52ch' }}>
          You make the changes in your own Google account. We guide you, and mark which fields are dangerous <b>before</b> you touch them. Start with the mandatory block.
        </p>
      </div>

      <GbpGuide renderFooter={(mandatoryComplete) => (
        <>
          {!mandatoryComplete && (
            <p className="text-[13px] mt-3" style={{ color: 'var(--orange)' }}>Work through the mandatory <b>Suspension risk</b> block first — it protects your listing.</p>
          )}
          <button onClick={() => router.push('/app/zero-to-practice-builder/start')} className="pos-action mt-5">
            Back to setup →
          </button>
        </>
      )} />
    </div>
  );
}
