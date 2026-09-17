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
      // プログラム側での連続実行や待機は一切行わず、1回だけストレートに実行します
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
        【テスト用配置】
        -left-[9999px] をやめ、画面の左上に fixed で配置。
        Safariに「画面内に存在する」と認識させるため、opacity を 0.01 に設定。
      */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -9999,
          opacity: 0.01,
          pointerEvents: 'none',
          transform: 'translateZ(0)' /* GPUレンダリングを強制 */
        }}
      >
        <div id="profile-card-export" style={{ width: '360px', height: '360px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {base64Image ? (
            <img 
              src={base64Image} 
              alt="Test" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              decoding="sync" /* 読み込みの遅延を防ぐ */
            />
          ) : (
            <User size={128} color="#6b7280" />
          )}
        </div>
      </div>
    </>
  );
}
