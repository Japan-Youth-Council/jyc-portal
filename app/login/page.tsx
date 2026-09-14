"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // すでにログインしている場合はホーム画面へ
      if (session?.user) router.push('/');
    };
    checkUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    // Googleログイン画面へリダイレクト
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // ログイン成功後に元のサイト（ホーム画面）に戻ってくるための設定
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      alert("ログインに失敗しました。");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">JYC Portal</h1>
          <p className="text-gray-600 text-sm mt-2 font-bold">運営メンバー専用システム</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-6 font-medium text-center">
            JYC Portalに参加するには、お持ちのGoogleアカウントでログインしてください。
          </p>
          
          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full bg-white border-2 border-gray-200 text-gray-800 font-bold py-3.5 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
          >
            {/* GoogleのGマークアイコンを簡易的に配置 */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.81 15.74 17.58V20.34H19.3C21.38 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.3 20.34L15.74 17.58C14.75 18.25 13.48 18.65 12 18.65C9.13 18.65 6.7 16.71 5.82 14.11H2.15V16.96C3.96 20.55 7.69 23 12 23Z" fill="#34A853"/>
              <path d="M5.82 14.11C5.59 13.44 5.46 12.73 5.46 12C5.46 11.27 5.59 10.56 5.82 9.89V7.04H2.15C1.4 8.53 1 10.22 1 12C1 13.78 1.4 15.47 2.15 16.96L5.82 14.11Z" fill="#FBBC05"/>
              <path d="M12 5.35C13.62 5.35 15.06 5.91 16.2 7.01L19.37 3.84C17.45 2.05 14.96 1 12 1C7.69 1 3.96 3.45 2.15 7.04L5.82 9.89C6.7 7.29 9.13 5.35 12 5.35Z" fill="#EA4335"/>
            </svg>
            {isLoading ? '接続中...' : 'Googleでログイン・新規登録'}
          </button>
        </div>
      </div>
    </div>
  );
}