import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/models/user.model';
import Box from '../../../../lib/models/box.model';
import Withdraw from '../../../../lib/models/withdraw.model';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const {
      boxId,
      concept,
      cash,
      typeWithdraw,
      reasonOfWithdraw,
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

    const box = await Box.findById(boxId);
    if (!box) {
      return NextResponse.json({ message: "No find Box" }, { status: 400 });
    }

    const withdraw = await Withdraw.create({
      boxId: box._id,
      userId: user._id,
      reasonOfWithdraw,
      typeWithdraw,
      cash,
      concept,
      timeTransaction,
    });

    box.cashWithdrawn.push(withdraw._id);
    await box.save({ validateBeforeSave: false });

    return NextResponse.json({
      message: "Los datos llegaron",
      success: true,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in withdraw POST:', error);
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

    const withdraw = await Withdraw.find()
      .populate("userId", "firstName")
      .populate({
        path: "boxId",
      });

    return NextResponse.json({
      message: "Los datos llegaron",
      withdraw,
      success: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in withdraw GET:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 400 });
  }
}
