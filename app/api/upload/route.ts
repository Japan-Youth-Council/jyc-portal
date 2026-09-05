import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    // 🔍 デバッグ用：何が環境変数に入っているかログを出す（機密情報は伏せ字にするか、存在チェック）
    console.log('--- DEBUG ENV CHECK ---');
    console.log('CLIENT_EMAIL exists:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('PRIVATE_KEY length:', process.env.GOOGLE_PRIVATE_KEY?.length);
    console.log('PRIVATE_KEY startsWith:', process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30));
    console.log('FOLDER_ID:', process.env.GOOGLE_DRIVE_PROFILE_IMAGE_FOLDER_ID);
    console.log('-----------------------');

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_PROFILE_IMAGE_FOLDER_ID) {
      return NextResponse.json({ error: 'サーバー設定エラー（環境変数不足）' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

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
    console.error('❌ Upload Error Full Details:', error);
    return NextResponse.json({ error: 'アップロードに失敗しました: ' + error.message }, { status: 500 });
  }
}