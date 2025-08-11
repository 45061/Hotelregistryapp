
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TravelerRecord from "@/lib/models/traveler.model";


  export async function GET(req) {
  await dbConnect();

  try {
    const records = await (TravelerRecord as any).find({});
    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    console.error("API Error (GET /api/travelers):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  await dbConnect();

  try {
    const record = await (TravelerRecord as any).create(await req.json());
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("API Error (POST /api/travelers):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
