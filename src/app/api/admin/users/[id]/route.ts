import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from 'mongoose';
import User, { IUser } from "@/lib/models/user.model";
import jwt from "jsonwebtoken";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id } = params;

  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const token = tokenCookie.value;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded || !decoded.isSuperUser) {
      return NextResponse.json({ success: false, error: "Unauthorized: Not a SuperAdmin" }, { status: 403 });
    }

    const body = await req.json();
    const { authorized, isAdmin, isWaitress } = body; // Added isWaitress

    const updatedUser = await (User as mongoose.Model<IUser>).findByIdAndUpdate( // Added mongoose.Model<IUser> cast
      id,
      { authorized, isAdmin, isWaitress }, // Added isWaitress
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (PUT /api/admin/users/[id]):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
