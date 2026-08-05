// Auth page — should not be indexed, and must not canonicalize to the homepage.
export const metadata = {
  title: 'Create your account · CuraGo',
  robots: { index: false, follow: true },
  alternates: { canonical: '/signup' },
};

export default function SignupLayout({ children }) {
  return children;
}
