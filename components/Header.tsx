"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // スマホ用の全体メニュー開閉
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // PC用・スマホ用のユーザー設定ドロップダウン開閉
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // ページ移動時に各種メニューを閉じる
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // PC版ドロップダウンを外側クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
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
          <Link href="/members" className={`font-medium ${isActive('/members') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>メンバー自己紹介</Link>
          <Link href="/projects" className={`font-medium ${isActive('/projects') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>プロジェクト一覧</Link>          
          <Link href="/contacts" className={`font-medium ${isActive('/contacts') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>コンタクト履歴</Link>
          <Link href="/knowledge" className={`font-medium ${isActive('/knowledge') ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-1' : 'text-gray-500 hover:text-blue-600 border-b-2 border-transparent pb-1'}`}>政策ナレッジ</Link>

        </nav>

        {/* ユーザー情報＆スマホ用メニューボタン */}
        <div className="flex items-center space-x-3">
          
          {/* パソコン用のユーザー表示（ドロップダウン） */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && user ? (
              <div className="relative" ref={userMenuRef}>
                {/* ユーザー名ボタン（画像なし・名前のみ） */}
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center hover:bg-gray-100 transition rounded-md px-3 py-1.5 outline-none"
                >
                  <span className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{user.user_metadata?.full_name || '名称未設定'}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 ml-1 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 展開されるメニュー */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2">
                    <Link 
                      href="/profile" 
                      onClick={() => setIsUserMenuOpen(false)} 
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
                    >
                      <User className="w-4 h-4 text-gray-400" /> プロフィール設定
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" /> ログアウト
                    </button>
                  </div>
                )}
              </div>
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

      {/* スマホ用の全体ドロップダウンメニュー */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-lg flex flex-col p-5 space-y-6 animate-in slide-in-from-top-2">
          
          <nav className="flex flex-col space-y-5 border-b pb-6">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`text-base font-bold ${isActive('/') ? 'text-blue-600' : 'text-gray-700'}`}>Home</Link>
            <Link href="/members" onClick={() => setIsMobileMenuOpen(false)} className={`text-base font-bold ${isActive('/members') ? 'text-blue-600' : 'text-gray-700'}`}>メンバー自己紹介</Link>
            <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className={`text-base font-bold ${isActive('/projects') ? 'text-blue-600' : 'text-gray-700'}`}>プロジェクト一覧</Link>
            <Link href="/contacts" onClick={() => setIsMobileMenuOpen(false)} className={`text-base font-bold ${isActive('/contacts') ? 'text-blue-600' : 'text-gray-700'}`}>コンタクト履歴</Link>
            <Link href="/knowledge" onClick={() => setIsMobileMenuOpen(false)} className={`text-base font-bold ${isActive('/knowledge') ? 'text-blue-600' : 'text-gray-700'}`}>政策ナレッジ</Link>
          </nav>
          
          {/* スマホ用のユーザー表示（アコーディオン） */}
          <div className="flex flex-col gap-2">
            {!isLoading && user ? (
              <>
                {/* ユーザー名ボタン（画像なし・名前のみ） */}
                <button 
                  onClick={() => setIsMobileUserMenuOpen(!isMobileUserMenuOpen)}
                  className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 active:bg-gray-200 transition outline-none"
                >
                  <span className="text-base font-bold text-gray-800 truncate">{user.user_metadata?.full_name || '名称未設定'}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isMobileUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* 展開されるメニュー */}
                {isMobileUserMenuOpen && (
                  <div className="flex flex-col gap-1 px-2 animate-in fade-in slide-in-from-top-1">
                    <Link 
                      href="/profile" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="flex items-center gap-3 px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-md transition"
                    >
                      <User className="w-4 h-4 text-gray-400" /> プロフィール設定
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center gap-3 px-3 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-md transition text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400" /> ログアウト
                    </button>
                  </div>
                )}
              </>
            ) : !isLoading && !user ? (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center text-sm font-bold bg-blue-600 text-white px-5 py-3 rounded-md shadow-sm">
                ログイン
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}