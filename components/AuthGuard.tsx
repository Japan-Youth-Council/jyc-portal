"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // '/login' を消し、'/' (トップページ) をログイン不要の要にする
    const publicPaths = ['/', '/privacy', '/terms'];
    const isPublicPath = publicPaths.includes(pathname);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. 未ログインの場合
      if (!session) {
        if (!isPublicPath) {
          router.replace('/'); // 未ログインで内部ページを見ようとしたら、トップ(ログイン画面)へ弾く
        } else {
          setIsAuthorized(true); // 公開ページならそのまま表示を許可
        }
        return;
      }

      // 2. ログイン済みの場合、プロフィールの存在を確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', session.user.id)
        .maybeSingle();

      // 3. プロフィールが未登録（新規ユーザー）の場合
      if (!profile || !profile.name) {
        if (pathname !== '/setup-profile') {
          router.replace('/setup-profile'); // 初回登録画面へ強制送還
        } else {
          setIsAuthorized(true);
        }
        return;
      }

      // 4. プロフィール登録済み（既存ユーザー）の場合
      if (isPublicPath || pathname === '/setup-profile') {
        router.replace('/home'); // ログイン済みならダッシュボードへ直行させる
        return;
      }

      // すべての関所を通過した場合のみアクセスを許可
      setIsAuthorized(true);
    };

    checkAuth();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (!publicPaths.includes(pathname)) {
          router.replace('/'); // ログアウトした瞬間にトップへ戻す
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', session.user.id)
          .maybeSingle();

        if ((!profile || !profile.name) && pathname !== '/setup-profile') {
          router.replace('/setup-profile');
        } else if (profile?.name && (publicPaths.includes(pathname) || pathname === '/setup-profile')) {
          router.replace('/home');
        } else {
          setIsAuthorized(true);
        }
      }
    });

    return () => authListener.unsubscribe();
  }, [pathname, router]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-black">認証情報を確認中...</div>;
  }

  return <>{children}</>;
}