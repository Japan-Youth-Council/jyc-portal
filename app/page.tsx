"use client";

import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      alert('ログインに失敗しました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* メインコンテナ：全体をまとめる枠 */}
      <div className="w-full max-w-xl space-y-6">
        
        {/* 上部ブロック：アプリの説明 */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center">
          <h1 className="text-3xl font-bold text-black mb-4">JYC Portal</h1>
          <p className="text-black text-sm sm:text-base leading-relaxed font-bold">
            JYC Portalは、日本若者協議会（Japan Youth Council）のメンバー専用のプロジェクト・タスク管理システムです。<br />
            政策委員会や地方支部、各プロジェクトの進行状況を一元管理し、メンバー間の円滑なコミュニケーションと活動を支援します。
          </p>
        </div>

        {/* 下部ブロック：ログインと各種リンク */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <h2 className="text-lg font-bold text-black mb-6">ログインして始める</h2>
          
          <div className="flex justify-center mb-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full max-w-sm flex items-center justify-center gap-3 bg-white border border-gray-300 text-black font-bold py-3.5 px-6 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              {/* GoogleのGマークアイコン */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              {isLoading ? '接続中...' : 'Googleアカウントでログイン'}
            </button>
          </div>

          {/* フッターリンク群（利用規約とプライバシーポリシー） */}
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500">
            <Link href="/terms" className="hover:text-black hover:underline transition">
              利用規約
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-black hover:underline transition">
              プライバシーポリシー
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}