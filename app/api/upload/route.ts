import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    console.log('--- UPLOAD START ---');
    console.log('CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'OK' : 'MISSING');
    console.log('PRIVATE_KEY exists:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('FOLDER_ID:', process.env.GOOGLE_DRIVE_PROFILE_IMAGE_FOLDER_ID);

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_PROFILE_IMAGE_FOLDER_ID) {
      return NextResponse.json({ error: 'サーバー設定エラー（環境変数不足）' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // 秘密鍵の整形処理
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');

    console.log('Processed privateKey length:', privateKey.length);

    // GoogleAuthではなく、直接JWT認証を使って挙動を正確に確認する
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Attempting drive.files.create...');
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.GOOGLE_DRIVE_PROFILE_IMAGE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const fileId = response.data.id;
    const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    
    return NextResponse.json({ url: directImageUrl });

  } catch (error: any) {
    console.error('❌ Detailed Upload Error:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'アップロードに失敗しました: ' + (error.message || error) }, { status: 500 });
  }
}