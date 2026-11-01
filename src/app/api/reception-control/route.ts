import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ReceptionControl from "@/lib/models/reception-control.model";
import jwt from "jsonwebtoken";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha");

    if (fecha) {
      const record = await (ReceptionControl as any)
        .findOne({ fecha })
        .populate("userId", "firstName lastName username email")
        .sort({ updatedAt: -1 });

      return NextResponse.json({ success: true, data: record }, { status: 200 });
    }

    // Si no se pasa fecha, listar los últimos 30 registros
    const records = await (ReceptionControl as any)
      .find({})
      .populate("userId", "firstName lastName username email")
      .sort({ fecha: -1 })
      .limit(30);

    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (GET /api/reception-control):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener control de caja" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const token = req.cookies.get("token")?.value;
    let userId = null;

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          userId = decoded.id;
        }
      } catch (err) {
        // Token no válido o expirado, continuamos si el middleware ya autorizó la ruta
      }
    }

    const body = await req.json();
    const {
      fecha,
      valorCajaInicio7AM,
      valorCajaFinalDia,
      ingresos,
      egresos,
      totales,
    } = body;

    if (!fecha) {
      return NextResponse.json(
        { success: false, error: "La fecha es requerida" },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      fecha,
      valorCajaInicio7AM: Number(valorCajaInicio7AM) || 0,
      valorCajaFinalDia: Number(valorCajaFinalDia) || 0,
      ingresos: Array.isArray(ingresos) ? ingresos : [],
      egresos: Array.isArray(egresos) ? egresos : [],
      totales: totales || {},
    };

    if (userId) {
      updatePayload.userId = userId;
    }

    // Actualiza el registro de esa fecha o lo crea si no existe (upsert)
    const savedRecord = await (ReceptionControl as any).findOneAndUpdate(
      { fecha },
      updatePayload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Control de caja guardado en la base de datos correctamente",
        data: savedRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error (POST /api/reception-control):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al guardar control de caja" },
      { status: 500 }
    );
  }
}
