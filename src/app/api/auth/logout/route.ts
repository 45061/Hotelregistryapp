
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    expires: new Date(0), // Set expiration to a past date
    sameSite: 'strict',
    path: '/',
  });
  return response;
}
