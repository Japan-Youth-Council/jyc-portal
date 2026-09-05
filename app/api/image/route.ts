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
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      // 読み込み専用のスコープを指定
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. Driveから画像データを直接ダウンロード（ArrayBufferとして取得）
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    );

    // 4. ダウンロードしたデータを画像としてブラウザに返す
    return new NextResponse(response.data as Buffer, {
      headers: {
        'Content-Type': response.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // ブラウザにキャッシュさせて高速化
      },
    });

  } catch (error) {
    console.error('❌ 画像取得エラー:', error);
    // エラー時はダミーの空画像を返すなどのフォールバックも可能ですが、まずは404を返します
    return new NextResponse('画像が見つかりません', { status: 404 });
  }
}