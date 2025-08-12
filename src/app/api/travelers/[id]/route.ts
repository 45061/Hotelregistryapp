import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Traveler from '@/lib/models/traveler.model';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id } = params;

  try {
    const traveler = await (Traveler as any).findById(id).populate('companions');

    if (!traveler) {
      return NextResponse.json({ success: false, error: 'Traveler not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: traveler });
  } catch (error) {
    console.error('Error fetching traveler details:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id } = params;

  try {
    const body = await req.json();

    // Exclude date and arrivalTime from the update operation
    const { date, arrivalTime, ...updateData } = body;

    const updatedTraveler = await (Traveler as any).findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedTraveler) {
      return NextResponse.json({ success: false, error: 'Traveler not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTraveler });
  } catch (error) {
    console.error('Error updating traveler:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id } = params;

  try {
    const deletedTraveler = await (Traveler as any).findByIdAndDelete(id);

    if (!deletedTraveler) {
      return NextResponse.json({ success: false, error: 'Traveler not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting traveler:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
