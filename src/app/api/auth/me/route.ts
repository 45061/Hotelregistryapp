import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import User, { IUser } from '@/lib/models/user.model';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const token = tokenCookie.value;
    const decoded = jwt.verify(token, SECRET) as { id: string, isAdmin: boolean, authorized: boolean, isSuperUser: boolean, isWaitress: boolean }; // Added isWaitress

    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await (User as mongoose.Model<IUser>).findById(decoded.id).select('+authorized +isWaitress'); // Added isWaitress and cast

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id: user._id, isAdmin: user.isAdmin, authorized: user.authorized, isSuperUser: user.isSuperUser, isWaitress: user.isWaitress } }); // Added isWaitress
  } catch (error) {
    console.error('Error fetching user details:', error);
    // If token is expired or invalid, jwt.verify will throw an error
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
