"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname(); // 現在のURLを取得
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ログイン状態の確認
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoading(false);
    };
    checkUser();

    // ログイン・ログアウトが起きた時にヘッダーを自動更新する監視
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  // ログイン画面（/login）ではヘッダーを非表示にする
  if (pathname === '/login') return null;

  // メニューの青線（アクティブ状態）を判定する関数
  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center space-x-8">
        <h1 className="text-xl font-bold text-blue-900">JYC Portal</h1>
        <nav className="flex space-x-4">
          <Link href="/" className={`font-medium ${isActive('/') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600'}`}>
            Home
          </Link>
          <Link href="/knowledge" className={`font-medium ${isActive('/knowledge') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600'}`}>
            政策ナレッジ
          </Link>
          <Link href="/contacts" className={`font-medium ${isActive('/contacts') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600'}`}>
            コンタクト履歴
          </Link>
          <Link href="/projects" className={`font-medium ${isActive('/projects') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600'}`}>
            プロジェクト進捗
          </Link>
        </nav>
      </div>
      
      {/* ログイン状態に応じた表示 */}
      <div className="flex items-center space-x-4">
        {!isLoading && user ? (
          <>
            <div className="flex items-center bg-gray-100 rounded-full pl-1 pr-3 py-1 border border-gray-200">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="icon" className="w-6 h-6 rounded-full mr-2" />
              ) : (
                <div className="w-6 h-6 rounded-full mr-2 bg-blue-500 flex items-center justify-center text-white text-xs">
                  {user.user_metadata?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-sm font-bold text-gray-700">{user.user_metadata?.full_name || '名称未設定'}</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-600 transition">
              ログアウト
            </button>
          </>
        ) : !isLoading && !user ? (
          <Link href="/login" className="text-sm font-bold bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition shadow-sm">
            ログイン
          </Link>
        ) : null}
      </div>
    </header>
  );
}