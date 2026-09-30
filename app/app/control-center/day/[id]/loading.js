// Shown instantly while the day route loads (navigation + data fetch), so clicking
// "Review today's content" never lands on a blank screen.
export default function DayLoading() {
  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: 'var(--paper)' }}>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="w-14 h-14 rounded-full border-[5px] border-[var(--green)] border-t-transparent animate-spin" />
        <p className="text-[17px] font-semibold text-[var(--ink)]">Preparing today&apos;s content…</p>
        <p className="text-[13px] text-[var(--muted)]">Loading your task — this takes a few seconds.</p>
      </div>
    </div>
  );
}
