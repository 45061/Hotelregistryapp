
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    const user = await (User as any).findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, authorized: user.authorized, isSuperUser: user.isSuperUser }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const response = NextResponse.json(
      { success: true, token },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
