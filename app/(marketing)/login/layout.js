// Auth page — should not be indexed, and must not canonicalize to the homepage.
export const metadata = {
  title: 'Sign in · CuraGo',
  robots: { index: false, follow: true },
  alternates: { canonical: '/login' },
};

export default function LoginLayout({ children }) {
  return children;
}
