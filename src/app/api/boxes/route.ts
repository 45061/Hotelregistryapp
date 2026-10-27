import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Box from "@/lib/models/box.model";
import User from "@/lib/models/user.model";
import jwt from "jsonwebtoken";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const token = req.cookies.get("token")?.value;
    let isSuperUser = false;

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          const user = await (User as any).findById(decoded.id).select("isSuperUser");
          if (user?.isSuperUser) {
            isSuperUser = true;
          }
        }
      } catch {
        // Token inválido o expirado
      }
    }

    const filter = isSuperUser ? {} : { isHidden: { $ne: true } };

    const boxes = await (Box as any)
      .find(filter)
      .populate("userId", "firstName lastName")
      .populate("userIdOpenBox", "firstName lastName")
      .populate("cashReseived")
      .populate("cashWithdrawn");

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
    const user = await (User as any).findById(userId);
    const body = await req.json();

    // Solo superadmin puede crear cajas ocultas por defecto
    const isHidden = user?.isSuperUser ? Boolean(body.isHidden) : false;

    const newBox = await (Box as any).create({
      ...body,
      isHidden,
      userId: userId,
      userIdOpenBox: userId,
    });

    return NextResponse.json({ success: true, data: newBox }, { status: 201 });
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (POST /api/boxes):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
