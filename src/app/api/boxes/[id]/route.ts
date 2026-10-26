import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Box from "@/lib/models/box.model";
import User from "@/lib/models/user.model";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id } = params;

  try {
    const box = await (Box as any).findById(id).populate("user", "name");

    if (!box) {
      return NextResponse.json({ success: false, error: "Box not found" }, { status: 404 });
    }

    // Si la caja está oculta, verificar que el usuario sea superadmin
    if (box.isHidden) {
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
        } catch {}
      }

      if (!isSuperUser) {
        return NextResponse.json({ success: false, error: "Box not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, data: box });
  } catch (error: any) {
    console.error("API Error (GET /api/boxes/[id]):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

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

    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const user = await (User as any).findById(decoded.id);
    const body = await req.json();

    // Si se intenta modificar isHidden, validar que sea superadmin
    if (body.isHidden !== undefined && !user?.isSuperUser) {
      return NextResponse.json(
        { success: false, error: "Permiso denegado: Solo super admin puede modificar la visibilidad de la caja" },
        { status: 403 }
      );
    }

    const updatedBox = await (Box as any).findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updatedBox) {
      return NextResponse.json({ success: false, error: "Box not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedBox });
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (PUT /api/boxes/[id]):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  const { id } = params;

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

    const deletedBox = await (Box as any).findByIdAndDelete(id);

    if (!deletedBox) {
      return NextResponse.json({ success: false, error: "Box not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    console.error("API Error (DELETE /api/boxes/[id]):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
