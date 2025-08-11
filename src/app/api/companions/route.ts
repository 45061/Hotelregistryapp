import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Companion from '@/lib/models/companion.model';
import Traveler from '@/lib/models/traveler.model';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    // Convert mainTravelerId to ObjectId if it exists
    if (body.mainTravelerId && !mongoose.Types.ObjectId.isValid(body.mainTravelerId)) {
      return NextResponse.json({ success: false, error: 'Invalid mainTravelerId' }, { status: 400 });
    }
    const newCompanion = new Companion({
      ...body,
      mainTravelerId: body.mainTravelerId ? new mongoose.Types.ObjectId(body.mainTravelerId) : undefined,
    });
    await newCompanion.save();

    // Update the main traveler with the new companion's ID
    await (Traveler as any).findByIdAndUpdate(
      newCompanion.mainTravelerId,
      { $push: { companions: newCompanion._id } },
      { new: true, useFindAndModify: false }
    );

    return NextResponse.json({ success: true, data: newCompanion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
