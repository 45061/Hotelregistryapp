import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/models/user.model';
import Box from '../../../../lib/models/box.model';
// import Room from '../../../../lib/models/room.model'; // Removed
import Payment from '../../../../lib/models/payment.model';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const {
      roomId, // This will now be a string
      boxId,
      concept,
      cash,
      typePayment,
      reasonOfPay,
      timeTransaction,
    } = await request.json();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authorization header missing or invalid' }, { status: 401 });
    }
    const decoded = jwt.verify(token, SECRET as string) as { id: string };
    const user = await (User as any).findById(decoded.id);

    if (!user) {
      return NextResponse.json({ message: "No find User" }, { status: 400 });
    }
    
    // Room finding and checking removed
    // const room = await Room.findById(roomId);
    // if (!room) {
    //   return NextResponse.json({ message: "No find Room" }, { status: 400 });
    // }

    const box = await Box.findById(boxId);
    if (!box) {
      return NextResponse.json({ message: "No find Box" }, { status: 400 });
    }

    const payment = await (Payment as any).create({
      boxId: box._id,
      userId: user._id,
      roomId: roomId, // Now a string
      reasonOfPay,
      typePayment,
      cash,
      concept,
      timeTransaction,
    });

    box.cashReseived.push(payment._id);
    await box.save({ validateBeforeSave: false });

    return NextResponse.json({
      message: "Los datos llegaron",
      success: true,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in payment POST:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Token not found" }, { status: 401 });
    }

    jwt.verify(token, SECRET as string);

    const payment = await Payment.find()
      .populate("userId", "firstName")
      // .populate("roomId", "roomNumer") // Removed
      .populate({
        path: "boxId",
      });

    return NextResponse.json({
      message: "Los datos llegaron",
      payment,
      success: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in payment GET:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 400 });
  }
}
