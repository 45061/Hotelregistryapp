import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Box from "@/lib/models/box.model";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const boxes = await (Box as any).find({}).populate("userId", "firstName lastName").populate("userIdOpenBox", "firstName lastName");
    return NextResponse.json({ success: true, data: boxes }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (GET /api/boxes):", error);
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

    const newBox = await (Box as any).create({ ...body, userId: userId, userIdOpenBox: userId });
    return NextResponse.json({ success: true, data: newBox }, { status: 201 });
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (POST /api/boxes):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
