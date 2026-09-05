import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });

    // 1. ファイルを確実にBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 0バイト防止：Readable.from を使って確実に全データを流し込む
    const stream = Readable.from(buffer);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 2. アップロードを実行
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const fileId = response.data.id;

    // 3. 外部サイトの<img>タグでブロックされずに表示できる公式URLを生成
    // ※ フォルダに閲覧権限があれば、このURLでダイレクトに表示されます
    const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    
    return NextResponse.json({ url: directImageUrl });

  } catch (error: any) {
    console.error('❌ Upload Error Details:', error.message || error);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}