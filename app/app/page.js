import { redirect } from 'next/navigation';

// The /app entry no longer shows a product chooser. Logging in drops the doctor
// straight into Practice OS; the Website Builder is reachable from the Practice
// OS top nav ("Website Builder"). See CLAUDE.md — one login, two products.
export default function AppIndex() {
  redirect('/app/practice-os');
}
