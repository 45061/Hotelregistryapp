import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaymentMethod from '@/lib/models/paymentMethod.model';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const decoded: any = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!);
    if (!decoded.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const methods = await (PaymentMethod as any).find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: methods }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
