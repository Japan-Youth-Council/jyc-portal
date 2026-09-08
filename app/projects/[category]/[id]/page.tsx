"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Edit2, Save, X, Plus, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CategoryProjectPage({ params }: { params: Promise<{ category: string, id: string }> }) {
  const resolvedParams = use(params);
  const { category, id } = resolvedParams;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isCoreMember, setIsCoreMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 終了済みを表示するかどうかの状態
  const [showCompleted, setShowCompleted] = useState(false);

  const [parentData, setParentData] = useState<any>(null);
  const [subProjects, setSubProjects] = useState<any[]>([]);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescText, setEditDescText] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const [isSubProjectModalOpen, setIsSubProjectModalOpen] = useState(false);
  const [editSubItems, setEditSubItems] = useState<any[]>([]);
  const [newSubItemName, setNewSubItemName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getTableInfo = () => {
    if (category === 'committee') return { table: 'policy_committees', parentType: '政策委員会', label: '政策委員会' };
    if (category === 'branch') return { table: 'local_branches', parentType: '地方支部', label: '地方支部' };
    if (category === 'major') return { table: 'major_projects', parentType: '大プロジェクト', label: '大プロジェクト' };
    return { table: '', parentType: '', label: '' };
  };

  const { table, parentType, label } = getTableInfo();

  const fetchData = async () => {
    if (!table) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase.from('profiles').select('is_core_member').eq('id', session.user.id).single();
      if (profile?.is_core_member) setIsCoreMember(true);
    }

    const { data: parent } = await supabase.from(table).select('*').eq('id', id).single();
    if (parent) {
      setParentData(parent);
      setEditDescText(parent.description || '');

      const { data: subs } = await supabase.from('projects')
        .select('*')
        .eq('parent_type', parentType)
        .eq('parent_name', parent.name);
      
      if (subs) setSubProjects(subs);
    } else {
      router.push('/projects');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [category, id]);

  // ▼ ステータス順（進行中→停止中→終了済み）＆ 新しい順 に並び替え、非表示フィルターをかける関数
  const sortAndFilter = (items: any[]) => {
    const statusWeight: Record<string, number> = { '進行中': 1, '停止中': 2, '終了済み': 3 };
    
    return items
      .filter(item => showCompleted || item.status !== '終了済み')
      .sort((a, b) => {
        if (statusWeight[a.status] !== statusWeight[b.status]) {
          return (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  };

  const handleSaveDesc = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('projects').update({ description: editDescText }).eq('id', projectData.id);
        if (error) throw error;
      setParentData({ ...parentData, description: editDescText });
      setIsEditingDesc(false);
    } catch (err) { alert('保存に失敗しました'); } 
    finally { setIsSaving(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsEditingStatus(false);
    if (parentData.status === newStatus) return;
    try {
      await supabase.from(table).update({ status: newStatus }).eq('id', parentData.id);
      setParentData({ ...parentData, status: newStatus });
    } catch (err) { alert('ステータスの更新に失敗しました'); }
  };

  const handleOpenSubEdit = () => {
    setEditSubItems(subProjects.map(p => ({ ...p })));
    setNewSubItemName('');
    setIsSubProjectModalOpen(true);
  };

  const handleSaveSubProjects = async () => {
    setIsSaving(true);
    try {
      for (const item of editSubItems) {
        if (!item.isNew) await supabase.from('projects').update({ name: item.name }).eq('id', item.id);
        else await supabase.from('projects').insert({ name: item.name, parent_type: parentType, parent_name: parentData.name, status: '進行中' });
      }
      await fetchData();
      setIsSubProjectModalOpen(false);
    } catch (err) { alert('保存に失敗しました'); } 
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">読み込み中...</div>;
  if (!parentData) return null;

  const displayName = parentData.name.includes(label) || label === '地方支部' ? parentData.name : `${parentData.name}${label}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <nav className="text-sm font-bold text-gray-500 flex gap-2">
          <Link href="/projects" className="hover:text-blue-600">プロジェクト一覧</Link>
          <span>/</span>
          <span className="text-gray-900">{displayName}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            {parentData.is_locked && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">🔒 非公開</span>}
          </div>
          
          <div className="relative">
            {isCoreMember ? (
              <button onClick={() => setIsEditingStatus(!isEditingStatus)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition ${parentData.status === '進行中' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : parentData.status === '停止中' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                {parentData.status} <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            ) : (
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${parentData.status === '進行中' ? 'bg-green-50 text-green-700 border-green-200' : parentData.status === '停止中' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{parentData.status}</span>
            )}
            
            {isEditingStatus && isCoreMember && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                {['進行中', '停止中', '終了済み'].map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)} className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h2 className="text-base font-bold text-gray-800">プロジェクトの概要・リンク</h2>
            {isCoreMember && !isEditingDesc && (
              <button onClick={() => setIsEditingDesc(true)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> 編集</button>
            )}
          </div>

          {isEditingDesc ? (
            <div className="space-y-3">
              <textarea value={editDescText} onChange={(e) => setEditDescText(e.target.value)} placeholder="目的、活動内容、Slack等のURLを自由に入力してください。" rows={6} className="w-full border border-gray-300 p-3 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsEditingDesc(false); setEditDescText(parentData.description || ''); }} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
                <button onClick={handleSaveDesc} disabled={isSaving} className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"><Save className="w-4 h-4"/> 保存</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {parentData.description ? parentData.description : <span className="text-gray-400 italic">概要やリンクはまだ設定されていません。</span>}
            </div>
          )}
        </section>

        {/* 含まれる小プロジェクト一覧 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h2 className="text-base font-bold text-gray-800">含まれる小プロジェクト</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900 transition">
                <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                終了済みも表示
              </label>
              {isCoreMember && (
                <button onClick={handleOpenSubEdit} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> 編集・追加</button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortAndFilter(subProjects).length > 0 ? (
              sortAndFilter(subProjects).map(sub => (
                <Link key={sub.id} href={`/projects/detail/${sub.id}`} className={`block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-sm hover:border-blue-400 transition-all ${sub.status === '終了済み' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm ${sub.status === '終了済み' ? 'text-gray-500' : 'text-gray-900'}`}>{sub.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-normal ${sub.status === '進行中' ? 'bg-green-100 text-green-700' : sub.status === '停止中' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>{sub.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400">表示できる小プロジェクトはありません。</p>
            )}
          </div>
        </section>

        {isSubProjectModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-900">小プロジェクトの編集</h3>
                <button onClick={() => setIsSubProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {editSubItems.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <input type="text" value={item.name} onChange={(e) => setEditSubItems(prev => prev.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} className="flex-1 border border-gray-300 p-2 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t flex gap-2">
                <input type="text" value={newSubItemName} onChange={(e) => setNewSubItemName(e.target.value)} placeholder="新しい小プロジェクトを追加" className="flex-1 border border-gray-300 p-2 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="button" onClick={() => {
                  if (!newSubItemName.trim()) return;
                  setEditSubItems(prev => [...prev, { id: 'new_' + Date.now(), name: newSubItemName.trim(), status: '進行中', isNew: true, created_at: new Date().toISOString() }]);
                  setNewSubItemName('');
                }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition"><Plus className="w-4 h-4"/> 追加</button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setIsSubProjectModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
                <button onClick={handleSaveSubProjects} disabled={isSaving} className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Save className="w-4 h-4 inline-block mr-1"/> 保存</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}