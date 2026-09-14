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
    const publicPaths = ['/login', '/reset-password', '/privacy', '/terms'];
    const isPublicPath = publicPaths.includes(pathname);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. セッションがない（未ログイン）場合
      if (!session) {
        if (!isPublicPath) {
          router.replace('/login');
        } else {
          setIsAuthorized(true);
        }
        return;
      }

      // 2. ログイン済みの場合、プロフィール（`profiles` テーブル）の存在を確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      // 3. プロフィールが未登録（新規ユーザー）の場合
      if (!profile) {
        if (pathname !== '/setup-profile') {
          router.replace('/setup-profile'); // 初回登録画面へ強制送還
        } else {
          setIsAuthorized(true); // すでに setup-profile にいれば表示を許可
        }
        return;
      }

      // 4. プロフィール登録済み（既存ユーザー）の場合
      if (isPublicPath || pathname === '/setup-profile') {
        router.replace('/'); // ログイン画面や初回設定画面には行かせずホームへ
        return;
      }

      // すべての関所を通過した場合のみアクセスを許可
      setIsAuthorized(true);
    };

    checkAuth();

    // 認証状態の変化を監視
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (!publicPaths.includes(pathname)) {
          router.replace('/login');
        }
      } else {
        // ログイン状態変化時も同様にプロフィールチェックを走らせる
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile && pathname !== '/setup-profile') {
          router.replace('/setup-profile');
        } else if (profile && (publicPaths.includes(pathname) || pathname === '/setup-profile')) {
          router.replace('/');
        } else {
          setIsAuthorized(true);
        }
      }
    });

    return () => authListener.unsubscribe();
  }, [pathname, router]);

  // 認証の判定が終わるまでは画面を表示しない（文字色はご指定に合わせて黒色に統一）
  if (!isAuthorized) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-black">認証情報を確認中...</div>;
  }

  return <>{children}</>;
}