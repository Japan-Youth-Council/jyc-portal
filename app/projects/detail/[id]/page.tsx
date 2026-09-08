"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Edit2, Save, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isCoreMember, setIsCoreMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [projectData, setProjectData] = useState<any>(null);
  const [parentLink, setParentLink] = useState<string>('/projects');

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescText, setEditDescText] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // 権限チェック
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('is_core_member').eq('id', session.user.id).single();
        if (profile?.is_core_member) setIsCoreMember(true);
      }

      // 小プロジェクトのデータ取得
      const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
      
      if (project) {
        setProjectData(project);
        setEditDescText(project.description || '');

        // 親プロジェクトのIDを取得してパンくずリストのリンクを生成
        let parentCategory = '';
        let parentTable = '';
        if (project.parent_type === '政策委員会') { parentCategory = 'committee'; parentTable = 'policy_committees'; }
        else if (project.parent_type === '地方支部') { parentCategory = 'branch'; parentTable = 'local_branches'; }
        else if (project.parent_type === '大プロジェクト') { parentCategory = 'major'; parentTable = 'major_projects'; }

        if (parentTable) {
          const { data: parentData } = await supabase.from(parentTable).select('id').eq('name', project.parent_name).single();
          if (parentData) {
            setParentLink(`/projects/${parentCategory}/${parentData.id}`);
          }
        }
      } else {
        router.push('/projects');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [id, router]);

  // 説明文の保存
  const handleSaveDesc = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('projects').update({ description: editDescText }).eq('id', projectData.id);
        if (error) throw error;
      setProjectData({ ...projectData, description: editDescText });
      setIsEditingDesc(false);
    } catch (err) {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ステータスの変更
  const handleStatusChange = async (newStatus: string) => {
    setIsEditingStatus(false);
    if (projectData.status === newStatus) return;
    try {
      await supabase.from('projects').update({ status: newStatus }).eq('id', projectData.id);
      setProjectData({ ...projectData, status: newStatus });
    } catch (err) {
      alert('ステータスの更新に失敗しました');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">読み込み中...</div>;
  if (!projectData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* パンくずリスト */}
        <nav className="text-sm font-bold text-gray-500 flex flex-wrap items-center gap-2">
          <Link href="/projects" className="hover:text-blue-600 transition">プロジェクト一覧</Link>
          <span>/</span>
          <Link href={parentLink} className="hover:text-blue-600 transition">{projectData.parent_name}</Link>
          <span>/</span>
          <span className="text-gray-900">{projectData.name}</span>
        </nav>

        {/* 1. ヘッダーエリア（タイトルとステータス） */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{projectData.name}</h1>
            {projectData.is_locked && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">🔒 非公開</span>}
          </div>
          
          <div className="relative">
            {isCoreMember ? (
              <button onClick={() => setIsEditingStatus(!isEditingStatus)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition ${projectData.status === '進行中' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : projectData.status === '停止中' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                {projectData.status} <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            ) : (
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${projectData.status === '進行中' ? 'bg-green-50 text-green-700 border-green-200' : projectData.status === '停止中' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {projectData.status}
              </span>
            )}
            
            {/* ステータス変更ドロップダウン */}
            {isEditingStatus && isCoreMember && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                {['進行中', '停止中', '終了済み'].map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)} className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. 概要・説明・リンクエリア */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h2 className="text-base font-bold text-gray-800">プロジェクトの概要・リンク</h2>
            {isCoreMember && !isEditingDesc && (
              <button onClick={() => setIsEditingDesc(true)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5"/> 編集
              </button>
            )}
          </div>

          {isEditingDesc ? (
            <div className="space-y-3">
              <textarea 
                value={editDescText}
                onChange={(e) => setEditDescText(e.target.value)}
                placeholder="小プロジェクトの目的、活動内容、SlackチャンネルのURL、議事録のリンクなどを自由に入力してください。"
                rows={6}
                className="w-full border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsEditingDesc(false); setEditDescText(projectData.description || ''); }} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition">キャンセル</button>
                <button onClick={handleSaveDesc} disabled={isSaving} className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition"><Save className="w-4 h-4"/> 保存</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {projectData.description ? projectData.description : <span className="text-gray-400 italic">概要やリンクはまだ設定されていません。</span>}
            </div>
          )}
        </section>
        
        {/* 将来的にここにタスク管理コンポーネントが追加されます */}

      </div>
    </div>
  );
}