"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, MessagesSquare, KanbanSquare, Users } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  // 画面のチラつき防止
  if (isLoading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-400 font-bold">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
        
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900">JYC Portal へようこそ</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">日本若者協議会のメンバー専用システムです。各メニューからアクセスしてください。</p>
        </div>

        {/* 4つの主要メニューへのリンクカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link href="/members" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all group block">
            <Users className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-900">メンバー自己紹介</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">メンバーのプロフィールや所属プロジェクト、活動地域などを確認できます。</p>
          </Link>

          <Link href="/projects" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-300 transition-all group block">
            <KanbanSquare className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-900">プロジェクト一覧</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">政策委員会、地方支部、各種プロジェクトの概要を共有します。</p>
          </Link>

          <Link href="/advocacy" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-300 transition-all group block">
            <MessagesSquare className="w-10 h-10 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-900">コンタクト履歴</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">政党や省庁、各種団体への提言活動や交渉のログ・議事録を記録・共有します。</p>
          </Link>

          <Link href="/knowledge" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-300 transition-all group block">
            <BookOpen className="w-10 h-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-900">政策ナレッジ</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">政策テーマ別のドキュメント、マニュアル、ノウハウなどの情報を管理します。（準備中）</p>
          </Link>
          
        </div>
      </main>
    </div>
  );
}