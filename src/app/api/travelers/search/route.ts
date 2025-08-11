import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Traveler from '@/lib/models/traveler.model';

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const idNumber = searchParams.get('idNumber');

  if (!idNumber) {
    return NextResponse.json({ success: false, error: 'ID number is required' }, { status: 400 });
  }

  try {
    const travelers = await (Traveler as any).find({ idNumber }).sort({ createdAt: -1, _id: -1 }).lean();

    const traveler = travelers[0]; // Get the most recent one

    if (!traveler) {
      return NextResponse.json({ success: false, error: 'Traveler not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: traveler });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
