import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Box from "@/lib/models/box.model";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const token = tokenCookie.value;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    const openBox = await (Box as any).findOne({ activeBox: true, userIdOpenBox: userId })
      .populate("userId", "firstName lastName")
      .populate("userIdOpenBox", "firstName lastName")
      .populate("cashReseived")
      .populate("cashWithdrawn");

    if (!openBox) {
      return NextResponse.json({ success: true, data: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: openBox }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (GET /api/boxes/openBoxForUser):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
