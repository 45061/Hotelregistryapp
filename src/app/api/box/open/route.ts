import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/models/user.model';
import Box from '../../../../lib/models/box.model';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { boxId, initialBalance } = await request.json();
    console.log("Received boxId:", boxId);

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

    console.log("Box activeBox status before update:", box.activeBox);

    if (box.activeBox) {
      return NextResponse.json({ message: "La caja ya está abierta" }, { status: 400 });
    }

    box.initialBalance = initialBalance;
    box.activeBox = true;
    box.userIdOpenBox = user._id;
    box.lastOpening = new Date().toISOString();
    box.timesOpen = (box.timesOpen || 0) + 1;

    await box.save();

    console.log("Box activeBox status after update:", box.activeBox);

    return NextResponse.json({
      message: "Caja abierta con éxito",
      success: true,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in open box POST:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 400 });
  }
}