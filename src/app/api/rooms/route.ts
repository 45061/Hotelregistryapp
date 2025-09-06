import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Room, { IRoom } from '@/lib/models/room.model';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const hotel = req.nextUrl.searchParams.get('hotel');
    const query: any = {};
    if (hotel) {
      query.hotel = hotel;
    }
    const rooms = await (Room as mongoose.Model<IRoom>).find(query);
    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const room = await (Room as mongoose.Model<IRoom>).create(body);
    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
