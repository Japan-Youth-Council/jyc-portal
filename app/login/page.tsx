"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // ▼ 新構造に対応した4つのリストステート
  const [committeesList, setCommitteesList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [majorProjectsList, setMajorProjectsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // ▼ formDataに local_branches と major_projects を追加
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', furigana: '', attribute: '大学生', prefecture: '東京都', city: '',
    goal: '', policy_committee: '', local_branches: '', major_projects: '', projects: '', 
    sns_links: '', outside_activities: '', free_text: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) router.push('/');
    };
    checkUser();

    // データベースから4種類の組織・プロジェクト情報を取得
    const fetchOptions = async () => {
      const { data: cData } = await supabase.from('policy_committees').select('*').order('created_at');
      const { data: bData } = await supabase.from('local_branches').select('*').order('created_at');
      const { data: mData } = await supabase.from('major_projects').select('*').order('created_at');
      const { data: pData } = await supabase.from('projects').select('*').order('created_at');
      
      if (cData) setCommitteesList(cData);
      if (bData) setBranchesList(bData);
      if (mData) setMajorProjectsList(mData);
      if (pData) setProjectsList(pData);
    };
    fetchOptions();
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
    // プレビューは即座に表示してサクサク感を出す
    setImagePreviewUrl(URL.createObjectURL(file));

    try {
      // Vercelの制限を回避するため、ここで最大4MBに自動圧縮
      const options = {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      // 圧縮後の軽いファイルを送信用の状態としてセット
      setProfileImage(compressedFile);
    } catch (error) {
      console.error('画像圧縮エラー:', error);
      alert('画像の処理に失敗しました。');
    }
  }
};

  const clearImage = () => {
    setProfileImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else {
      setSuccessMsg('パスワード再設定用のメールを送信しました。メール内のリンクをクリックしてください。');
      setResetEmail('');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email, password: formData.password,
      });
      if (error) setError('メールアドレスまたはパスワードが間違っています。');
      else router.push('/');
    } else if (mode === 'register') {
      let uploadedPhotoUrl = '';
      if (profileImage) {
        const uploadData = new FormData();
        uploadData.append('file', profileImage);
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          uploadedPhotoUrl = data.url;
        } catch (err: any) {
          setError('画像のアップロードに失敗しました。');
          setIsLoading(false);
          return;
        }
      }

      const isCore = formData.email.endsWith('@japanyouthcouncil.com');

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name, avatar_url: uploadedPhotoUrl, name: formData.name, furigana: formData.furigana,
            attribute: formData.attribute, prefecture: formData.prefecture, city: formData.city, goal: formData.goal,
            policy_committee: formData.policy_committee, local_branches: formData.local_branches, major_projects: formData.major_projects, 
            projects: formData.projects, sns_links: formData.sns_links, outside_activities: formData.outside_activities, 
            free_text: formData.free_text, photo_url: uploadedPhotoUrl, is_core_member: isCore
          }
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg('登録を受け付けました！確認メール内のリンクをクリックしてください。');
        setMode('login');
        setFormData({ ...formData, password: '' });
        clearImage();
      }
    }
    setIsLoading(false);
  };

  // ▼ ツリー構造を描画するための共通関数
  const renderTreeSection = (title: string, parentField: keyof typeof formData, parents: any[], parentTypeStr: string) => (
    <div className="mb-5">
      <label className="block text-xs font-bold text-gray-800 mb-2">{title} <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">複数選択可</span></label>
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
        {parents.map(parent => {
          const isParentChecked = formData[parentField] ? String(formData[parentField]).split(',').includes(parent.name) : false;
          // この親に紐づく小プロジェクトを抽出
          const children = projectsList.filter(p => p.parent_type === parentTypeStr && p.parent_name === parent.name);
          
          return (
            <div key={parent.name} className="space-y-1.5">
              {/* 親のチェックボックス */}
              <label className={`flex items-center gap-2 text-sm cursor-pointer transition ${parent.status === '進行中' ? 'text-gray-800 font-bold hover:text-blue-600' : 'text-gray-400'}`}>
                <input type="checkbox" checked={isParentChecked} onChange={() => handleCheckboxChange(parentField, parent.name)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                {parent.name}
                {parent.status !== '進行中' && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-normal">{parent.status}</span>}
              </label>
              
              {/* 子のチェックボックス（少しインデントしてツリー表示） */}
              {children.length > 0 && (
                <div className="pl-6 space-y-1.5 border-l-2 border-gray-200 ml-2 mt-1">
                  {children.map(child => {
                    const isChildChecked = formData.projects ? String(formData.projects).split(',').includes(child.name) : false;
                    return (
                      <label key={child.name} className={`flex items-center gap-2 text-sm cursor-pointer transition ${child.status === '進行中' ? 'text-gray-700 hover:text-green-600' : 'text-gray-400'}`}>
                        <input type="checkbox" checked={isChildChecked} onChange={() => handleCheckboxChange('projects', child.name)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                        {child.name}
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">JYC Portal</h1>
          <p className="text-gray-600 text-sm mt-2 font-bold">運営メンバー専用システム</p>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
          
          {mode !== 'reset' && (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-md transition ${mode === 'login' ? 'bg-white shadow text-blue-800' : 'text-gray-600 hover:text-gray-900'}`}>ログイン</button>
              <button type="button" onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-md transition ${mode === 'register' ? 'bg-white shadow text-blue-800' : 'text-gray-600 hover:text-gray-900'}`}>新規メンバー登録</button>
            </div>
          )}

          {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-800 text-sm p-4 rounded mb-6 font-medium whitespace-pre-wrap">{error}</div>}
          {successMsg && <div className="bg-green-50 border-l-4 border-green-500 text-green-900 text-sm p-4 rounded mb-6 font-bold">{successMsg}</div>}

          {mode === 'reset' ? (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700 border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4"/> パスワードの再設定</h3>
                <p className="text-sm text-gray-600">登録したメールアドレスを入力してください。再設定用のリンクをお送りします。</p>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">メールアドレス</label>
                  <input required type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="example@japanyouthcouncil.com" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-lg hover:bg-blue-800 transition shadow-md disabled:opacity-50">
                {isLoading ? '送信中...' : '再設定リンクを送信'}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-sm font-bold text-gray-500 hover:text-gray-700 transition">ログイン画面に戻る</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 border-b pb-2">認証情報</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-600"/> メールアドレス <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="example@japanyouthcouncil.com" />
                  {mode === 'register' && <p className="text-[11px] text-gray-600 mt-1.5 ml-1 font-medium">※ <code>@japanyouthcouncil.com</code> のアドレスで登録するとコアメンバー権限が付与されます。</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5"><Lock className="w-4 h-4 text-gray-600"/> パスワード <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label>
                  <input required type="password" name="password" value={formData.password} onChange={handleChange} minLength={6} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="6文字以上の英数字" />
                  {mode === 'login' && (
                    <div className="text-right mt-2">
                      <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition">パスワードを忘れた方はこちら</button>
                    </div>
                  )}
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-6 pt-4 animate-in fade-in duration-300">
                  <h3 className="text-sm font-bold text-gray-500 border-b pb-2 flex items-center gap-2"><User className="w-4 h-4 text-gray-600"/> 自己紹介プロフィール作成</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-2">プロフィール写真 <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">任意</span></label>
                    <div className="flex items-center gap-4">
                      {imagePreviewUrl ? (
                        <div className="relative">
                          <img src={imagePreviewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-300 shadow-sm" />
                          <button type="button" onClick={clearImage} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 shadow"><X className="w-3 h-3"/></button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-500"><User className="w-8 h-8" /></div>
                      )}
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" id="photo-upload" />
                        <label htmlFor="photo-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-400 rounded-md text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition shadow-sm"><Upload className="w-3 h-3"/> 写真を選択</label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-800 mb-1">名前（活動名可） <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label><input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-bold text-gray-800 mb-1">ふりがな <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label><input required type="text" name="furigana" value={formData.furigana} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">属性 <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label>
                      <select name="attribute" value={formData.attribute} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
                        <option value="高校生">高校生</option><option value="大学生">大学生</option><option value="大学院生">大学院生</option><option value="社会人">社会人</option><option value="その他">その他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">居住地（都道府県） <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label>
                      <select name="prefecture" value={formData.prefecture} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white">
                        {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                      </select>
                    </div>
                  </div>

                  <div><label className="block text-xs font-bold text-gray-800 mb-1">居住地（市区町村など）</label><input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>

                  {/* ▼ ツリーUIの呼び出し */}
                  <div className="pt-2">
                    {renderTreeSection('所属政策委員会', 'policy_committee', committeesList, '政策委員会')}
                    {renderTreeSection('所属地方支部', 'local_branches', branchesList, '地方支部')}
                    {renderTreeSection('参加大プロジェクト', 'major_projects', majorProjectsList, '大プロジェクト')}
                  </div>

                  <div><label className="block text-xs font-bold text-gray-800 mb-1 mt-2">若者協議会で実現したいこと <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">必須</span></label><textarea required name="goal" value={formData.goal} onChange={handleChange} rows={3} className="w-full border border-gray-300 p-2 rounded-lg text-sm resize-none"></textarea></div>
                  <div><label className="block text-xs font-bold text-gray-800 mb-1">協議会以外での活動・所属</label><input type="text" name="outside_activities" value={formData.outside_activities} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-bold text-gray-800 mb-1">個人SNS各種リンク</label><input type="text" name="sns_links" value={formData.sns_links} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-bold text-gray-800 mb-1">自由記述（趣味・特技など）</label><textarea name="free_text" value={formData.free_text} onChange={handleChange} rows={2} className="w-full border border-gray-300 p-2 rounded-lg text-sm resize-none"></textarea></div>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-md mt-6 disabled:opacity-50">
                {isLoading ? '処理中...' : mode === 'login' ? 'ログインして開始' : 'プロフィールを登録してアカウント開設'}
                {!isLoading && <ArrowRight className="w-4 h-4"/>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}