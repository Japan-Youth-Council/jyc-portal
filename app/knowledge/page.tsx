"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PolicyCategory, Knowledge } from '@/types/database';
import { Plus, Search, FileText, User } from 'lucide-react';
import Link from 'next/link';

export default function KnowledgePage() {
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [selectedMinorId, setSelectedMinorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAuthorName, setCurrentAuthorName] = useState('');

  const [isAddingMajor, setIsAddingMajor] = useState(false);
  const [newMajorName, setNewMajorName] = useState('');
  const [isAddingMinor, setIsAddingMinor] = useState(false);
  const [newMinorName, setNewMinorName] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: catData } = await supabase.from('policy_categories').select('*').order('id');
    const { data: knowData } = await supabase.from('knowledges').select('*').order('updated_at', { ascending: false });
    if (catData) setCategories(catData);
    if (knowData) setKnowledges(knowData);
  };

  const majorCategories = categories.filter(c => c.parent_id === null);
  const minorCategories = categories.filter(c => c.parent_id === selectedMajorId);
  const filteredKnowledges = knowledges.filter(k => 
    k.category_id === selectedMinorId && (k.title.includes(searchQuery) || k.content.includes(searchQuery))
  );

  const checkAuthor = () => {
    if (!currentAuthorName.trim()) {
      alert('ナレッジを追加・編集する前に、画面上部の「作業者名」を入力してください。');
      return false;
    }
    return true;
  };

  const handleAddCategory = async (parentId: number | null, name: string) => {
    if (!name.trim()) return;
    if (!checkAuthor()) { parentId === null ? setIsAddingMajor(false) : setIsAddingMinor(false); return; }

    const { data } = await supabase.from('policy_categories').insert([{ name, parent_id: parentId, created_by_name: currentAuthorName }]).select();
    if (data) {
      setCategories([...categories, data[0]]);
      if (parentId === null) {
        setIsAddingMajor(false); setNewMajorName(''); setSelectedMajorId(data[0].id); setSelectedMinorId(null);
      } else {
        setIsAddingMinor(false); setNewMinorName(''); setSelectedMinorId(data[0].id);
      }
    }
  };

  const handleAddKnowledge = async () => {
    if (!selectedMinorId) return alert('先に小項目タブを選択してください');
    if (!checkAuthor()) return;
    const { data } = await supabase.from('knowledges').insert([{ category_id: selectedMinorId, title: '無題のドキュメント', content: '', author_name: currentAuthorName }]).select();
    if (data) setKnowledges([data[0], ...knowledges]);
  };

  const handleUpdateKnowledge = async (id: number, field: 'title' | 'content', value: string) => {
    const target = knowledges.find(k => k.id === id);
    if (target && target[field] === value) return;
    if (!checkAuthor()) return;
    const updated = knowledges.map(k => k.id === id ? { ...k, [field]: value } : k);
    setKnowledges(updated);
    await supabase.from('knowledges').update({ [field]: value, author_name: currentAuthorName, updated_at: new Date().toISOString() }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <main className="max-w-5xl mx-auto mt-8 px-4">
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center shadow-sm">
          <User className="w-5 h-5 text-red-500 mr-3" />
          <div className="flex-1 flex items-center">
            <span className="text-sm text-red-700 font-bold mr-4">作業者名を入力してください (必須):</span>
            <input type="text" placeholder="あなたの名前" value={currentAuthorName} onChange={e => setCurrentAuthorName(e.target.value)} className="px-3 py-1.5 border border-red-200 rounded text-sm w-64 outline-none focus:border-red-500 bg-white" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {majorCategories.map(cat => (
            <button key={cat.id} onClick={() => { setSelectedMajorId(cat.id); setSelectedMinorId(null); }} className={`px-4 py-2 rounded-t-lg font-bold border-b-4 transition-colors ${selectedMajorId === cat.id ? 'border-blue-600 text-blue-800 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-200'}`}>
              {cat.name}
            </button>
          ))}
          {isAddingMajor ? (
            <input autoFocus className="px-3 py-1 border rounded text-sm" placeholder="大項目名..." value={newMajorName} onChange={e => setNewMajorName(e.target.value)} onBlur={() => handleAddCategory(null, newMajorName)} onKeyDown={e => e.key === 'Enter' && handleAddCategory(null, newMajorName)} />
          ) : (
            <button onClick={() => setIsAddingMajor(true)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-200"><Plus className="w-5 h-5" /></button>
          )}
        </div>
        {selectedMajorId && (
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-gray-200 p-2 rounded-lg">
            {minorCategories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedMinorId(cat.id)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedMinorId === cat.id ? 'bg-white text-gray-800 shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                {cat.name}
              </button>
            ))}
            {isAddingMinor ? (
              <input autoFocus className="px-3 py-1 border rounded text-sm" placeholder="小項目名..." value={newMinorName} onChange={e => setNewMinorName(e.target.value)} onBlur={() => handleAddCategory(selectedMajorId, newMinorName)} onKeyDown={e => e.key === 'Enter' && handleAddCategory(selectedMajorId, newMinorName)} />
            ) : (
              <button onClick={() => setIsAddingMinor(true)} className="p-1.5 text-gray-500 hover:text-gray-800 rounded-md hover:bg-gray-300 flex items-center text-sm"><Plus className="w-4 h-4 mr-1" /> 追加</button>
            )}
          </div>
        )}
        {selectedMinorId && (
          <div className="space-y-6">
            <button onClick={handleAddKnowledge} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center"><Plus className="w-5 h-5 mr-2" /> 新しいドキュメントを追加</button>
            {filteredKnowledges.length === 0 ? (
              <p className="text-gray-500 text-center py-10">まだドキュメントがありません。</p>
            ) : (
              filteredKnowledges.map(knowledge => (
                <div key={knowledge.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group relative">
                  <div className="flex items-center text-xs text-gray-400 mb-2">
                    <FileText className="w-3 h-3 mr-1" /><span>{new Date(knowledge.updated_at).toLocaleDateString()}</span><span className="mx-2">•</span><span>最終更新: {knowledge.author_name}</span>
                  </div>
                  <input type="text" defaultValue={knowledge.title} onBlur={(e) => handleUpdateKnowledge(knowledge.id, 'title', e.target.value)} className="w-full text-2xl font-bold text-gray-800 outline-none border-b border-transparent focus:border-blue-300 mb-4 bg-transparent" placeholder="タイトルを入力..." />
                  <textarea defaultValue={knowledge.content} onBlur={(e) => handleUpdateKnowledge(knowledge.id, 'content', e.target.value)} className="w-full min-h-[150px] text-gray-600 outline-none resize-y bg-transparent placeholder-gray-300 leading-relaxed" placeholder="本文をクリックして入力..." />
                </div>
              ))
            )}
          </div>
        )}
        {!selectedMajorId && <div className="text-center py-20 text-gray-400">上のタブから大項目を選択、または新しく追加してください。</div>}
      </main>
    </div>
  );
}