import './globals.css';

export const metadata = {
  title: 'CTEM — Clinical Trial Eligibility Matcher',
  description:
    'Explainable patient-to-protocol matching for clinical trial recruitment. Deterministic criterion evaluation, missing-evidence detection, and adversarial record integrity checks.',
  applicationName: 'CTEM',
  authors: [{ name: 'CTEM' }],
  openGraph: {
    title: 'CTEM — Clinical Trial Eligibility Matcher',
    description: 'Transparent, evidence-backed eligibility decisions for trial recruitment.',
    type: 'website'
  }
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#fdfcfb' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}