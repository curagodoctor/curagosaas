// §5 — inline NAP (Name / Address / Phone) caution. Shown right on the forms
// where a doctor enters or edits their clinic's name, address, or phone, because
// these details feed Google Business Profile and directories: if they drift out
// of sync — or are changed carelessly after Google has verified them — the
// profile can be suspended or forced into re-verification. The warning belongs
// at the point of the risky action, not buried in a lecture watched earlier.
export default function NapCaution({ className = '' }) {
  return (
    <div className={`flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 ${className}`}>
      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A1.5 1.5 0 003.11 21h17.78a1.5 1.5 0 001.3-2.44l-8.48-14.7a1.5 1.5 0 00-2.62 0z" />
      </svg>
      <div className="text-[13px] leading-relaxed text-amber-900">
        <p className="font-semibold mb-0.5">Keep Name, Address &amp; Phone identical everywhere</p>
        <p>
          Use the exact same clinic <strong>name, address and phone</strong> here as on your
          Google Business Profile and any directories. Once Google has verified your profile,
          changing or mismatching these can trigger <strong>suspension or re-verification</strong>,
          which takes your listing offline for days. Set them carefully and change them rarely.
        </p>
      </div>
    </div>
  );
}
