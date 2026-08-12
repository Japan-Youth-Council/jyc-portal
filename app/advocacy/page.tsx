"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdvocacyTarget, AdvocacyLog } from '@/types/database';
import { Plus, Search, Calendar, Users, FileText, UploadCloud, MessageSquare, X, ChevronDown, ChevronRight, Edit2, GripVertical, Link as LinkIcon, User } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['国政', '地方', '中央行政', '対個人', 'その他'];

export default function AdvocacyPage() {
  const [targets, setTargets] = useState<AdvocacyTarget[]>([]);
  const [logs, setLogs] = useState<AdvocacyLog[]>([]);
  
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [searchTargetQuery, setSearchTargetQuery] = useState('');
  
  // 入力時の名前保持用（リロードするまで記憶して入力を楽にする）
  const [currentAuthorName, setCurrentAuthorName] = useState('');

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ '国政': true, '地方': true });
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>({});

  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState({ category: '国政', region: '', name: '' });
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [editingTargetName, setEditingTargetName] = useState('');
  const [draggedTargetId, setDraggedTargetId] = useState<number | null>(null);

  // 新規ログ投稿用
  const [newLog, setNewLog] = useState({ 
    title: '', action_date: new Date().toISOString().split('T')[0], members: '', summary: '', minutes_url: '', file_url: '' 
  });

  // ログ編集用
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLogData, setEditLogData] = useState<Partial<AdvocacyLog>>({});

  useEffect(() => { fetchTargets(); }, []);
  useEffect(() => {
    if (selectedTargetId) fetchLogs(selectedTargetId);
    else setLogs([]);
  }, [selectedTargetId]);

  const fetchTargets = async () => {
    const { data } = await supabase.from('advocacy_targets').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
    if (data) setTargets(data);
  };

  const fetchLogs = async (targetId: number) => {
    const { data } = await supabase.from('advocacy_logs').select('*').eq('target_id', targetId).order('action_date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setLogs(data);
  };

  // --- 提言先の操作 ---
  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.name.trim()) return;
    const regionValue = newTarget.category === '地方' ? newTarget.region : null;
    const { data } = await supabase.from('advocacy_targets').insert([{ name: newTarget.name, category: newTarget.category, region: regionValue, created_by_name: currentAuthorName || '名無し' }]).select();
    if (data) {
      setTargets([...targets, data[0]]);
      setIsAddingTarget(false);
      setNewTarget({ category: '国政', region: '', name: '' });
      setSelectedTargetId(data[0].id);
      setOpenCategories(prev => ({ ...prev, [newTarget.category]: true }));
      if (regionValue) setOpenRegions(prev => ({ ...prev, [regionValue]: true }));
    }
  };

  const handleEditTargetSubmit = async (id: number) => {
    if (!editingTargetName.trim()) return setEditingTargetId(null);
    const newName = editingTargetName;
    setTargets(targets.map(t => t.id === id ? { ...t, name: newName } : t));
    setEditingTargetId(null);
    await supabase.from('advocacy_targets').update({ name: newName }).eq('id', id);
  };

  const handleDragStart = (e: React.DragEvent, id: number) => { setDraggedTargetId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = async (e: React.DragEvent, dropTargetId: number, groupTargets: AdvocacyTarget[]) => {
    e.preventDefault();
    if (!draggedTargetId || draggedTargetId === dropTargetId) return;
    const draggedIndex = groupTargets.findIndex(t => t.id === draggedTargetId);
    const dropIndex = groupTargets.findIndex(t => t.id === dropTargetId);
    if (draggedIndex === -1 || dropIndex === -1) return;

    const newGroup = [...groupTargets];
    const [draggedItem] = newGroup.splice(draggedIndex, 1);
    newGroup.splice(dropIndex, 0, draggedItem);

    const updatedTargets = targets.map(t => {
      const found = newGroup.find(ng => ng.id === t.id);
      return found ? { ...t, sort_order: newGroup.indexOf(found) } : t;
    });
    updatedTargets.sort((a, b) => a.sort_order - b.sort_order);
    setTargets(updatedTargets);
    setDraggedTargetId(null);

    const updatePromises = newGroup.map((t, idx) => supabase.from('advocacy_targets').update({ sort_order: idx }).eq('id', t.id));
    await Promise.all(updatePromises);
  };

  // --- 交渉ログの操作 ---
  const validateAuthor = (name: string) => {
    if (!name.trim() || name === 'ゲストメンバー') {
      alert('ご自身の名前（記録者名）を正しく入力してください。');
      return false;
    }
    return true;
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId || !newLog.title.trim()) return;
    if (!validateAuthor(currentAuthorName)) return;

    const { data } = await supabase.from('advocacy_logs').insert([{ 
      target_id: selectedTargetId, 
      ...newLog, 
      author_name: currentAuthorName 
    }]).select();

    if (data) {
      setLogs([data[0], ...logs]);
      setNewLog({ title: '', action_date: new Date().toISOString().split('T')[0], members: '', summary: '', minutes_url: '', file_url: '' });
    }
  };

  const handleUpdateLog = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!editLogData.title?.trim()) return;
    if (!validateAuthor(editLogData.author_name || '')) return;

    const { data } = await supabase.from('advocacy_logs').update({
      title: editLogData.title,
      action_date: editLogData.action_date,
      members: editLogData.members,
      summary: editLogData.summary,
      minutes_url: editLogData.minutes_url,
      file_url: editLogData.file_url,
      author_name: editLogData.author_name
    }).eq('id', id).select();

    if (data) {
      setLogs(logs.map(log => log.id === id ? data[0] : log));
      setEditingLogId(null);
    }
  };

  const toggleCategory = (category: string) => setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  const toggleRegion = (region: string) => setOpenRegions(prev => ({ ...prev, [region]: !prev[region] }));

  const filteredTargets = targets.filter(t => t.name.includes(searchTargetQuery) || (t.region && t.region.includes(searchTargetQuery)) || t.category.includes(searchTargetQuery));

  const renderTargetItem = (t: AdvocacyTarget, index: number, groupTargets: AdvocacyTarget[]) => (
    <li 
      key={t.id} className={`group relative flex items-center transition-opacity ${draggedTargetId === t.id ? 'opacity-30' : 'opacity-100'}`}
      draggable onDragStart={(e) => handleDragStart(e, t.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, t.id, groupTargets)} onDragEnd={() => setDraggedTargetId(null)}
    >
      <div className="w-4 h-full flex items-center justify-center text-gray-300 cursor-grab hidden group-hover:flex"><GripVertical className="w-3 h-3" /></div>
      <div className="w-4 h-full flex group-hover:hidden" />
      {editingTargetId === t.id ? (
        <div className="flex flex-1 px-1 py-1 bg-white border rounded shadow-sm z-10">
          <input autoFocus value={editingTargetName} onChange={e => setEditingTargetName(e.target.value)} className="w-full text-sm outline-none" onKeyDown={e => e.key === 'Enter' && handleEditTargetSubmit(t.id)} onBlur={() => handleEditTargetSubmit(t.id)} />
        </div>
      ) : (
        <div className="flex flex-1 relative">
          <button onClick={() => setSelectedTargetId(t.id)} className={`flex-1 text-left px-2 py-1.5 rounded-md text-sm transition pr-8 ${selectedTargetId === t.id ? 'bg-blue-600 text-white font-medium shadow' : 'text-gray-700 hover:bg-gray-100'}`}>
            {t.name}
          </button>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-10">
            <button onClick={(e) => { e.stopPropagation(); setEditingTargetId(t.id); setEditingTargetName(t.name); }} className="p-1 hover:bg-white rounded text-gray-500 shadow-sm border bg-gray-50" title="名前を変更"><Edit2 className="w-3 h-3" /></button>
          </div>
        </div>
      )}
    </li>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r flex flex-col">
          {/* ... 左側サイドバーの内容は前回と同じため省略せずに記述しています ... */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">提言先リスト</h2>
              <button onClick={() => setIsAddingTarget(true)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="提言先や地域を検索..." value={searchTargetQuery} onChange={e => setSearchTargetQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm outline-none focus:border-blue-500 bg-gray-50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {isAddingTarget && (
              <form onSubmit={handleAddTarget} className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-blue-800">新規追加</span><button type="button" onClick={() => setIsAddingTarget(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button></div>
                <div className="space-y-2">
                  <select value={newTarget.category} onChange={e => setNewTarget({ ...newTarget, category: e.target.value })} className="w-full p-1.5 border rounded text-sm outline-none bg-white">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  {newTarget.category === '地方' && <input required placeholder="地域（例: 東京都）" value={newTarget.region} onChange={e => setNewTarget({ ...newTarget, region: e.target.value })} className="w-full p-1.5 border rounded text-sm outline-none" />}
                  <input required placeholder="名称（例: 公明党、〇〇省）" value={newTarget.name} onChange={e => setNewTarget({ ...newTarget, name: e.target.value })} className="w-full p-1.5 border rounded text-sm outline-none" />
                  <button type="submit" className="w-full py-1.5 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">保存</button>
                </div>
              </form>
            )}
            <div className="space-y-6">
              {CATEGORIES.map(category => {
                const catTargets = filteredTargets.filter(t => t.category === category);
                if (catTargets.length === 0) return null;
                return (
                  <div key={category}>
                    <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1.5 rounded mb-1 cursor-pointer hover:bg-gray-200 transition" onClick={() => toggleCategory(category)}>
                      {openCategories[category] ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                      {category} <span className="ml-auto text-gray-400 text-[10px]">{catTargets.length}件</span>
                    </div>
                    {openCategories[category] && (
                      category === '地方' ? (
                        <div className="space-y-2 mt-2">
                          {Array.from(new Set(catTargets.map(t => t.region || 'その他'))).map(region => {
                            const rTargets = catTargets.filter(t => (t.region || 'その他') === region);
                            return (
                              <div key={region} className="ml-2">
                                <div className="flex items-center text-[11px] font-bold text-gray-400 mb-1 cursor-pointer hover:text-gray-600" onClick={() => toggleRegion(region)}>
                                  {openRegions[region] ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}{region}
                                </div>
                                {openRegions[region] && <ul className="border-l-2 border-gray-200 ml-1.5 pl-0.5 space-y-1 mt-1">{rTargets.map((t, index) => renderTargetItem(t, index, rTargets))}</ul>}
                              </div>
                            );
                          })}
                        </div>
                      ) : <ul className="space-y-1 mt-2">{catTargets.map((t, index) => renderTargetItem(t, index, catTargets))}</ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {!selectedTargetId ? (
            <div className="h-full flex items-center justify-center text-gray-400 flex-col">
              <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
              <p>左側のリストから提言先を選択するか、新しく追加してください。</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* 新規投稿フォーム */}
              <form onSubmit={handleSubmitLog} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                  <Plus className="w-4 h-4 mr-1 text-blue-600" /> 新しい交渉・提言ログを記録
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input type="text" required placeholder="提言タイトル・主な要件" value={newLog.title} onChange={e => setNewLog({ ...newLog, title: e.target.value })} className="flex-1 text-lg font-bold outline-none border-b focus:border-blue-500 pb-1 bg-transparent" />
                    <div className="flex items-center text-gray-500 bg-red-50 px-3 py-1.5 rounded-md border border-red-200 text-sm">
                      <User className="w-4 h-4 mr-2 text-red-500" />
                      <input type="text" required placeholder="記録者名 (必須)" value={currentAuthorName} onChange={e => setCurrentAuthorName(e.target.value)} className="bg-transparent outline-none w-32 placeholder-red-300" />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex items-center text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <input type="date" required value={newLog.action_date} onChange={e => setNewLog({ ...newLog, action_date: e.target.value })} className="bg-transparent outline-none" />
                    </div>
                    <div className="flex-1 flex items-center text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border text-sm">
                      <Users className="w-4 h-4 mr-2" />
                      <input type="text" placeholder="参加メンバー（例: 山田、佐藤）" value={newLog.members} onChange={e => setNewLog({ ...newLog, members: e.target.value })} className="bg-transparent outline-none w-full" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 flex items-center text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border text-sm">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      <input type="url" placeholder="議事録のURL (任意)" value={newLog.minutes_url} onChange={e => setNewLog({ ...newLog, minutes_url: e.target.value })} className="bg-transparent outline-none w-full" />
                    </div>
                    <div className="flex-1 flex items-center text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border text-sm">
                      <FileText className="w-4 h-4 mr-2" />
                      <input type="url" placeholder="提言書ファイルのURL (任意)" value={newLog.file_url} onChange={e => setNewLog({ ...newLog, file_url: e.target.value })} className="bg-transparent outline-none w-full" />
                    </div>
                  </div>

                  <textarea placeholder="相手方の反応や、話し合いの簡単な議事メモ..." value={newLog.summary} onChange={e => setNewLog({ ...newLog, summary: e.target.value })} className="w-full h-24 p-3 border rounded-md outline-none focus:border-blue-500 text-sm resize-y" />
                  
                  {/* Google Drive アップロード準備用モック */}
                  <div className="border-2 border-dashed border-gray-200 rounded-md p-3 text-center text-xs text-gray-400 bg-gray-50">
                    <UploadCloud className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                    PDF等を直接アップロードする機能は準備中です。現在は上の欄にURLを直接貼ってください。
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold text-sm hover:bg-blue-700 transition">記録を投稿する</button>
                  </div>
                </div>
              </form>

              {/* タイムライン */}
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">まだこの提言先の記録はありません。</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="bg-white p-5 rounded-xl border shadow-sm relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
                      
                      {editingLogId === log.id ? (
                        /* 編集モードのフォーム */
                        <form onSubmit={(e) => handleUpdateLog(e, log.id)} className="space-y-3">
                          <div className="flex gap-4">
                            <input type="text" required value={editLogData.title} onChange={e => setEditLogData({...editLogData, title: e.target.value})} className="flex-1 text-lg font-bold outline-none border-b focus:border-blue-500 pb-1" />
                            <div className="flex items-center border rounded px-2 py-1 text-sm bg-red-50 border-red-200">
                              <User className="w-3 h-3 mr-1 text-red-500"/>
                              <input type="text" required value={editLogData.author_name} onChange={e => setEditLogData({...editLogData, author_name: e.target.value})} className="w-24 outline-none bg-transparent" placeholder="記録者名" />
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <input type="date" required value={editLogData.action_date} onChange={e => setEditLogData({...editLogData, action_date: e.target.value})} className="border rounded px-2 py-1 text-sm" />
                            <input type="text" placeholder="参加メンバー" value={editLogData.members || ''} onChange={e => setEditLogData({...editLogData, members: e.target.value})} className="flex-1 border rounded px-2 py-1 text-sm" />
                          </div>
                          <div className="flex gap-4">
                            <input type="url" placeholder="議事録URL" value={editLogData.minutes_url || ''} onChange={e => setEditLogData({...editLogData, minutes_url: e.target.value})} className="flex-1 border rounded px-2 py-1 text-sm" />
                            <input type="url" placeholder="ファイルURL" value={editLogData.file_url || ''} onChange={e => setEditLogData({...editLogData, file_url: e.target.value})} className="flex-1 border rounded px-2 py-1 text-sm" />
                          </div>
                          <textarea value={editLogData.summary || ''} onChange={e => setEditLogData({...editLogData, summary: e.target.value})} className="w-full border rounded p-2 text-sm h-20" />
                          <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setEditingLogId(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded">キャンセル</button>
                            <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded font-bold">保存</button>
                          </div>
                        </form>
                      ) : (
                        /* 通常表示モード */
                        <>
                          <button onClick={() => { setEditingLogId(log.id); setEditLogData(log); }} className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded hidden group-hover:block transition">
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <div className="flex justify-between items-start mb-2 pr-8">
                            <h4 className="font-bold text-gray-800 text-lg">{log.title}</h4>
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">{log.action_date}</span>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500 mb-3 space-x-4">
                            <span className="flex items-center"><User className="w-3 h-3 mr-1"/> 記録: {log.author_name}</span>
                            <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> 参加: {log.members || '未記入'}</span>
                          </div>

                          {/* URLリンクの表示 */}
                          {(log.minutes_url || log.file_url) && (
                            <div className="flex gap-4 mb-3">
                              {log.minutes_url && (
                                <a href={log.minutes_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                                  <LinkIcon className="w-3 h-3 mr-1" /> 議事録を見る
                                </a>
                              )}
                              {log.file_url && (
                                <a href={log.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                                  <FileText className="w-3 h-3 mr-1" /> 提言書ファイル
                                </a>
                              )}
                            </div>
                          )}

                          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded">{log.summary || 'メモなし'}</p>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}