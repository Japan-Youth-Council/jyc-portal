"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MoreVertical, Trash2, GitMerge, Plus, Edit2, User, FileText, Link as LinkIcon, Building2, MapPin, X, Search, ChevronDown, ChevronRight, Globe } from 'lucide-react'; // Checkアイコンを削除しました

type Target = { id: number; category: string; region: string | null; name: string; sort_order: number };
type ContactRecord = { id: number; target_id: number; date: string; title: string; content: string; jyc_attendees: string; target_attendees: string[]; linked_target_ids: number[]; document_urls: string[]; minutes_url: string; hp_article_url: string; author_name: string; created_at: string };

const CATEGORIES = ['国政', '中央行政', '地方', '個人', 'その他'];

export default function ContactsPage() {
  const [user, setUser] = useState<any>(null);
  const [currentAuthorName, setCurrentAuthorName] = useState('');

  const [targets, setTargets] = useState<Target[]>([]);
  const [records, setRecords] = useState<ContactRecord[]>([]);
  const [activeTarget, setActiveTarget] = useState<Target | null>(null);
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({'国政': true, '中央行政': true, '地方': true, '個人': true, 'その他': true});
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContactRecord[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [menuTargetId, setMenuTargetId] = useState<number | null>(null);
  const [mergeData, setMergeData] = useState<{ from: number; to: number | null } | null>(null);
  const [formData, setFormData] = useState<Partial<ContactRecord>>({});
  
  const [targetAttendees, setTargetAttendees] = useState<string[]>([]);
  const [attendeeSearchText, setAttendeeSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const attendeeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setCurrentAuthorName(session.user.user_metadata?.full_name || '名称未設定');
      }
      fetchTargets();
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTarget) fetchRecords(activeTarget.id);
  }, [activeTarget]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const search = async () => {
        const { data } = await supabase
          .from('contact_records')
          .select('*')
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,jyc_attendees.ilike.%${searchQuery}%`)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });
        if (data) setSearchResults(data);
      };
      search();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchTargets = async () => {
    const { data } = await supabase.from('contact_targets').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (data) setTargets(data);
  };

  const fetchRecords = async (targetId: number) => {
    const { data } = await supabase
      .from('contact_records')
      .select('*')
      .or(`target_id.eq.${targetId},linked_target_ids.cs.{${targetId}}`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setRecords(data);
  };

  const toggleCategory = (cat: string) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  const toggleRegion = (reg: string) => setOpenRegions(prev => ({ ...prev, [reg]: !prev[reg] }));

  const handleAddTarget = async (category: string, region: string | null = null) => {
    const name = prompt('新しいコンタクト先の名前を入力してください');
    if (!name) return;
    const { data } = await supabase.from('contact_targets').insert([{ category, region, name }]).select().single();
    if (data) {
      setTargets([...targets, data]);
      setOpenCategories(prev => ({ ...prev, [category]: true }));
      if (region) setOpenRegions(prev => ({ ...prev, [region]: true }));
    }
  };

  const handleUpdateTargetName = async (id: number, newName: string) => {
    await supabase.from('contact_targets').update({ name: newName }).eq('id', id);
    setTargets(targets.map(t => t.id === id ? { ...t, name: newName } : t));
    setEditingTargetId(null);
  };

  const handleDeleteTarget = async (id: number) => {
    if (!confirm('このコンタクト先を削除しますか？紐づく履歴もすべて消去されます。')) return;
    await supabase.from('contact_targets').delete().eq('id', id);
    setTargets(targets.filter(t => t.id !== id));
    if (activeTarget?.id === id) setActiveTarget(null);
  };

  const executeMerge = async () => {
    if (!mergeData || !mergeData.to) return;
    const { from, to } = mergeData;
    await supabase.from('contact_records').update({ target_id: to }).eq('target_id', from);
    const { data: linkedRecs } = await supabase.from('contact_records').select('id, linked_target_ids').contains('linked_target_ids', [from]);
    if (linkedRecs) {
      for (const rec of linkedRecs) {
        const newLinked = Array.from(new Set(rec.linked_target_ids.map((id: number) => id === from ? to : id)));
        await supabase.from('contact_records').update({ linked_target_ids: newLinked }).eq('id', rec.id);
      }
    }
    await supabase.from('contact_targets').delete().eq('id', from);
    setMergeData(null);
    setMenuTargetId(null);
    if (activeTarget?.id === from) setActiveTarget(targets.find(t => t.id === to) || null);
    fetchTargets();
  };

  const individualTargets = targets.filter(t => t.category === '個人');
  const suggestions = attendeeSearchText 
    ? individualTargets.filter(t => t.name.toLowerCase().includes(attendeeSearchText.toLowerCase())) 
    : individualTargets;
  const hasExactMatch = individualTargets.some(t => t.name === attendeeSearchText);

  const handleAddAttendee = (name: string) => {
    if (!name.trim()) return;
    if (!targetAttendees.includes(name.trim())) {
      setTargetAttendees([...targetAttendees, name.trim()]);
    }
    setAttendeeSearchText('');
    setShowSuggestions(false);
    setTimeout(() => attendeeInputRef.current?.focus(), 0);
  };

  const handleAttendeeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Tab') {
      if (attendeeSearchText.trim() && suggestions.length > 0) {
        e.preventDefault();
        handleAddAttendee(suggestions[0].name);
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (attendeeSearchText.trim()) handleAddAttendee(attendeeSearchText);
    }
  };

  const handleAddDocUrl = () => {
    const current = formData.document_urls || [];
    setFormData({ ...formData, document_urls: [...current, ''] });
  };
  const handleUpdateDocUrl = (index: number, value: string) => {
    const current = [...(formData.document_urls || [])];
    current[index] = value;
    setFormData({ ...formData, document_urls: current });
  };
  const handleRemoveDocUrl = (index: number) => {
    const current = [...(formData.document_urls || [])];
    current.splice(index, 1);
    setFormData({ ...formData, document_urls: current });
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTarget) return;
    if (!user && !currentAuthorName.trim()) { alert('未ログインの場合は作業者名を入力してください'); return; }

    try {
      let linkedIds: number[] = [];
      for (const name of targetAttendees) {
        const existing = targets.find(t => t.category === '個人' && t.name === name);
        if (existing) linkedIds.push(existing.id);
        else {
          const { data: newTarget, error: targetError } = await supabase.from('contact_targets').insert([{ category: '個人', name }]).select().single();
          if (targetError) { alert('❌ [個人ページ作成エラー] \n' + targetError.message); return; }
          if (newTarget) {
            linkedIds.push(newTarget.id);
            setTargets(prev => [...prev, newTarget]);
          }
        }
      }

      const filteredUrls = (formData.document_urls || []).filter(url => url.trim() !== '');

      const payload = {
        ...formData,
        document_urls: filteredUrls,
        target_id: activeTarget.id,
        target_attendees: targetAttendees,
        linked_target_ids: linkedIds,
        author_name: currentAuthorName,
      };

      if ('document_url' in payload) {
        delete (payload as any).document_url;
      }

      if (formData.id) {
        const { error } = await supabase.from('contact_records').update(payload).eq('id', formData.id);
        if (error) { alert('❌ [データ更新エラー] \n' + error.message); return; }
      } else {
        const { error } = await supabase.from('contact_records').insert([payload]);
        if (error) { alert('❌ [データ保存エラー] \n' + error.message); return; }
      }
      
      setIsFormOpen(false);
      fetchRecords(activeTarget.id);
    } catch (err: any) { alert('❌ [予期せぬエラー] \n' + err.message); }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('この活動記録を削除しますか？')) return;
    await supabase.from('contact_records').delete().eq('id', id);
    setRecords(records.filter(r => r.id !== id));
    if (searchQuery) setSearchResults(searchResults.filter(r => r.id !== id));
  };

  const openForm = (record?: ContactRecord) => {
    if (record) {
      setFormData(record);
      setTargetAttendees(record.target_attendees || []);
    } else {
      setFormData({ date: new Date().toISOString().split('T')[0], title: '', content: '', jyc_attendees: '', document_urls: [], minutes_url: '', hp_article_url: '' });
      setTargetAttendees([]);
    }
    setAttendeeSearchText('');
    setIsFormOpen(true);
  };

  const [dragId, setDragId] = useState<number | null>(null);
  const handleDrop = async (dropId: number, category: string) => {
    if (!dragId || dragId === dropId) return;
    const group = targets.filter(t => t.category === category).sort((a,b) => a.sort_order - b.sort_order);
    const dragIdx = group.findIndex(t => t.id === dragId);
    const dropIdx = group.findIndex(t => t.id === dropId);
    
    const newGroup = [...group];
    const [removed] = newGroup.splice(dragIdx, 1);
    newGroup.splice(dropIdx, 0, removed);
    
    setTargets(targets.map(t => {
      const match = newGroup.find(ng => ng.id === t.id);
      return match ? { ...t, sort_order: newGroup.indexOf(match) } : t;
    }));
    
    for (let i = 0; i < newGroup.length; i++) {
      await supabase.from('contact_targets').update({ sort_order: i }).eq('id', newGroup[i].id);
    }
  };

  const renderTargetItem = (target: Target, cat: string) => (
    <li 
      key={target.id}
      draggable
      onDragStart={() => setDragId(target.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(target.id, cat)}
      className={`group relative flex items-center justify-between p-2 rounded cursor-pointer transition ${activeTarget?.id === target.id && !searchQuery ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      {editingTargetId === target.id ? (
        <input 
          type="text" defaultValue={target.name} autoFocus
          onBlur={(e) => handleUpdateTargetName(target.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') handleUpdateTargetName(target.id, e.currentTarget.value);
          }}
          className="w-full border p-1 text-sm rounded outline-none"
        />
      ) : (
        <span onClick={() => { setActiveTarget(target); setSearchQuery(''); }} className="flex-1 truncate text-sm">{target.name}</span>
      )}

      <div className="relative">
        <button onClick={(e) => { e.stopPropagation(); setMenuTargetId(menuTargetId === target.id ? null : target.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded">
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {menuTargetId === target.id && (
          <div className="absolute right-0 mt-1 w-36 bg-white border rounded shadow-lg z-20 py-1" onMouseLeave={() => setMenuTargetId(null)}>
            <button onClick={() => { setEditingTargetId(target.id); setMenuTargetId(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700 flex items-center gap-2"><Edit2 className="w-3 h-3"/> 名前を変更</button>
            <button onClick={() => { setMergeData({ from: target.id, to: null }); setMenuTargetId(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-blue-600 flex items-center gap-2"><GitMerge className="w-3 h-3"/> 他へ統合</button>
            <button onClick={() => { handleDeleteTarget(target.id); setMenuTargetId(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-red-600 flex items-center gap-2"><Trash2 className="w-3 h-3"/> 削除</button>
          </div>
        )}
      </div>
    </li>
  );

  const renderRecordCard = (record: ContactRecord, isSearchResult = false) => {
    const targetInfo = targets.find(t => t.id === record.target_id);

    return (
      <div key={record.id} className="relative pl-6 md:pl-8 group">
        
        {/* ★変更: クリックできそうなアイコンから、シンプルなドットの装飾に変更 */}
        <div className="absolute w-4 h-4 bg-blue-300 rounded-full border-[3px] border-gray-50 -left-[9px] top-1.5 z-10"></div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{record.date}</span>
              
              {isSearchResult && targetInfo && (
                <span 
                  onClick={() => { setActiveTarget(targetInfo); setSearchQuery(''); }}
                  className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded cursor-pointer transition flex items-center gap-1"
                >
                  {targetInfo.category === '個人' ? <User className="w-3 h-3"/> : <Building2 className="w-3 h-3"/>}
                  {targetInfo.name}
                </span>
              )}
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => { setActiveTarget(targetInfo || null); openForm(record); }} className="p-1 hover:bg-gray-100 rounded text-gray-400"><Edit2 className="w-4 h-4"/></button>
              <button onClick={() => handleDeleteRecord(record.id)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
          
          <h3 className="font-bold text-gray-800 text-lg mb-3">{record.title}</h3>
          {record.content && <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed mb-4">{record.content}</p>}

          <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-2 mb-4 border border-gray-100">
            <div className="flex items-start gap-2">
              <span className="font-bold text-gray-500 w-16 shrink-0">先方出席:</span>
              <div className="flex flex-wrap gap-1">
                {record.target_attendees?.map((a, i) => <span key={i} className="bg-white border text-gray-700 px-2 py-0.5 rounded-full shadow-sm">{a}</span>)}
                {(!record.target_attendees || record.target_attendees.length === 0) && <span className="text-gray-400">記載なし</span>}
              </div>
            </div>
            <div className="flex items-start gap-2"><span className="font-bold text-gray-500 w-16 shrink-0">JYC出席:</span><span className="text-gray-700">{record.jyc_attendees || '記載なし'}</span></div>
          </div>

          <div className="flex gap-4 text-sm flex-wrap">
            {record.document_urls && record.document_urls.length > 0 && record.document_urls.map((url, idx) => (
              <a key={idx} href={url} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline">
                <FileText className="w-4 h-4" /> 資料 {record.document_urls.length > 1 ? idx + 1 : ''}
              </a>
            ))}
            {record.minutes_url && <a href={record.minutes_url} target="_blank" className="flex items-center gap-1 text-green-600 hover:underline"><LinkIcon className="w-4 h-4" /> 議事録</a>}
            
            {record.hp_article_url && (
              <a href={record.hp_article_url} target="_blank" className="flex items-center gap-1 text-orange-600 hover:underline">
                <Globe className="w-4 h-4" /> HP記事
              </a>
            )}
          </div>
          <div className="text-right mt-2 text-xs text-gray-400">記録者: {record.author_name}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-61px)] bg-gray-50 text-gray-800">
      <aside className="w-72 bg-white border-r flex flex-col overflow-y-auto">
        <div className="p-4 border-b bg-gray-50 space-y-3 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-700">コンタクト先リスト</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="全履歴から検索 (件名等)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>
        
        <div className="p-3">
          {CATEGORIES.map(cat => {
            const catTargets = targets.filter(t => t.category === cat);
            return (
              <div key={cat} className="mb-2">
                <div className="flex items-center justify-between group mb-1 cursor-pointer" onClick={() => toggleCategory(cat)}>
                  <h3 className="text-sm font-bold text-gray-600 flex items-center gap-1 hover:text-gray-800 transition">
                    {openCategories[cat] ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                    {cat === '個人' ? <User className="w-4 h-4"/> : <MapPin className="w-4 h-4"/>} {cat}
                  </h3>
                  <button onClick={(e) => { e.stopPropagation(); handleAddTarget(cat); }} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition p-1"><Plus className="w-4 h-4" /></button>
                </div>
                
                {openCategories[cat] && (
                  cat === '地方' ? (
                    <div className="space-y-2 mt-1 pl-2 mb-4">
                      {Array.from(new Set(catTargets.map(t => t.region || 'その他'))).map(region => {
                        const rTargets = catTargets.filter(t => (t.region || 'その他') === region);
                        return (
                          <div key={region}>
                            <div className="flex items-center text-xs font-bold text-gray-500 mb-1 cursor-pointer hover:text-gray-700" onClick={() => toggleRegion(region)}>
                              {openRegions[region] ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                              {region}
                            </div>
                            {openRegions[region] && (
                              <ul className="border-l-2 border-gray-200 ml-1.5 pl-2 space-y-1 mt-1">
                                {rTargets.sort((a,b)=>a.sort_order - b.sort_order).map(t => renderTargetItem(t, cat))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <ul className="space-y-1 pl-4 mb-4">
                      {catTargets.sort((a,b)=>a.sort_order - b.sort_order).map(t => renderTargetItem(t, cat))}
                    </ul>
                  )
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden">
        {searchQuery.trim() ? (
          <>
            <div className="bg-white border-b p-6 flex justify-between items-center shadow-sm z-10">
              <div>
                <span className="text-xs font-bold text-gray-400 mb-1 block flex items-center gap-1"><Search className="w-3 h-3"/> 横断検索結果</span>
                <h2 className="text-2xl font-bold text-gray-800">「{searchQuery}」<span className="text-gray-500 text-lg font-normal"> の関連履歴</span></h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-3xl mx-auto">
                {searchResults.length === 0 ? (
                  <div className="text-center py-20 text-gray-400"><Search className="w-16 h-16 mx-auto mb-4 text-gray-200" /><p>一致する履歴がありません。</p></div>
                ) : (
                  <div className="relative border-l-2 border-blue-100 ml-4 md:ml-6 space-y-8 pb-8">
                    {searchResults.map(r => renderRecordCard(r, true))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTarget ? (
          <>
            <div className="bg-white border-b p-6 flex justify-between items-center shadow-sm z-10">
              <div>
                <span className="text-xs font-bold text-gray-400 mb-1 block">{activeTarget.category}</span>
                <h2 className="text-2xl font-bold text-gray-800">{activeTarget.name} <span className="text-gray-500 text-lg font-normal">とのコンタクト履歴</span></h2>
              </div>
              <button onClick={() => openForm()} className="bg-blue-600 text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> 新規記録を追加</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-3xl mx-auto">
                {records.length === 0 ? (
                  <div className="text-center py-20 text-gray-400"><FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" /><p>まだ履歴がありません。<br/>新規記録を追加して活動を記録しましょう。</p></div>
                ) : (
                  <div className="relative border-l-2 border-blue-100 ml-4 md:ml-6 space-y-8 pb-8">
                    {records.map(r => renderRecordCard(r, false))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Search className="w-16 h-16 mb-4 text-gray-200"/>
            <p>左のメニューからコンタクト先を選択するか、上部の検索窓から履歴を検索してください</p>
          </div>
        )}
      </main>

      {isFormOpen && (
        <div className="absolute inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l flex flex-col z-50 animate-in slide-in-from-right">
          <div className="flex justify-between items-center p-5 border-b bg-gray-50">
            <h3 className="font-bold text-lg text-gray-800">{formData.id ? '記録を編集' : '新規記録を追加'}</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          
          <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-6 space-y-5">
            {!user && (
              <div>
                <label className="block text-xs font-bold text-red-500 mb-1">あなたの名前（未ログインのため必須）</label>
                <input required type="text" value={currentAuthorName} onChange={e => setCurrentAuthorName(e.target.value)} className="w-full border-red-200 bg-red-50 p-2 rounded text-sm outline-none" placeholder="例: 山田 太郎" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">実施日</label><input type="date" required value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-2 rounded text-sm outline-none" /></div>
            </div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1">件名 / トピック</label><input type="text" required placeholder="例: こども家庭庁 ヒアリング、意見交換など" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded text-sm outline-none" /></div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-blue-600 mb-1 flex items-center gap-1"><User className="w-3 h-3"/> 相手方出席者（Tabキーで自動入力）</label>
              <div className="w-full border rounded p-2 bg-white flex flex-wrap gap-2 items-center focus-within:border-blue-400 min-h-[42px]">
                {targetAttendees.map(attendee => (
                  <span key={attendee} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                    {attendee} <button type="button" onClick={() => setTargetAttendees(targetAttendees.filter(a => a !== attendee))} className="hover:text-red-500"><X className="w-3 h-3"/></button>
                  </span>
                ))}
                <input 
                  type="text" 
                  ref={attendeeInputRef}
                  value={attendeeSearchText} 
                  onChange={e => {
                    setAttendeeSearchText(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                  onKeyDown={handleAttendeeKeyDown} 
                  placeholder={targetAttendees.length === 0 ? "名前を入力..." : ""} 
                  className="flex-1 outline-none text-sm bg-transparent min-w-[120px]" 
                />
              </div>

              {showSuggestions && (attendeeSearchText || suggestions.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-xl max-h-48 overflow-y-auto">
                  <ul className="py-1">
                    {suggestions.map(t => (
                      <li key={t.id} onClick={() => handleAddAttendee(t.name)} className="px-3 py-2 hover:bg-blue-50 text-sm cursor-pointer flex items-center gap-2 text-gray-700">
                        <User className="w-3 h-3 text-gray-400"/> {t.name}
                      </li>
                    ))}
                    {attendeeSearchText.trim() && !hasExactMatch && (
                      <li onClick={() => handleAddAttendee(attendeeSearchText)} className="px-3 py-2 hover:bg-blue-50 text-sm cursor-pointer text-blue-600 font-bold flex items-center gap-2 border-t">
                        <Plus className="w-3 h-3"/> 「{attendeeSearchText}」を新しく登録する
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1">※Tabキーを押すと最上位の候補が決定されます。新しい人を追加する場合はそのままEnterを押してください。</p>
            </div>

            <div><label className="block text-xs font-bold text-gray-500 mb-1">JYC側出席者</label><input type="text" placeholder="例: 山田, 佐藤, 鈴木" value={formData.jyc_attendees || ''} onChange={e => setFormData({...formData, jyc_attendees: e.target.value})} className="w-full border p-2 rounded text-sm outline-none" /></div>
            
            <div><label className="block text-xs font-bold text-gray-500 mb-1">議事録・交渉メモ (任意)</label><textarea rows={6} placeholder="どのような内容が話されたか、手応えはどうだったか..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full border p-2 rounded text-sm outline-none resize-none" /></div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">資料URL (任意・複数可)</label>
                {(formData.document_urls || []).map((url, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input 
                      type="url" 
                      value={url} 
                      onChange={e => handleUpdateDocUrl(i, e.target.value)} 
                      className="flex-1 border p-2 rounded text-sm outline-none" 
                      placeholder="https://..." 
                    />
                    <button type="button" onClick={() => handleRemoveDocUrl(i)} className="p-2 text-red-400 hover:bg-red-50 rounded transition"><X className="w-4 h-4"/></button>
                  </div>
                ))}
                <button type="button" onClick={handleAddDocUrl} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition">
                  <Plus className="w-3 h-3"/> 資料URLを追加
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">議事録URL (任意)</label>
                <input type="url" value={formData.minutes_url || ''} onChange={e => setFormData({...formData, minutes_url: e.target.value})} className="w-full border p-2 rounded text-sm outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">HP記事URL (任意)</label>
                <input type="url" value={formData.hp_article_url || ''} onChange={e => setFormData({...formData, hp_article_url: e.target.value})} className="w-full border p-2 rounded text-sm outline-none" placeholder="https://..." />
              </div>
            </div>

            <div className="pt-4"><button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition">保存する</button></div>
          </form>
        </div>
      )}

      {mergeData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><GitMerge className="w-5 h-5 text-blue-600"/> コンタクト先の統合</h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              選択中のコンタクト先の<strong className="text-red-500">すべての履歴</strong>を、別のコンタクト先に移動させます。<br/>移動後、元の項目は自動的に削除されます。
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 mb-1">統合先（残す方）を選択</label>
              <select value={mergeData.to || ''} onChange={e => setMergeData({...mergeData, to: Number(e.target.value)})} className="w-full border p-2 rounded outline-none text-sm font-bold text-gray-700 bg-gray-50">
                <option value="">-- 選択してください --</option>
                {targets.filter(t => t.id !== mergeData.from).map(t => (
                  <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMergeData(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded">キャンセル</button>
              <button onClick={executeMerge} disabled={!mergeData.to} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">統合を実行</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}