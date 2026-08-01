import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Auto-IEEE Layout Compiler',
  description: 'Typeset your research draft into a submission-ready IEEE document',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", ' + inter.style.fontFamily }}
      >
        {children}
      </body>
    </html>
  );
}
