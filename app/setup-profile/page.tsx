"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Upload, X, Save } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function SetupProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [majorProjectsList, setMajorProjectsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', furigana: '', attribute: '大学生', prefecture: '東京都', city: '',
    goal: '', policy_committee: '', local_branches: '', major_projects: '', projects: '', 
    sns_links: '', outside_activities: '', free_text: '', photo_url: ''
  });

  useEffect(() => {
    const fetchUserAndOptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      setUserId(session.user.id);
      setEmail(session.user.email || '');

      // ★修正: データベースに既存のプロフィールデータがあるか確認
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        // 既存データがある場合はそれを優先
        setFormData({
          name: profileData.name || '', 
          furigana: profileData.furigana || '', 
          attribute: profileData.attribute || '大学生',
          prefecture: profileData.prefecture || '東京都', 
          city: profileData.city || '', 
          goal: profileData.goal || '',
          policy_committee: profileData.policy_committee || '', 
          local_branches: profileData.local_branches || '', 
          major_projects: profileData.major_projects || '', 
          projects: profileData.projects || '',
          sns_links: profileData.sns_links || '', 
          outside_activities: profileData.outside_activities || '', 
          free_text: profileData.free_text || '', 
          photo_url: profileData.photo_url || ''
        });
        if (profileData.photo_url) {
          setImagePreviewUrl(profileData.photo_url);
        }
      } else {
        // 既存データがない場合のみ、Googleからの情報を初期値としてセット
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || '',
          photo_url: session.user.user_metadata?.avatar_url || ''
        }));
        if (session.user.user_metadata?.avatar_url) {
          setImagePreviewUrl(session.user.user_metadata.avatar_url);
        }
      }

      // プロジェクト一覧の取得
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
    fetchUserAndOptions();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);

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

      const isCore = email.endsWith('@japanyouthcouncil.com');

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        name: formData.name, 
        furigana: formData.furigana, 
        attribute: formData.attribute,
        prefecture: formData.prefecture, 
        city: formData.city, 
        goal: formData.goal,
        policy_committee: formData.policy_committee, 
        local_branches: formData.local_branches, 
        major_projects: formData.major_projects, 
        projects: formData.projects,
        sns_links: formData.sns_links, 
        outside_activities: formData.outside_activities,
        free_text: formData.free_text, 
        photo_url: finalPhotoUrl,
        is_core_member: isCore,
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      await supabase.auth.updateUser({ 
        data: { full_name: formData.name, avatar_url: finalPhotoUrl } 
      });

      alert('プロフィールの登録が完了しました！');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      alert('更新に失敗しました: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
        <label className="block text-sm font-bold text-black mb-2">{title} <span className="text-xs bg-gray-200 text-black px-2 py-1 rounded">複数選択可</span></label>
        <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl space-y-4">
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
                <label className={`flex items-center gap-2 text-sm cursor-pointer transition ${parent.status === '進行中' ? 'text-black font-bold hover:text-blue-600' : 'text-gray-900'}`}>
                  <input type="checkbox" checked={isParentChecked} onChange={() => handleCheckboxChange(parentField, parent.name)} className="w-4 h-4 text-blue-600 border-gray-400 rounded focus:ring-blue-500" />
                  <span className={parent.status === '終了済み' ? 'opacity-80' : ''}>{parent.name}</span>
                  {parent.status !== '進行中' && <span className="text-[10px] bg-gray-200 text-black px-1.5 py-0.5 rounded font-bold">{parent.status}</span>}
                </label>
                
                {visibleChildren.length > 0 && (
                  <div className="pl-6 space-y-1.5 border-l-2 border-gray-300 ml-2 mt-1">
                    {visibleChildren.map(child => {
                      const isChildChecked = formData.projects ? String(formData.projects).split(',').includes(child.name) : false;
                      return (
                        <label key={child.name} className={`flex items-center gap-2 text-sm cursor-pointer transition ${child.status === '進行中' ? 'text-black font-bold hover:text-green-600' : 'text-gray-900'}`}>
                          <input type="checkbox" checked={isChildChecked} onChange={() => handleCheckboxChange('projects', child.name)} className="w-4 h-4 text-green-600 border-gray-400 rounded focus:ring-green-500" />
                          <span className={child.status === '終了済み' ? 'opacity-80' : ''}>{child.name}</span>
                          {child.status !== '進行中' && <span className="text-[10px] bg-gray-200 text-black px-1.5 py-0.5 rounded font-bold">{child.status}</span>}
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

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-black">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-300">
        <h2 className="text-2xl font-bold text-black mb-2 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600"/> 初回プロフィール設定
        </h2>
        <p className="text-black text-sm mb-8 font-bold border-b-2 border-gray-100 pb-4">
          JYC Portalへの参加にあたり、基本情報の登録をお願いします。
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-8">
            <label className="block text-sm font-bold text-black mb-3">プロフィール写真</label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50 border border-gray-300 rounded-xl">
              {imagePreviewUrl ? (
                <div className="relative group">
                  <img src={imagePreviewUrl} alt="Profile" className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md" />
                  <button type="button" onClick={clearImage} className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg transform translate-x-1 -translate-y-1 transition"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-gray-300 shadow-sm flex items-center justify-center text-black"><User className="w-12 h-12 sm:w-16 sm:h-16" /></div>
              )}
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" id="photo-upload-setup" />
                <label htmlFor="photo-upload-setup" className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-gray-400 rounded-md text-sm font-bold text-black cursor-pointer hover:bg-gray-100 transition shadow-sm"><Upload className="w-4 h-4"/> 写真を選択</label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ★修正: required 属性を明示的に付与 */}
            <div><label className="block text-sm font-bold text-black mb-1">名前 <span className="text-red-500">*</span></label><input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold" /></div>
            <div><label className="block text-sm font-bold text-black mb-1">ふりがな <span className="text-red-500">*</span></label><input required type="text" name="furigana" value={formData.furigana} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold" /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">属性 <span className="text-red-500">*</span></label>
              <select required name="attribute" value={formData.attribute} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold bg-white">
                <option value="高校生">高校生</option><option value="大学生">大学生</option><option value="大学院生">大学院生</option><option value="社会人">社会人</option><option value="その他">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">居住地（都道府県） <span className="text-red-500">*</span></label>
              <select required name="prefecture" value={formData.prefecture} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold bg-white">
                {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
            </div>
          </div>

          <div><label className="block text-sm font-bold text-black mb-1">居住地（市区町村など）</label><input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold" /></div>

          <div className="pt-6 border-t border-gray-300 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-black">所属・参加プロジェクト設定</h3>
              <label className="flex items-center gap-1.5 cursor-pointer text-sm font-bold text-black hover:text-gray-700 transition">
                <input 
                  type="checkbox" 
                  checked={showCompleted} 
                  onChange={(e) => setShowCompleted(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 rounded border-gray-400 focus:ring-blue-500 cursor-pointer" 
                />
                終了済みも表示
              </label>
            </div>
            
            {renderTreeSection('所属政策委員会', 'policy_committee', committeesList, '政策委員会')}
            {renderTreeSection('所属地方支部', 'local_branches', branchesList, '地方支部')}
            {renderTreeSection('参加大プロジェクト', 'major_projects', majorProjectsList, '大プロジェクト')}
          </div>

          <div><label className="block text-sm font-bold text-black mb-1 mt-2">若者協議会で実現したいこと <span className="text-red-500">*</span></label><textarea required name="goal" value={formData.goal} onChange={handleChange} rows={4} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold resize-none"></textarea></div>
          <div><label className="block text-sm font-bold text-black mb-1">協議会以外での活動・所属</label><input type="text" name="outside_activities" value={formData.outside_activities} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold" /></div>
          <div><label className="block text-sm font-bold text-black mb-1">個人SNS各種リンク</label><input type="text" name="sns_links" value={formData.sns_links} onChange={handleChange} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold" /></div>
          <div><label className="block text-sm font-bold text-black mb-1">自由記述（趣味・特技など）</label><textarea name="free_text" value={formData.free_text} onChange={handleChange} rows={3} className="w-full border border-gray-400 p-2.5 rounded-lg text-sm text-black font-bold resize-none"></textarea></div>

          <div className="pt-6 border-t border-gray-300 mt-8 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3.5 px-10 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
              <Save className="w-5 h-5"/> {isSubmitting ? '保存中...' : '登録して利用を開始する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}