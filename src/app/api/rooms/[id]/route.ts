import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Room, { IRoom } from '@/lib/models/room.model';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;

  try {
    const body = await req.json();
        const { roomNumber, hotel, price, supplies, roomType, state, towels } = body;

    const updatedRoom = await (Room as mongoose.Model<IRoom>).findByIdAndUpdate(
      id,
      { roomNumber, hotel, price, supplies, roomType, state, towels },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return NextResponse.json({ success: false, message: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRoom });
  } catch (error: any) {
    console.error('Error updating room:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
