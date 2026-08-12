"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    // すでにログインしているかチェック
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        verifyDomainAndRedirect(session.user);
      }
    };
    checkUser();
    
    // ログイン処理が完了した瞬間を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
         verifyDomainAndRedirect(session.user);
      }
    });
    
    return () => authListener.subscription.unsubscribe();
  }, [router]);

  // ドメインをチェックする関数
  const verifyDomainAndRedirect = async (user: any) => {
    const email = user.email || '';
    if (email.endsWith('@japanyouthcouncil.com')) {
      router.push('/'); // OKならHomeへ
    } else {
      // 不正なドメインなら強制ログアウト
      await supabase.auth.signOut();
      setError('@japanyouthcouncil.com ドメインのGoogleアカウントのみログイン可能です。');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`, // 判定させるために一旦ここに戻す
        queryParams: {
          hd: 'japanyouthcouncil.com' // Google側の画面でドメインを限定させる（UIの親切設計）
        }
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full text-center border border-gray-100">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">JYC Portal</h1>
        <p className="text-gray-500 text-sm mb-8 font-medium">運営メンバー専用システム</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md mb-6 font-bold text-left">
            {error}
          </div>
        )}
        
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          <b>@japanyouthcouncil.com</b> の<br />
          Googleアカウントでログインしてください。
        </p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center shadow-sm"
        >
          {/* GoogleのGアイコン */}
          <svg className="w-5 h-5 mr-3 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="currentColor">
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Googleでログイン
        </button>
      </div>
    </div>
  );
}