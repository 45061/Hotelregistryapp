import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user.model";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { success: false, error: "Email, token and password are required" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(String(token)).digest("hex");
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await (User as any).findOne({
      email: normalizedEmail,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "El enlace de recuperación es inválido o ya venció." },
        { status: 400 }
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Tu contraseña fue actualizada correctamente.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
