"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Project, ProjectUpdate } from '@/types/database';
import { MessagesSquare, ListTree, Plus, User, CheckCircle2, PauseCircle, PlayCircle, Filter, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeView, setActiveView] = useState<'dashboard' | 'list'>('list');
  const [projects, setProjects] = useState<Project[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  
  // 未ログイン時の名前手入力用
  const [currentAuthorName, setCurrentAuthorName] = useState('');

  const [showCompleted, setShowCompleted] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', parent_id: '' });
  const [newUpdate, setNewUpdate] = useState({ project_id: '', content: '' });
  const [filterProjectId, setFilterProjectId] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // ログインしていれば自動で名前をセット
        setCurrentAuthorName(session.user.user_metadata?.full_name || '名称未設定');
      }
      setIsLoading(false);
    };
    checkAuth();
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentAuthorName('');
  };

  const fetchData = async () => {
    const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: true });
    const { data: uData } = await supabase.from('project_updates').select('*').order('created_at', { ascending: false });
    if (pData) setProjects(pData);
    if (uData) setUpdates(uData);
  };

  const parentProjects = projects.filter(p => p.parent_id === null);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    const parentId = newProject.parent_id ? parseInt(newProject.parent_id) : null;
    const { data } = await supabase.from('projects').insert([{ title: newProject.title, parent_id: parentId, status: 'active' }]).select();
    if (data) {
      setProjects([...projects, data[0]]);
      setIsAddingProject(false);
      setNewProject({ title: '', parent_id: '' });
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
    await supabase.from('projects').update({ status: newStatus }).eq('id', id);
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.project_id || !newUpdate.content.trim()) return;
    
    // 名前が空欄なら警告（未ログイン時用）
    if (!currentAuthorName.trim()) {
      alert('作業者名を入力してください');
      return;
    }

    const { data } = await supabase.from('project_updates').insert([
      { project_id: parseInt(newUpdate.project_id), content: newUpdate.content, author_name: currentAuthorName }
    ]).select();
    
    if (data) {
      setUpdates([data[0], ...updates]);
      setNewUpdate({ ...newUpdate, content: '' });
    }
  };

  const filteredUpdates = updates.filter(update => {
    if (!filterProjectId) return true;
    const fId = parseInt(filterProjectId);
    return update.project_id === fId || projects.some(p => p.parent_id === fId && p.id === update.project_id);
  });

  const renderStatusBadge = (status: string) => {
    if (status === 'active') return <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"><PlayCircle className="w-3 h-3 mr-1"/>進行中</span>;
    if (status === 'paused') return <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded"><PauseCircle className="w-3 h-3 mr-1"/>休止中</span>;
    return <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1"/>終了</span>;
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-gray-400">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <div className="bg-white border-b py-3 flex justify-center sticky top-[61px] z-10 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveView('list')} className={`flex items-center px-6 py-2 rounded-md text-sm font-bold transition-all ${activeView === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><ListTree className="w-4 h-4 mr-2" />プロジェクト一覧</button>
          <button onClick={() => setActiveView('dashboard')} className={`flex items-center px-6 py-2 rounded-md text-sm font-bold transition-all ${activeView === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><MessagesSquare className="w-4 h-4 mr-2" />進捗ダッシュボード</button>
        </div>
      </div>

      <main className="flex-1 p-6">
        {activeView === 'list' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-gray-800">プロジェクト全体像</h2>
                <label className="flex items-center text-sm text-gray-600 bg-white border px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={showCompleted} onChange={() => setShowCompleted(!showCompleted)} className="mr-2" />終了したプロジェクトを表示
                </label>
              </div>
              <button onClick={() => setIsAddingProject(!isAddingProject)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700"><Plus className="w-4 h-4 mr-1" /> 新規追加</button>
            </div>
            {isAddingProject && (
              <form onSubmit={handleAddProject} className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">所属（親プロジェクト）</label>
                  <select value={newProject.parent_id} onChange={e => setNewProject({...newProject, parent_id: e.target.value})} className="w-full border rounded p-2 text-sm outline-none">
                    <option value="">(独立したプロジェクト・委員会として作成)</option>
                    {parentProjects.map(p => <option key={p.id} value={p.id}>{p.title} の配下に作成</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1">プロジェクト名</label>
                  <input required type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full border rounded p-2 text-sm outline-none" placeholder="例: 夏季合宿の企画" />
                </div>
                <button type="submit" className="px-6 py-2 bg-gray-800 text-white rounded text-sm font-bold">作成</button>
              </form>
            )}
            <div className="space-y-6">
              {parentProjects.map(parent => {
                const children = projects.filter(p => p.parent_id === parent.id);
                if (!showCompleted && parent.status === 'completed') return null;
                return (
                  <div key={parent.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center"><ChevronRight className="w-5 h-5 text-gray-400 mr-1" />{parent.title}</h3>
                      <select value={parent.status} onChange={e => handleUpdateStatus(parent.id, e.target.value)} className="text-sm border rounded px-2 py-1 bg-white outline-none cursor-pointer">
                        <option value="active">進行中</option><option value="paused">休止中</option><option value="completed">終了</option>
                      </select>
                    </div>
                    <div className="p-4 space-y-3">
                      {children.map(child => {
                        if (!showCompleted && child.status === 'completed') return null;
                        return (
                          <div key={child.id} className="flex justify-between items-center pl-8 py-2 border-l-2 border-gray-100 ml-4 hover:bg-gray-50 rounded transition">
                            <span className="text-gray-700 font-medium">{child.title}</span>
                            <div className="flex items-center space-x-3">
                              {renderStatusBadge(child.status)}
                              <select value={child.status} onChange={e => handleUpdateStatus(child.id, e.target.value)} className="text-xs border rounded px-1 py-0.5 bg-white outline-none text-gray-500 cursor-pointer">
                                <option value="active">進行中へ</option><option value="paused">休止中へ</option><option value="completed">終了へ</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      {children.length === 0 && <p className="text-xs text-gray-400 pl-8 ml-4">紐づく個別プロジェクトはありません。</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'dashboard' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-600">表示切替:</span>
                <select value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)} className="border rounded-full px-3 py-1 bg-white outline-none text-gray-700 shadow-sm">
                  <option value="">すべての投稿を表示</option>
                  {parentProjects.map(p => (
                    <optgroup key={p.id} label={`▼ ${p.title}`}>
                      <option value={p.id}>{p.title} (全体)</option>
                      {projects.filter(child => child.parent_id === p.id).map(c => <option key={c.id} value={c.id}> └ {c.title}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              {/* ログイン・未ログインでの表示切り替え */}
              {user ? (
                <div className="flex items-center border rounded-full px-3 py-1.5 text-sm bg-gray-100 border-gray-200 shadow-sm">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-700 font-bold">{currentAuthorName} として投稿</span>
                </div>
              ) : (
                <div className="flex items-center border rounded-full px-3 py-1 text-sm bg-red-50 border-red-200 shadow-sm">
                  <User className="w-4 h-4 mr-2 text-red-500" />
                  <input 
                    type="text" placeholder="作業者名を入力 (必須)" 
                    value={currentAuthorName} onChange={e => setCurrentAuthorName(e.target.value)} 
                    className="bg-transparent outline-none w-36 placeholder-red-300 font-bold" 
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitUpdate} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-3">進捗を報告する</h3>
              <div className="space-y-3">
                <select required value={newUpdate.project_id} onChange={e => setNewUpdate({...newUpdate, project_id: e.target.value})} className="w-full border-b pb-2 text-sm outline-none bg-transparent font-bold text-blue-700">
                  <option value="">紐づけるプロジェクトを選択...</option>
                  {parentProjects.map(p => (
                    <optgroup key={p.id} label={`【大枠】${p.title}`}>
                      <option value={p.id}>{p.title} 全体への報告</option>
                      {projects.filter(child => child.parent_id === p.id).map(c => <option key={c.id} value={c.id}> └ {c.title} への報告</option>)}
                    </optgroup>
                  ))}
                </select>
                <textarea required value={newUpdate.content} onChange={e => setNewUpdate({...newUpdate, content: e.target.value})} placeholder="いまどんな作業をしている？進捗や課題は？" className="w-full h-20 p-3 border rounded-md outline-none focus:border-blue-500 text-sm resize-y bg-gray-50" />
                <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold text-sm hover:bg-blue-700">投稿する</button></div>
              </div>
            </form>

            <div className="space-y-4">
              {filteredUpdates.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><MessagesSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>表示する進捗投稿がありません。</p></div>
              ) : (
                filteredUpdates.map(update => {
                  const targetProject = projects.find(p => p.id === update.project_id);
                  return (
                    <div key={update.id} className="bg-white p-5 rounded-xl border shadow-sm flex gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0"><User className="w-5 h-5" /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-bold text-gray-800 mr-2">{update.author_name}</span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{targetProject?.title || '不明'}</span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(update.created_at).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap leading-relaxed">{update.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}