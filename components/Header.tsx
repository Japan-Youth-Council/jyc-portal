"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react'; // ★アイコンを追加

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // ★スマホメニュー開閉用

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // ページ移動時にスマホメニューを閉じる
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMobileMenuOpen(false);
    router.refresh();
  };

  if (pathname === '/login') return null;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        {/* ロゴ */}
        <h1 className="text-lg md:text-xl font-bold text-blue-900">JYC Portal</h1>

        {/* パソコン用のナビゲーション（スマホでは非表示） */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className={`font-medium ${isActive('/') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>Home</Link>
          <Link href="/knowledge" className={`font-medium ${isActive('/knowledge') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>政策ナレッジ</Link>
          <Link href="/contacts" className={`font-medium ${isActive('/contacts') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>コンタクト履歴</Link>
          <Link href="/projects" className={`font-medium ${isActive('/projects') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>プロジェクト進捗</Link>
        </nav>

        {/* ユーザー情報＆スマホ用メニューボタン */}
        <div className="flex items-center space-x-3">
          {/* パソコン用のユーザー表示 */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && user ? (
              <>
                <div className="flex items-center bg-gray-100 rounded-full pl-1 pr-3 py-1 border border-gray-200">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="icon" className="w-7 h-7 rounded-full mr-2 shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full mr-2 bg-blue-500 flex items-center justify-center text-white text-xs shrink-0">
                      {user.user_metadata?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{user.user_metadata?.full_name || '名称未設定'}</span>
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-600 transition">ログアウト</button>
              </>
            ) : !isLoading && !user ? (
              <Link href="/login" className="text-sm font-bold bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition shadow-sm">ログイン</Link>
            ) : null}
          </div>

          {/* スマホ用のハンバーガーメニューボタン */}
          <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* スマホ用のドロップダウンメニュー */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-lg flex flex-col p-5 space-y-5 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-4">
            <Link href="/" className={`text-base font-bold ${isActive('/') ? 'text-blue-600' : 'text-gray-700'}`}>Home</Link>
            <Link href="/knowledge" className={`text-base font-bold ${isActive('/knowledge') ? 'text-blue-600' : 'text-gray-700'}`}>政策ナレッジ</Link>
            <Link href="/contacts" className={`text-base font-bold ${isActive('/contacts') ? 'text-blue-600' : 'text-gray-700'}`}>コンタクト履歴</Link>
            <Link href="/projects" className={`text-base font-bold ${isActive('/projects') ? 'text-blue-600' : 'text-gray-700'}`}>プロジェクト進捗</Link>
          </nav>
          
          <div className="pt-5 border-t flex items-center justify-between">
            {!isLoading && user ? (
              <>
                <div className="flex items-center">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="icon" className="w-8 h-8 rounded-full mr-2 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full mr-2 bg-blue-500 flex items-center justify-center text-white text-xs shrink-0">
                      {user.user_metadata?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-700 truncate">{user.user_metadata?.full_name || '名称未設定'}</span>
                </div>
                <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700">ログアウト</button>
              </>
            ) : !isLoading && !user ? (
              <Link href="/login" className="w-full text-center text-sm font-bold bg-blue-600 text-white px-5 py-3 rounded-md shadow-sm">ログイン</Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}