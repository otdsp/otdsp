import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Transformação Digital USP',
  description: 'An immersive, kinetic scrolling experience for an innovation hub.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans" suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
