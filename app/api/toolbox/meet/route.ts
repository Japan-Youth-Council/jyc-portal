import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const clientEmail = process.env.MEET_CLIENT_EMAIL;
    const privateKey = process.env.MEET_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const delegateEmail = process.env.MEET_DELEGATE_EMAIL;

    if (!clientEmail || !privateKey || !delegateEmail) {
      throw new Error('環境変数が正しく設定されていません。');
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/meetings.space.created'],
      subject: delegateEmail, 
    });

    const meet = google.meet({ version: 'v2', auth });

    // 「OPEN」設定により、共同主催者機能がないライセンスでも、
    // 全員がホスト不在でノックなし入室・画面共有が可能になります。
    const response = await meet.spaces.create({
      requestBody: {
        config: {
          accessType: 'OPEN', 
        }
      }
    });

    return NextResponse.json({
      success: true,
      meetUrl: response.data.meetingUri,
    });

  } catch (error: any) {
    console.error('Meet API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}