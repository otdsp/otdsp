import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Transformação Digital USP',
  description: 'An immersive, kinetic scrolling experience for an innovation hub.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans flex flex-col min-h-screen" suppressHydrationWarning>
        <Navbar />
        <main className="flex-grow w-full flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
