import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Transformação Digital USP',
  description: 'Innovation hub.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className="font-sans flex flex-col min-h-screen" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 w-full flex flex-col pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
