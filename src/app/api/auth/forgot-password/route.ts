import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user.model";
import { createEmailTransport, hasEmailConfiguration } from "@/lib/email";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await (User as any).findOne({ email: normalizedEmail }).select(
      "+resetPasswordToken +resetPasswordExpires firstName lastName email"
    );

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña.",
      });
    }

    if (!hasEmailConfiguration()) {
      return NextResponse.json(
        { success: false, error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenHash = createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const resetUrl = new URL("/reset-password", req.nextUrl.origin);
    resetUrl.searchParams.set("token", resetToken);
    resetUrl.searchParams.set("email", user.email);

    const transporter = createEmailTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Recupera tu contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="margin-bottom: 16px;">Restablecimiento de contraseña</h2>
          <p>Hola ${user.firstName || "usuario"},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>
            <a href="${resetUrl.toString()}" style="display: inline-block; padding: 12px 18px; background: #1f7a59; color: #ffffff; text-decoration: none; border-radius: 6px;">
              Restablecer contraseña
            </a>
          </p>
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p>${resetUrl.toString()}</p>
          <p>Este enlace vencerá en 1 hora.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message:
        "Si el correo existe en el sistema, recibirás un enlace para restablecer tu contraseña.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
