import './globals.css';

export const metadata = {
  title: 'Guardian — AI App Production Readiness',
  description: 'Free bounded security and production-readiness scan for public GitHub repositories built with AI tools and Supabase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
