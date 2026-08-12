"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, MessagesSquare, KanbanSquare } from 'lucide-react';

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh(); // 画面を更新して未ログイン状態を反映
  };

  // 画面のチラつき防止
  if (isLoading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-400">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <main className="flex-1 p-10 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">JYC Portal へようこそ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/knowledge" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group block">
            <BookOpen className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-800">政策ナレッジ</h3>
            <p className="text-sm text-gray-500">政策テーマ別のドキュメントやWikiを管理します。</p>
          </Link>
          <Link href="/advocacy" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group block">
            <MessagesSquare className="w-10 h-10 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-800">提言履歴 (CRM)</h3>
            <p className="text-sm text-gray-500">各政党や省庁への提言・交渉のログを記録します。</p>
          </Link>
          <Link href="/projects" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group block">
            <KanbanSquare className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-2 text-gray-800">プロジェクト進捗</h3>
            <p className="text-sm text-gray-500">団体内のプロジェクトやタスクの進捗状況を共有します。</p>
          </Link>
        </div>
      </main>
    </div>
  );
}