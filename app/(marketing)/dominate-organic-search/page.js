// The "Dominate Organic Search" landing is now the site homepage (see
// app/(marketing)/page.js). This former route permanently redirects to `/`
// so old links keep working and Google sees a single canonical URL.
import { permanentRedirect } from 'next/navigation';

export default function Page() {
  permanentRedirect('/');
}
