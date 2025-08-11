
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user.model";

export async function POST(req) {
  await dbConnect();

  try {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = await req.json();

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const existingUser = await (User as any).findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists.' }, { status: 409 });
    }

    const newUser = await (User as any).create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
