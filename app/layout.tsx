import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Observatório de Transformação Digital do Estado de São Paulo',
  description: 'Conectando Ciência e Transformação Digital para o Estado de São Paulo',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="antialiased text-gray-800 bg-gray-50" suppressHydrationWarning>{children}</body>
    </html>
  );
}
