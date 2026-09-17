"use client";

import { useEffect, useState } from 'react';
import { Share, User } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ProfileExportCardProps {
  member: any;
  bigProjects?: any[];
  smallProjects?: any[];
  buttonClassName?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export default function ProfileExportCard({ 
  member,
  buttonClassName = "flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition px-4 py-2 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 w-full sm:w-auto",
  buttonText = "【テスト】写真のみを出力",
  showIcon = true
}: ProfileExportCardProps) {
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 画像のBase64化（元々のロジックそのまま）
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
      // ダブルレンダリング等は一切せず、純粋に1回だけ実行
      const dataUrl = await toPng(element, { 
        pixelRatio: 2, 
        backgroundColor: '#ffffff'
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = member?.name ? `${member.name}_Test.png` : 'Test.png';
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
      alert('画像の出力に失敗しました。');
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

      {/* 
        【原因切り分け用の極小レイアウト】
        複雑なCSS、グラデーション、テキストをすべて排除し、
        純粋に「プロフィール写真1枚（360x360）」だけを描画対象にする 
      */}
      <div className="absolute -left-[9999px] -top-[9999px] pointer-events-none select-none">
        <div id="profile-card-export" className="w-[360px] h-[360px] bg-gray-200 flex items-center justify-center overflow-hidden">
          {base64Image ? (
            <img 
              src={base64Image} 
              alt="Test" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <User className="w-32 h-32 text-gray-500" />
          )}
        </div>
      </div>
    </>
  );
}
