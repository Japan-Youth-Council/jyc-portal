import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import AuthGuard from '@/components/AuthGuard'; // ★追加: 監視システムを読み込む

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JYC Portal',
  description: 'Japan Youth Council Portal System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* ★追加: AuthGuardで全体を囲み、未ログイン者をブロックする */}
        <AuthGuard>
          {/* ★全ページ共通でヘッダーを表示する */}
          <Header />
          
          {/* 各ページの中身はここに展開される */}
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}