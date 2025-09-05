import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/db";
import User from "@/lib/models/user.model";
import jwt from "jsonwebtoken";

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

    const user = await (User as any).findById(decoded.id);

    if (!user || !user.isSuperUser) {
      return NextResponse.json({ success: false, error: "Unauthorized: Not a SuperAdmin" }, { status: 403 });
    }

    const users = await (User as any).find({});
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (GET /api/admin/users):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
