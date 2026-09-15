"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const publicPaths = ['/', '/privacy', '/terms'];
    const isPublicPath = publicPaths.includes(pathname);

    // プロフィールの必須項目がすべて埋まっているか判定する関数
    const checkProfileComplete = (profile: any) => {
      return (
        profile &&
        profile.name &&
        profile.furigana &&
        profile.attribute &&
        profile.prefecture &&
        profile.goal // ここをgoalに修正しました
      );
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (!isPublicPath) {
          router.replace('/'); 
        } else {
          setIsAuthorized(true); 
        }
        return;
      }

      // DBから必須項目を取得（goalを含める）
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, furigana, attribute, prefecture, goal')
        .eq('id', session.user.id)
        .maybeSingle();

      const isComplete = checkProfileComplete(profile);

      // 必須項目が1つでも欠けている場合
      if (!isComplete) {
        if (pathname !== '/setup-profile') {
          router.replace('/setup-profile'); // 登録画面へ強制送還
        } else {
          setIsAuthorized(true);
        }
        return;
      }

      // すべて登録済み（既存ユーザー）の場合
      if (isPublicPath || pathname === '/setup-profile') {
        router.replace('/home'); 
        return;
      }

      setIsAuthorized(true);
    };

    checkAuth();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        if (!publicPaths.includes(pathname)) {
          router.replace('/'); 
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, furigana, attribute, prefecture, goal')
          .eq('id', session.user.id)
          .maybeSingle();

        const isComplete = checkProfileComplete(profile);

        if (!isComplete && pathname !== '/setup-profile') {
          router.replace('/setup-profile');
        } else if (isComplete && (publicPaths.includes(pathname) || pathname === '/setup-profile')) {
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