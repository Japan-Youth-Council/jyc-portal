import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  try {
    // 1. URLからファイルのIDを取得
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');
    
    if (!fileId) return new NextResponse('IDが指定されていません', { status: 400 });

    // 2. サービスアカウントで認証（読み込み権限）
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // ▼ ここをしっかりと改行に置換するように記述します
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

  } catch (error) {
    console.error('❌ 画像取得エラー:', error);
    return new NextResponse('画像が見つかりません', { status: 404 });
  }
}