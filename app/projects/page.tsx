"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Edit2, X, Save, Search } from 'lucide-react';

export default function ProjectsPage() {
  const [user, setUser] = useState<any>(null);
  const [isCoreMember, setIsCoreMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // 検索キーワード用ステート

  const [committees, setCommittees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [majorProjects, setMajorProjects] = useState<any[]>([]);
  const [allSubProjects, setAllSubProjects] = useState<any[]>([]); // 検索用の全小プロジェクト

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase.from('profiles').select('is_core_member').eq('id', session.user.id).single();
      if (profile?.is_core_member) setIsCoreMember(true);
    }

    const { data: cData } = await supabase.from('policy_committees').select('*');
    const { data: bData } = await supabase.from('local_branches').select('*');
    const { data: mData } = await supabase.from('major_projects').select('*');
    const { data: pData } = await supabase.from('projects').select('*'); // 第3層（小プロジェクト）も全て取得

    if (cData) setCommittees(cData);
    if (bData) setBranches(bData);
    if (mData) setMajorProjects(mData);
    if (pData) setAllSubProjects(pData);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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

  // 検索処理：全テーブルから名前にキーワードが含まれるものを抽出
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    const matchedCommittees = committees.filter(c => c.name.toLowerCase().includes(query)).map(c => ({ ...c, href: `/projects/committee/${c.id}`, badge: '政策委員会' }));
    const matchedBranches = branches.filter(b => b.name.toLowerCase().includes(query)).map(b => ({ ...b, href: `/projects/branch/${b.id}`, badge: '地方支部' }));
    const matchedMajors = majorProjects.filter(m => m.name.toLowerCase().includes(query)).map(m => ({ ...m, href: `/projects/major/${m.id}`, badge: '大プロジェクト' }));
    const matchedSubs = allSubProjects.filter(p => p.name.toLowerCase().includes(query)).map(p => ({ ...p, href: `/projects/detail/${p.id}`, badge: p.parent_name }));

    return sortAndFilter([...matchedCommittees, ...matchedBranches, ...matchedMajors, ...matchedSubs]);
  };

  const searchResults = getSearchResults();

  const handleOpenEdit = (section: string, items: any[]) => {
    setEditingSection(section);
    setEditItems(items.map(item => ({ ...item })));
    setNewItemName('');
  };

  const handleItemNameChange = (id: string, newName: string) => {
    setEditItems(prev => prev.map(item => item.id === id ? { ...item, name: newName } : item));
  };

  const handleAddRow = () => {
    if (!newItemName.trim()) return;
    setEditItems(prev => [...prev, { id: 'new_' + Date.now(), name: newItemName.trim(), status: '進行中', isNew: true, created_at: new Date().toISOString() }]);
    setNewItemName('');
  };

  const handleSave = async (section: string) => {
    setIsSaving(true);
    let tableName = section === 'committee' ? 'policy_committees' : section === 'branch' ? 'local_branches' : 'major_projects';
    try {
      for (const item of editItems) {
        if (!item.isNew) await supabase.from(tableName).update({ name: item.name }).eq('id', item.id);
        else await supabase.from(tableName).insert({ name: item.name, status: '進行中' });
      }
      await fetchData();
      setEditingSection(null);
    } catch (err: any) { alert('保存に失敗しました: ' + err.message); } 
    finally { setIsSaving(false); }
  };

  // カードコンポーネント（検索時にわかりやすいよう badge を追加）
  const Card = ({ title, href, isLocked, status, badge }: { title: string, href: string, isLocked?: boolean, status?: string, badge?: string }) => (
    <Link href={href} className={`block p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col gap-1.5 ${status === '終了済み' ? 'opacity-60 bg-gray-50' : ''}`}>
      {badge && <span className="text-[10px] text-gray-500 font-bold truncate">{badge}</span>}
      <div className="flex items-center justify-between">
        <span className={`font-bold text-sm ${status === '終了済み' ? 'text-gray-500' : 'text-gray-900'} truncate mr-2`}>{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {status && (
            <span className={`text-[10px] px-2 py-0.5 rounded font-normal ${
              status === '進行中' ? 'bg-green-100 text-green-700' : 
              status === '停止中' ? 'bg-orange-100 text-orange-700' : 
              'bg-gray-200 text-gray-600'
            }`}>
              {status}
            </span>
          )}
          {isLocked && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">🔒 非公開</span>}
        </div>
      </div>
    </Link>
  );

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">読み込み中...</div>;

  const secretariatProject = majorProjects.find(p => p.name === '事務局機能');
  const directOtherProject = majorProjects.find(p => p.name === '直轄・その他プロジェクト');
  const regularMajorProjects = majorProjects.filter(p => p.name !== '事務局機能' && p.name !== '直轄・その他プロジェクト');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト一覧</h1>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600 hover:text-gray-900 transition">
            <input 
              type="checkbox" 
              checked={showCompleted} 
              onChange={(e) => setShowCompleted(e.target.checked)} 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            終了済みも表示
          </label>
        </div>

        {/* 検索バー */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="プロジェクト名で検索..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 検索キーワードがある場合は検索結果を表示、ない場合は通常の3列グリッドを表示 */}
        {searchQuery.trim() !== '' ? (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold text-gray-700 border-b pb-3 mb-4">
              検索結果（{searchResults.length}件）
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map(item => (
                  <Card key={`${item.badge}_${item.id}`} title={item.name} href={item.href} isLocked={item.is_locked} status={item.status} badge={item.badge} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">「{searchQuery}」に一致するプロジェクトは見つかりませんでした。</p>
            )}
          </section>
        ) : (
          /* 通常の3列グリッド */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* 左列 */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {secretariatProject && (
                  <Card title={secretariatProject.name} href={`/projects/major/${secretariatProject.id}`} isLocked={secretariatProject.is_locked} status={secretariatProject.status} />
                )}
              </div>
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h2 className="text-sm font-bold text-gray-700">地方支部</h2>
                  {isCoreMember && <button onClick={() => handleOpenEdit('branch', branches)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> 編集</button>}
                </div>
                <div className="flex flex-col gap-3">
                  {sortAndFilter(branches).map((branch) => (
                    <Card key={branch.id} title={branch.name} href={`/projects/branch/${branch.id}`} isLocked={branch.is_locked} status={branch.status} />
                  ))}
                </div>
              </section>
            </div>

            {/* 中央列 */}
            <div className="flex flex-col gap-6">
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h2 className="text-sm font-bold text-gray-700">政策委員会</h2>
                  {isCoreMember && <button onClick={() => handleOpenEdit('committee', committees)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> 編集</button>}
                </div>
                <div className="flex flex-col gap-3">
                  {sortAndFilter(committees).map((committee) => {
                    const displayName = committee.name.includes('政策委員会') ? committee.name : `${committee.name}政策委員会`;
                    return <Card key={committee.id} title={displayName} href={`/projects/committee/${committee.id}`} isLocked={committee.is_locked} status={committee.status} />;
                  })}
                </div>
              </section>
            </div>

            {/* 右列 */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {directOtherProject && (
                  <Card title={directOtherProject.name} href={`/projects/major/${directOtherProject.id}`} isLocked={directOtherProject.is_locked} status={directOtherProject.status} />
                )}
              </div>
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h2 className="text-sm font-bold text-gray-700">大プロジェクト</h2>
                  {isCoreMember && <button onClick={() => handleOpenEdit('major', regularMajorProjects)} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> 編集</button>}
                </div>
                <div className="flex flex-col gap-3">
                  {sortAndFilter(regularMajorProjects).map((major) => (
                    <Card key={major.id} title={major.name} href={`/projects/major/${major.id}`} isLocked={major.is_locked} status={major.status} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 編集モーダル */}
        {editingSection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-900">{editingSection === 'committee' ? '政策委員会の編集' : editingSection === 'branch' ? '地方支部の編集' : '大プロジェクトの編集'}</h3>
                <button onClick={() => setEditingSection(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {editItems.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <input type="text" value={item.name} onChange={(e) => handleItemNameChange(item.id, e.target.value)} className="flex-1 border border-gray-300 p-2 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t flex gap-2">
                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="新しい名前を入力" className="flex-1 border border-gray-300 p-2 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="button" onClick={handleAddRow} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition"><Plus className="w-4 h-4"/> 追加</button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
                <button onClick={() => handleSave(editingSection)} disabled={isSaving} className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"><Save className="w-4 h-4 inline-block mr-1"/> 保存</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}