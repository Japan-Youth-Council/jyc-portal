"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // ログイン不要でアクセスできるページのパスを指定
    const publicPaths = ['/login', '/reset-password'];
    const isPublicPath = publicPaths.includes(pathname);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // セッションがない（未ログイン）のに、ログイン不要ページ以外にアクセスした場合
      if (!session && !isPublicPath) {
        router.replace('/login'); // ログイン画面に強制リダイレクト
      } else {
        setIsAuthorized(true); // アクセス許可
      }
    };

    checkAuth();

    // ログイン状態の変化（ログアウトなど）を常に監視
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !publicPaths.includes(pathname)) {
        router.replace('/login');
      } else {
        setIsAuthorized(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [pathname, router]);

  // 認証の判定が終わるまでは画面を表示しない（チラつき防止）
  if (!isAuthorized) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">認証情報を確認中...</div>;
  }

  return <>{children}</>;
}