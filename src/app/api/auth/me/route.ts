import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('token');

    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const token = tokenCookie.value;
    const decoded = jwt.verify(token, SECRET) as {
      id: string;
      isAdmin: boolean;
      authorized: boolean;
      isSuperUser: boolean;
      cashRole?: string;
    };

    return NextResponse.json({
      success: true,
      data: {
        id: decoded.id,
        isAdmin: decoded.isAdmin,
        authorized: decoded.authorized,
        isSuperUser: decoded.isSuperUser,
        cashRole: decoded.cashRole,
      },
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
