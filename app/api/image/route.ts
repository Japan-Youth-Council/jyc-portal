import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  try {
    // 1. URLからファイルのIDを取得
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) return new NextResponse('IDが指定されていません', { status: 400 });

    // 環境変数の不足チェック
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return new NextResponse('サーバー設定エラー', { status: 500 });
    }

    // 安全にプライベートキーを取得してパース（ダブルクォーテーション除去＆改行復元）
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');

    // 2. サービスアカウントで認証（読み込み権限）
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. Driveから画像データを直接ダウンロード（ArrayBufferとして取得）
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );

    // 4. ダウンロードしたデータを Uint8Array に変換してブラウザに返す（型エラー解消）
    const bufferData = new Uint8Array(response.data as ArrayBuffer);

    return new NextResponse(bufferData, {
      headers: {
        'Content-Type': response.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // ブラウザにキャッシュさせて高速化
      },
    });

  } catch (error: any) {
    console.error('❌ 画像取得エラー詳細:', error.message || error);
    return new NextResponse('画像が見つかりません', { status: 404 });
  }
}