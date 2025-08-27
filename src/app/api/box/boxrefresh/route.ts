import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Box from '../../../../lib/models/box.model';
import User from '../../../../lib/models/user.model';
import Payment from '../../../../lib/models/payment.model';
import Withdraw from '../../../../lib/models/withdraw.model';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing or invalid' }, { status: 401 });
    }

    const id = authorization.split(" ")[1];

    const box = await Box.findById(id).populate({
      path: "userId userIdOpenBox cashReseived cashWithdrawn",
    });

    if (!box) {
      return NextResponse.json({ error: 'Box not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: "Box found",
      box,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
