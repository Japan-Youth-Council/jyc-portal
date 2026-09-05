"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // URLにアクセストークン（再設定の許可証）が含まれているかチェック
    // Supabaseはメールリンクからの遷移時、自動的にセッションを復元してくれます
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('リンクの有効期限が切れているか、無効なURLです。もう一度ログイン画面から再設定リクエストを行ってください。');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 新しいパスワードをSupabaseに送信して更新
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      // 更新成功後、自動的にホーム画面へ移動
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">新しいパスワードの設定</h2>
        </div>

        {success ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">パスワードを更新しました！</h3>
            <p className="text-sm text-gray-600 mb-6">自動的にホーム画面へ移動します...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-800 text-sm p-4 rounded font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">新しいパスワード</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                minLength={6} 
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="6文字以上の英数字" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !!error} 
              className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isLoading ? '更新中...' : 'パスワードを保存する'}
              {!isLoading && <ArrowRight className="w-4 h-4"/>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}