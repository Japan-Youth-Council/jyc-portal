"use client";

import { useEffect, useState } from 'react';
import { Share } from 'lucide-react'; // 画面のボタン用のみ残す
import { toPng } from 'html-to-image';

const getDynamicTextClass = (text: string | null | undefined, type: 'goal' | 'free') => {
  const len = text?.length || 0;
  if (type === 'goal') {
    if (len < 60) return 'text-lg leading-relaxed';
    if (len < 120) return 'text-base leading-relaxed';
    if (len < 180) return 'text-sm leading-normal';
    return 'text-xs leading-snug';
  } else {
    if (len < 50) return 'text-[11px] leading-relaxed';
    if (len < 100) return 'text-[10px] leading-normal';
    return 'text-[9px] leading-snug';
  }
};

interface ProfileExportCardProps {
  member: any;
  bigProjects: any[];
  smallProjects: any[];
  buttonClassName?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export default function ProfileExportCard({ 
  member, 
  bigProjects, 
  smallProjects,
  buttonClassName = "flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition px-4 py-2 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 w-full sm:w-auto",
  buttonText = "【テスト1】アイコン・グラデ抜き",
  showIcon = true
}: ProfileExportCardProps) {
  const MAX_BIG_TAGS = 10;
  const MAX_SMALL_TAGS = 5;

  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!member?.photo_url) {
      setBase64Image(null);
      return;
    }

    let isMounted = true;
    const convertImageToBase64 = (url: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject(new Error('Canvas context is null'));
          }
        };
        img.onerror = (error) => reject(error);
        img.src = url.startsWith('http') ? `${url}?t=${new Date().getTime()}` : url;
      });
    };

    convertImageToBase64(member.photo_url)
      .then(base64 => { if (isMounted) setBase64Image(base64); })
      .catch((err) => { if (isMounted) setBase64Image(member.photo_url); });

    return () => { isMounted = false; };
  }, [member?.photo_url]);

  const handleDownloadProfile = async () => {
    const element = document.getElementById('profile-card-export');
    if (!element) return;
    setIsDownloading(true);
    
    try {
      // 純粋に1回だけ実行（前回成功したロジック）
      const dataUrl = await toPng(element, { 
        pixelRatio: 2, 
        backgroundColor: '#ffffff'
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = member?.name ? `${member.name}_Test1.png` : 'Test1.png';
      const file = new File([blob], fileName, { type: 'image/png' });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'テスト画像',
        });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('画像保存エラー:', err);
      alert('画像の保存に失敗しました。');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!member) return null;

  return (
    <>
      <button 
        type="button" 
        onClick={handleDownloadProfile}
        disabled={isDownloading}
        className={buttonClassName}
      >
        {showIcon && <Share className="w-5 h-5" />}
        <span>{isDownloading ? '処理中...' : buttonText}</span>
      </button>

      {/* 前回成功した opacity: 0.01 の配置 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -9999,
          opacity: 0.01,
          pointerEvents: 'none',
          transform: 'translateZ(0)'
        }}
      >
        <div id="profile-card-export" className="w-[960px] h-[540px] bg-gray-50 flex overflow-hidden font-sans border border-gray-200 relative">
          
          <div className="w-[360px] h-full relative bg-gray-200 shrink-0">
            {base64Image ? (
              <img src={base64Image} alt="" className="absolute inset-0 w-full h-full object-cover" decoding="sync" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">No Image</div>
            )}
            
            {/* ▼ 削除：グラデーション (bg-gradient-to-t) ▼ */}
            
            <div className="absolute bottom-0 left-0 w-full px-8 pb-10 text-white">
              <p className="text-lg font-bold text-gray-800 mb-1 tracking-widest">{member.furigana}</p>
              <h2 className="text-4xl font-bold mb-4 text-black">{member.name}</h2>
              <div className="flex gap-2 flex-wrap">
                {/* ▼ 削除：Starアイコン ▼ */}
                {member.is_core_member && <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-500">コアメンバー</span>}
                <span className="bg-black/50 text-xs font-bold px-3 py-1 rounded-full border border-gray-400">{member.attribute}</span>
                <span className="bg-black/50 text-xs font-bold px-3 py-1 rounded-full border border-gray-400">{member.prefecture}{member.city && ` ${member.city}`}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 bg-gray-50 flex flex-col justify-between relative">
            <div className="flex justify-between items-end border-b-2 border-blue-600 pb-2 mb-3">
              <h1 className="text-2xl font-bold text-blue-900 tracking-wider">MEMBER PROFILE</h1>
              {/* ▼ 削除：JYCロゴSVG ▼ */}
              <div className="h-12 font-bold text-blue-900 flex items-end">JYC LOGO</div>
            </div>

            <div className="mb-3">
              {/* ▼ 削除：Starアイコン ▼ */}
              <h3 className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">若者協議会で実現したいこと</h3>
              <div className="bg-white p-3 rounded-xl border border-gray-300 min-h-[90px] flex items-center">
                <p className={`font-bold text-black break-words w-full ${getDynamicTextClass(member.goal, 'goal')}`}>{member.goal || '未設定'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 flex-1 pb-2">
              <div className="bg-white p-3 rounded-xl border border-gray-300 flex flex-col overflow-hidden">
                <h4 className="text-[10px] font-bold text-gray-500 mb-2 border-b border-gray-200 pb-1">所属委員会・大プロジェクト</h4>
                <div className="flex flex-wrap gap-1 overflow-hidden">
                  {bigProjects.length > 0 ? (
                    <>
                      {bigProjects.slice(0, MAX_BIG_TAGS).map(t => (
                        <span key={t.name} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${t.status === '終了済み' ? 'bg-gray-100 text-gray-600 border-gray-300' : (t.type === 'committee' || t.type === 'branch' ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-orange-50 text-orange-800 border-orange-300')}`}>{t.name}</span>
                      ))}
                      {bigProjects.length > MAX_BIG_TAGS && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">他{bigProjects.length - MAX_BIG_TAGS}個</span>}
                    </>
                  ) : <span className="text-[10px] text-gray-500 font-bold">未設定</span>}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-300 flex flex-col overflow-hidden">
                <h4 className="text-[10px] font-bold text-gray-500 mb-2 border-b border-gray-200 pb-1">小プロジェクト</h4>
                <div className="flex flex-wrap gap-1 overflow-hidden">
                  {smallProjects.length > 0 ? (
                    <>
                      {smallProjects.slice(0, MAX_SMALL_TAGS).map(t => (
                        <span key={t.name} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${t.status === '終了済み' ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-green-50 text-green-800 border-green-300'}`}>{t.name}</span>
                      ))}
                      {smallProjects.length > MAX_SMALL_TAGS && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-300">他{smallProjects.length - MAX_SMALL_TAGS}個</span>}
                    </>
                  ) : <span className="text-[9px] text-gray-500 font-bold">未設定</span>}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-300 flex flex-col overflow-hidden">
                <h4 className="text-[10px] font-bold text-gray-500 mb-1 border-b border-gray-200 pb-1">JYC以外の活動、SNS</h4>
                <div className="overflow-hidden flex-1 relative mt-1">
                  <p className={`font-bold text-black whitespace-pre-wrap break-all ${getDynamicTextClass((member.outside_activities||'') + (member.sns_links||''), 'free')}`}>
                    {member.outside_activities && <span>{member.outside_activities}</span>}
                    {member.outside_activities && member.sns_links && <br/>}
                    {/* ▼ 削除：LinkIcon ▼ */}
                    {member.sns_links && <span className="text-blue-600 flex items-start gap-1"><span>{member.sns_links}</span></span>}
                    {!member.outside_activities && !member.sns_links && <span className="text-gray-500">未設定</span>}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-300 flex flex-col overflow-hidden">
                <h4 className="text-[10px] font-bold text-gray-500 mb-1 border-b border-gray-200 pb-1">自由記述</h4>
                <div className="overflow-hidden flex-1 relative mt-1">
                  <p className={`font-bold text-black whitespace-pre-wrap ${getDynamicTextClass(member.free_text, 'free')}`}>{member.free_text || <span className="text-gray-500">未設定</span>}</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
