import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import AuthGuard from '@/components/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JYC Portal',
  description: 'Japan Youth Council Portal System',
  // ★追加：Google Search Consoleの所有権確認用メタタグを設定
  verification: {
    google: '<meta name="google-site-verification" content="QGiDGPph8jmGBUGAzO_NW4mQ4FE0Dam2IwXSIJ1r1W8" />', 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthGuard>
          <Header />
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}