"use client";

import { useState } from 'react';
import { Video, Copy, Check, Loader2, Info, AlertCircle, FileText } from 'lucide-react';

export default function OrgMembersInfoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ★ここにGoogleドライブのファイルIDを設定してください
  const pdfFileId = "1dCXXV2yvuQO9D_2rIR1_5dmkVUPoMyh0";
  const pdfEmbedUrl = `https://drive.google.com/file/d/${pdfFileId}/preview`;

  const handleGenerateMeet = async () => {
    setIsLoading(true);
    setError(null);
    setMeetUrl(null);
    setCopied(false);

    try {
      const res = await fetch('/api/toolbox/meet', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Meetリンクの取得に失敗しました');
      }

      setMeetUrl(data.meetUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (meetUrl) {
      navigator.clipboard.writeText(meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">団体会員Info</h1>
      </div>

      {/* ============================== */}
      {/* 上段: PDF表示エリア */}
      {/* ============================== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 leading-tight">
            団体会員ネットワーク<br />
            グラウンドルール・諸規定
          </h2>
        </div>
        
        <div className="flex-grow w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200 shadow-inner mt-4">
          <iframe
            src={pdfEmbedUrl}
            className="w-full h-full min-h-[400px] md:min-h-[500px]"
            title="団体会員ネットワーク グラウンドルール・諸規定"
            allow="autoplay"
          ></iframe>
        </div>
      </div>

      {/* ============================== */}
      {/* 下段: Meet発行エリア */}
      {/* ============================== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Google Meet 発行</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-8 font-bold leading-relaxed">
          Google Meetリンクを自動発行します。時間制限なく利用可能です。
        </p>

        <div className="space-y-5 max-w-3xl">
          {meetUrl && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between gap-4">
              <span className="text-base text-blue-900 font-mono truncate">{meetUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-md transition flex items-center gap-1"
                title="URLをコピー"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-bold text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="text-sm font-bold">Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 font-bold p-3 bg-red-50 rounded-lg border border-red-100">{error}</p>
          )}

          <button
            onClick={handleGenerateMeet}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                発行中...
              </>
            ) : (
              <>
                <Video className="w-6 h-6" />
                {meetUrl ? '別のリンクを発行する' : 'Meetリンクを発行'}
              </>
            )}
          </button>
        </div>

        {/* 仕様と制限事項パネル */}
        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            発行されるMeetの仕様・制限事項
          </h3>
          <p className="text-xs text-gray-500 mb-4 font-bold">
            ※Google Workspace for Nonprofitsプラン、および「オープン」設定に基づきます。
          </p>
          
          <div className="space-y-4 text-sm text-gray-600 font-bold">
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li><span className="text-gray-800">基本スペック:</span> 最大150名まで参加可能。1回につき最長24時間まで。</li>
              <li><span className="text-gray-800">有効期限:</span> 最後に会議室が使用されてから365日間（同じURLを定期ミーティング等で使い回せます）。</li>
            </ul>
            
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-md flex gap-3 items-start mt-2">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-orange-800 text-xs leading-relaxed">
                <span className="font-bold block mb-1 text-sm">利用できない機能</span>
                本ツールで発行したURLでは「主催者管理機能」を持たないため、<span className="underline decoration-orange-300 underline-offset-2">ブレイクアウトルーム、録画、AI文字起こし機能、特定の参加者のマイクミュート強制機能</span> は使用できません。進行は参加者同士の自律的な管理をお願いします。
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-2 pl-1">
              主催者管理機能を含むGoogle Meetが必要な場合は、検討いたしますので事務局までご相談ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}