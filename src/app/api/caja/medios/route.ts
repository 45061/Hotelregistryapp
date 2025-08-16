import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaymentMethod from '@/lib/models/paymentMethod.model';

export async function GET() {
  await dbConnect();
  try {
    const methods = await (PaymentMethod as any).find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: methods }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
