import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Box from '@/lib/models/box.model';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    // 1. Get user from token
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const token = tokenCookie.value;
    const decoded = jwt.verify(token, SECRET as string) as { id: string };
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.id;

    // 2. Get box ID from URL
    const boxId = params.id;

    // 3. Find the box
    const box = await Box.findById(boxId);
    if (!box) {
      return NextResponse.json({ success: false, error: 'Box not found' }, { status: 404 });
    }

    // 4. Update the box
    box.userIdOpenBox = userId;
    box.activeBox = true;
    box.lastOpening = new Date().toISOString();
    box.timesOpen = (box.timesOpen || 0) + 1;

    await box.save();

    return NextResponse.json({ success: true, data: box });

  } catch (error: any) {
    console.error('Error opening box:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
