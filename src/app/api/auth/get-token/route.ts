import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get('token');

    if (!tokenCookie) {
      return NextResponse.json({ success: false, message: 'Token not found' }, { status: 401 });
    }

    return NextResponse.json({ success: true, token: tokenCookie.value });
  } catch (error: any) {
    console.error('Error getting token:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
