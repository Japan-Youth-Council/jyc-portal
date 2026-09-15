"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Upload, X, Save, Mail } from 'lucide-react'; 
import imageCompression from 'browser-image-compression';

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const [showCompleted, setShowCompleted] = useState(false);

  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [majorProjectsList, setMajorProjectsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', furigana: '', attribute: '', prefecture: '', city: '',
    goal: '', policy_committee: '', local_branches: '', major_projects: '', projects: '', 
    sns_links: '', outside_activities: '', free_text: '', photo_url: ''
  });

  useEffect(() => {
    const fetchProfileAndOptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/');
        return;
      }
      
      let currentUser = session.user;

      // ==========================================
      // ▼ 古いGoogleアカウントの自動解除（すり替え）ロジック ▼
      // ==========================================
      const oldIdentityId = localStorage.getItem('pending_unlink_identity_id');
      if (oldIdentityId && currentUser.identities) {
        // 現在リンクされているGoogleアカウントをすべて取得
        const googleIdentities = currentUser.identities.filter(id => id.provider === 'google');
        
        // Googleアカウントが2つ以上ある（＝新しいアカウントが無事に追加された）場合のみ実行
        if (googleIdentities.length > 1) {
          const identityToUnlink = currentUser.identities.find(id => id.identity_id === oldIdentityId);
          if (identityToUnlink) {
            // 古いアカウントの連携を解除
            const { error: unlinkError } = await supabase.auth.unlinkIdentity(identityToUnlink);
            if (!unlinkError) {
              // 解除成功したらフラグを消し、セッションを最新化する
              localStorage.removeItem('pending_unlink_identity_id');
              const { data: refreshedData } = await supabase.auth.refreshSession();
              if (refreshedData.session) {
                currentUser = refreshedData.session.user;
                setMessage({ text: 'ログイン用のGoogleアカウントを変更しました。', isError: false });
              }
            } else {
              console.error("Unlink error:", unlinkError);
            }
          }
        } else {
          // 認証をキャンセルした、あるいは全く同じアカウントを選んだ場合は、フラグだけ消して何もしない
          localStorage.removeItem('pending_unlink_identity_id');
        }
      }
      // ==========================================

      setUser(currentUser);

      const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      if (data) {
        setFormData({
          name: data.name || '', furigana: data.furigana || '', attribute: data.attribute || '大学生',
          prefecture: data.prefecture || '東京都', city: data.city || '', goal: data.goal || '',
          policy_committee: data.policy_committee || '', local_branches: data.local_branches || '', 
          major_projects: data.major_projects || '', projects: data.projects || '',
          sns_links: data.sns_links || '', outside_activities: data.outside_activities || '',
          free_text: data.free_text || '', photo_url: data.photo_url || ''
        });
        if (data.photo_url) setImagePreviewUrl(data.photo_url);
      }

      const { data: cData } = await supabase.from('policy_committees').select('*').order('created_at');
      const { data: bData } = await supabase.from('local_branches').select('*').order('created_at');
      const { data: mData } = await supabase.from('major_projects').select('*').order('created_at');
      const { data: pData } = await supabase.from('projects').select('*').order('created_at');
      
      if (cData) setCommitteesList(cData);
      if (bData) setBranchesList(bData);
      if (mData) setMajorProjectsList(mData);
      if (pData) setProjectsList(pData);

      setIsLoading(false);
    };
    fetchProfileAndOptions();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (field: keyof typeof formData, value: string) => {
    const currentArray = formData[field] ? String(formData[field]).split(',') : [];
    if (currentArray.includes(value)) {
      setFormData({ ...formData, [field]: currentArray.filter(v => v !== value).join(',') });
    } else {
      setFormData({ ...formData, [field]: [...currentArray, value].join(',') });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
      try {
        const options = { maxSizeMB: 4, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        setProfileImage(compressedFile);
      } catch (error) {
        alert('画像の処理に失敗しました。');
      }
    }
  };

  const clearImage = () => {
    setProfileImage(null);
    setImagePreviewUrl(null);
    setFormData(prev => ({ ...prev, photo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ▼ 確認メールなしで直接Googleアカウントを【変更】する処理
  const handleChangeGoogleAccount = async () => {
    try {
      if (!user?.identities) return;
      
      // 現在のGoogleアカウントのIDを探す
      const currentGoogleIdentity = user.identities.find((id: any) => id.provider === 'google');
      
      if (currentGoogleIdentity) {
        // リダイレクト前に、消すべき古いIDをブラウザに記憶させておく
        localStorage.setItem('pending_unlink_identity_id', currentGoogleIdentity.identity_id);
      }

      // 新しいアカウントを連携しにGoogleへ飛ぶ
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: window.location.href, // 認証後にこのページに戻ってくる
          queryParams: {
            prompt: 'select_account' // 既にログイン済みでも強制的にアカウント選択画面を出す
          }
        }
      });
      if (error) throw error;
      
    } catch (err: any) {
      alert('Googleアカウントの連携画面への移行に失敗しました: ' + err.message);
      localStorage.removeItem('pending_unlink_identity_id'); // 失敗時はフラグを消す
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage({ text: '', isError: false });

    try {
      let finalPhotoUrl = formData.photo_url;
      if (profileImage) {
        const uploadData = new FormData();
        uploadData.append('file', profileImage);
        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        finalPhotoUrl = data.url;
      }

      // ドメインベースでのコアメンバー判定（現在のメインアドレスで判定）
      const isCore = user.email?.endsWith('@japanyouthcouncil.com') || false;

      const { error: dbError } = await supabase.from('profiles').update({
        name: formData.name, furigana: formData.furigana, attribute: formData.attribute,
        prefecture: formData.prefecture, city: formData.city, goal: formData.goal,
        policy_committee: formData.policy_committee, local_branches: formData.local_branches, 
        major_projects: formData.major_projects, projects: formData.projects,
        sns_links: formData.sns_links, outside_activities: formData.outside_activities,
        free_text: formData.free_text, photo_url: finalPhotoUrl,
        is_core_member: isCore,
      }).eq('id', user.id);

      if (dbError) throw dbError;

      await supabase.auth.updateUser({ data: { full_name: formData.name, avatar_url: finalPhotoUrl } });

      setMessage({ text: 'プロフィールを更新しました。', isError: false });
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (err: any) {
      setMessage({ text: '更新に失敗しました: ' + err.message, isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const renderTreeSection = (title: string, parentField: keyof typeof formData, parents: any[], parentTypeStr: string) => {
    const visibleParents = parents.filter(parent => {
      const isParentChecked = formData[parentField] ? String(formData[parentField]).split(',').includes(parent.name) : false;
      if (!showCompleted && parent.status === '終了済み' && !isParentChecked) return false;
      return true;
    });

    if (visibleParents.length === 0) return null;

    return (
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-800 mb-2">{title} <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">複数選択可</span></label>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
          {visibleParents.map(parent => {
            const isParentChecked = formData[parentField] ? String(formData[parentField]).split(',').includes(parent.name) : false;
            
            const children = projectsList.filter(p => p.parent_type === parentTypeStr && p.parent_name === parent.name);
            const visibleChildren = children.filter(child => {
              const isChildChecked = formData.projects ? String(formData.projects).split(',').includes(child.name) : false;
              if (!showCompleted && child.status === '終了済み' && !isChildChecked) return false;
              return true;
            });
            
            return (
              <div key={parent.name} className="space-y-1.5">
                <label className={`flex items-center gap-2 text-sm cursor-pointer transition ${parent.status === '進行中' ? 'text-gray-900 font-bold hover:text-blue-600' : 'text-gray-500'}`}>
                  <input type="checkbox" checked={isParentChecked} onChange={() => handleCheckboxChange(parentField, parent.name)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className={parent.status === '終了済み' ? 'opacity-80' : ''}>{parent.name}</span>
                  {parent.status !== '進行中' && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-normal">{parent.status}</span>}
                </label>
                
                {visibleChildren.length > 0 && (
                  <div className="pl-6 space-y-1.5 border-l-2 border-gray-200 ml-2 mt-1">
                    {visibleChildren.map(child => {
                      const isChildChecked = formData.projects ? String(formData.projects).split(',').includes(child.name) : false;
                      return (
                        <label key={child.name} className={`flex items-center gap-2 text-sm cursor-pointer transition ${child.status === '進行中' ? 'text-gray-900 font-medium hover:text-green-600' : 'text-gray-500'}`}>
                          <input type="checkbox" checked={isChildChecked} onChange={() => handleCheckboxChange('projects', child.name)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                          <span className={child.status === '終了済み' ? 'opacity-80' : ''}>{child.name}</span>
                          {child.status !== '進行中' && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-normal">{child.status}</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600"/> プロフィール設定
        </h2>
        
        {message.text && (
          <div className={`p-4 rounded-lg mb-6 font-bold text-sm ${message.isError ? 'bg-red-50 text-red-800 border-l-4 border-red-500' : 'bg-green-50 text-green-800 border-l-4 border-green-500'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ▼ Googleアカウント変更セクション ▼ */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Mail className="w-4 h-4"/> ログイン用Googleアカウント</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">現在のアドレス</label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-300 p-3 rounded-lg">
                  {/* user.email はトップレベルで更新されない場合があるため、identities から最新のものを取得して表示 */}
                  <span className="text-sm text-gray-900 font-bold">
                    {user?.identities?.find((id: any) => id.provider === 'google')?.identity_data?.email || user?.email}
                  </span>
                  <button type="button" onClick={handleChangeGoogleAccount} className="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 px-4 rounded transition border border-blue-200 shadow-sm">
                    別のアカウントに変更する
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  ※ボタンを押すとGoogleの認証画面が開きます。新しいアカウントを選択するだけで即座に変更が完了し、古いアカウントでのログインはできなくなります。
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-500 border-b pb-2 mb-4">公開プロフィール情報</h3>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-800 mb-3">プロフィール写真</label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50 border border-gray-100 rounded-xl">
              {imagePreviewUrl ? (
                <div className="relative group">
                  <img src={imagePreviewUrl} alt="Profile" className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md" />
                  <button type="button" onClick={clearImage} className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg transform translate-x-1 -translate-y-1 transition"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-gray-100 shadow-sm flex items-center justify-center text-gray-400"><User className="w-12 h-12 sm:w-16 sm:h-16" /></div>
              )}
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" id="photo-upload-edit" />
                <label htmlFor="photo-upload-edit" className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition shadow-sm"><Upload className="w-4 h-4"/> 新しい写真を選択</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-800 mb-1">名前</label><input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium" /></div>
            <div><label className="block text-xs font-bold text-gray-800 mb-1">ふりがな</label><input required type="text" name="furigana" value={formData.furigana} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">属性</label>
              <select name="attribute" value={formData.attribute} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium bg-white">
                <option value="高校生">高校生</option><option value="大学生">大学生</option><option value="大学院生">大学院生</option><option value="社会人">社会人</option><option value="その他">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">居住地（都道府県）</label>
              <select name="prefecture" value={formData.prefecture} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium bg-white">
                {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
            </div>
          </div>

          <div><label className="block text-xs font-bold text-gray-800 mb-1">居住地（市区町村など）</label><input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium" /></div>

          <div className="pt-6 border-t mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">所属・参加プロジェクト設定</h3>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900 transition">
                <input 
                  type="checkbox" 
                  checked={showCompleted} 
                  onChange={(e) => setShowCompleted(e.target.checked)} 
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                />
                終了済みも表示
              </label>
            </div>
            
            {renderTreeSection('所属政策委員会', 'policy_committee', committeesList, '政策委員会')}
            {renderTreeSection('所属地方支部', 'local_branches', branchesList, '地方支部')}
            {renderTreeSection('参加大プロジェクト', 'major_projects', majorProjectsList, '大プロジェクト')}
          </div>

          <div><label className="block text-xs font-bold text-gray-800 mb-1 mt-2">若者協議会で実現したいこと</label><textarea required name="goal" value={formData.goal} onChange={handleChange} rows={4} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium resize-none"></textarea></div>
          <div><label className="block text-xs font-bold text-gray-800 mb-1">協議会以外での活動・所属</label><input type="text" name="outside_activities" value={formData.outside_activities} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium" /></div>
          <div><label className="block text-xs font-bold text-gray-800 mb-1">個人SNS各種リンク</label><input type="text" name="sns_links" value={formData.sns_links} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium" /></div>
          <div><label className="block text-xs font-bold text-gray-800 mb-1">自由記述（趣味・特技など）</label><textarea name="free_text" value={formData.free_text} onChange={handleChange} rows={3} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm text-gray-900 font-medium resize-none"></textarea></div>

          <div className="pt-6 border-t mt-8 flex justify-end">
            <button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
              <Save className="w-4 h-4"/> {isSaving ? '保存中...' : '変更を保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}