
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TravelerRecord from "@/lib/models/traveler.model";
import jwt from "jsonwebtoken";


export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "40", 10);

    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - days);

    const records = await (TravelerRecord as any)
      .find({ date: { $gte: filterDate } })
      .populate("user", "firstName lastName");
    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (GET /api/travelers):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const token = tokenCookie.value;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;
    const body = await req.json();

    const record = await (TravelerRecord as any).create({ ...body, user: userId });
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (POST /api/travelers):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
