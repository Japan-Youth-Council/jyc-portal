"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Star, Clock, Shuffle, X, User, Filter } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ▼ 新構造に対応したフィルター用の選択肢リスト
  const [committeesList, setCommitteesList] = useState<{name: string}[]>([]);
  const [branchesList, setBranchesList] = useState<{name: string}[]>([]);
  const [majorProjectsList, setMajorProjectsList] = useState<{name: string}[]>([]);

  // 検索・絞り込みステート
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMajorProject, setSelectedMajorProject] = useState('');
  const [isCoreOnly, setIsCoreOnly] = useState(false);
  
  const [sortMode, setSortMode] = useState<'random' | 'recent'>('random');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profilesData } = await supabase.from('profiles').select('*');
      if (profilesData) {
        const withRandomKey = profilesData.map(p => ({ ...p, randomKey: Math.random() }));
        setMembers(withRandomKey);
      }

      const { data: cData } = await supabase.from('policy_committees').select('name').order('created_at');
      const { data: bData } = await supabase.from('local_branches').select('name').order('created_at');
      const { data: mData } = await supabase.from('major_projects').select('name').order('created_at');
      
      if (cData) setCommitteesList(cData);
      if (bData) setBranchesList(bData);
      if (mData) setMajorProjectsList(mData);

      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...members];

    if (searchQuery) {
      result = result.filter(m => 
        (m.name && m.name.includes(searchQuery)) || 
        (m.furigana && m.furigana.includes(searchQuery))
      );
    }
    if (isCoreOnly) result = result.filter(m => m.is_core_member);
    if (selectedCommittee) result = result.filter(m => m.policy_committee?.includes(selectedCommittee));
    if (selectedBranch) result = result.filter(m => m.local_branches?.includes(selectedBranch));
    if (selectedMajorProject) result = result.filter(m => m.major_projects?.includes(selectedMajorProject));

    if (sortMode === 'recent') {
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      result.sort((a, b) => a.randomKey - b.randomKey);
    }

    setFilteredMembers(result);
  }, [members, searchQuery, isCoreOnly, selectedCommittee, selectedBranch, selectedMajorProject, sortMode]);

  const handleReshuffle = () => {
    setMembers(members.map(m => ({ ...m, randomKey: Math.random() })));
    setSortMode('random');
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">メンバー自己紹介</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">現在 {filteredMembers.length} 名のメンバーが表示されています</p>
          </div>

          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0 w-fit">
            <button onClick={() => setSortMode('recent')} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition ${sortMode === 'recent' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Clock className="w-3.5 h-3.5"/> 最近登録した人
            </button>
            <button onClick={handleReshuffle} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition ${sortMode === 'random' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Shuffle className="w-3.5 h-3.5"/> ランダムに表示
            </button>
          </div>
        </div>

        {/* コントロールパネル（検索・絞り込み） */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" placeholder="名前やふりがなで検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 transition select-none shrink-0">
              <input type="checkbox" checked={isCoreOnly} onChange={(e) => setIsCoreOnly(e.target.checked)} className="w-4 h-4 text-yellow-600 rounded border-yellow-300 focus:ring-yellow-500" />
              <span className="text-sm font-bold flex items-center gap-1"><Star className="w-4 h-4 fill-current"/> コアメンバーのみ</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">すべての政策委員会</option>
              {committeesList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">すべての地方支部</option>
              {branchesList.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
            <select value={selectedMajorProject} onChange={(e) => setSelectedMajorProject(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-medium outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">すべての大プロジェクト</option>
              {majorProjectsList.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* ギャラリービュー */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredMembers.map(member => (
              <div key={member.id} onClick={() => setSelectedMember(member)} className="group relative cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 aspect-[4/5] bg-gray-100 border border-gray-200">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400 group-hover:bg-gray-200 transition-colors">
                    <User className="w-12 h-12 mb-2 opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white flex justify-between items-end">
                  <div className="truncate">
                    <p className="text-[10px] text-gray-300 font-medium mb-0.5">{member.attribute} / {member.prefecture}</p>
                    <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{member.name || '名称未設定'}</h3>
                  </div>
                  {member.is_core_member && (
                    <div className="shrink-0 ml-2 bg-yellow-400/20 p-1 rounded-full backdrop-blur-sm" title="コアメンバー">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">条件に一致するメンバーが見つかりません</p>
          </div>
        )}

      </div>

      {/* 詳細プロフィールのモーダル */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-48 sm:h-56 shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
              {selectedMember.photo_url ? (
                <img src={selectedMember.photo_url} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <User className="w-20 h-20 text-gray-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-3 mb-1">
                  {selectedMember.is_core_member && <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> コアメンバー</span>}
                  <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">{selectedMember.attribute}</span>
                  <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">{selectedMember.prefecture}{selectedMember.city && ` ${selectedMember.city}`}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">{selectedMember.name}</h2>
                <p className="text-xs text-gray-300 mt-1">{selectedMember.furigana}</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2 border-b pb-1">若者協議会で実現したいこと</h4>
                <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed font-medium">{selectedMember.goal || '（未入力）'}</p>
              </div>

              {/* ▼ 新構造に対応した4カテゴリのタグ表示 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 mb-2">所属政策委員会</h4>
                  {selectedMember.policy_committee ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.policy_committee.split(',').map((c: string) => <span key={c} className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">{c}</span>)}
                    </div>
                  ) : <p className="text-gray-400 text-xs font-medium">未設定</p>}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 mb-2">所属地方支部</h4>
                  {selectedMember.local_branches ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.local_branches.split(',').map((b: string) => <span key={b} className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-md border border-purple-200">{b}</span>)}
                    </div>
                  ) : <p className="text-gray-400 text-xs font-medium">未設定</p>}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 mb-2">参加大プロジェクト</h4>
                  {selectedMember.major_projects ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.major_projects.split(',').map((m: string) => <span key={m} className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-md border border-orange-200">{m}</span>)}
                    </div>
                  ) : <p className="text-gray-400 text-xs font-medium">未設定</p>}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 mb-2">個別小プロジェクト</h4>
                  {selectedMember.projects ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.projects.split(',').map((p: string) => <span key={p} className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200">{p}</span>)}
                    </div>
                  ) : <p className="text-gray-400 text-xs font-medium">未設定</p>}
                </div>
              </div>

              {(selectedMember.outside_activities || selectedMember.sns_links) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                  {selectedMember.outside_activities && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-400 mb-1">協議会以外での活動・所属</h4>
                      <p className="text-gray-900 text-sm font-medium">{selectedMember.outside_activities}</p>
                    </div>
                  )}
                  {selectedMember.sns_links && (
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-400 mb-1">個人SNS・リンク</h4>
                      <p className="text-blue-600 text-sm break-all font-medium"><a href={selectedMember.sns_links} target="_blank" rel="noreferrer" className="hover:underline">{selectedMember.sns_links}</a></p>
                    </div>
                  )}
                </div>
              )}

              {selectedMember.free_text && (
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-[11px] font-bold text-gray-400 mb-2">自由記述（趣味・特技など）</h4>
                  <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed font-medium">{selectedMember.free_text}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}