import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaymentMethod from '@/lib/models/paymentMethod.model';
import CashTransaction from '@/lib/models/cashTransaction.model';
import User from '@/lib/models/user.model';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const tokenCookie = req.cookies.get('token');
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const decoded: any = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!);
    if (!decoded.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decoded.id;
    const { searchParams } = new URL(req.url);
    const query: any = { user: userId };
    const tipo = searchParams.get('tipo');
    const medioPago = searchParams.get('medioPago');
    const habitacion = searchParams.get('habitacion');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    if (tipo) query.type = tipo;
    if (habitacion) query.room = habitacion;
    if (medioPago) query.paymentMethod = medioPago;
    if (fechaInicio || fechaFin) {
      query.dateTime = {};
      if (fechaInicio) query.dateTime.$gte = new Date(fechaInicio);
      if (fechaFin) query.dateTime.$lte = new Date(fechaFin);
    }
    const transactions = await (CashTransaction as any).find(query).populate('paymentMethod', 'name');
    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const {
      referenciaPMS,
      fechaHora,
      tipo,
      concepto,
      monto,
      medioPago,
      habitacion,
      usuarioCaja,
    } = body;

    let userId = usuarioCaja;
    if (!userId) {
      const tokenCookie = req.cookies.get('token');
      if (!tokenCookie) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const decoded: any = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!);
      if (!decoded.authorized) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      userId = decoded.id;
    }

    // validate user exists
    const user = await (User as any).findById(userId);
    if (!user || !user.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let paymentMethod = await (PaymentMethod as any).findOne({ name: medioPago });
    if (!paymentMethod) {
      paymentMethod = await (PaymentMethod as any).create({ name: medioPago });
    }

    const txn = await (CashTransaction as any).create({
      referencePMS: referenciaPMS,
      dateTime: fechaHora ? new Date(fechaHora) : new Date(),
      type: tipo,
      concept: concepto,
      amount: monto,
      paymentMethod: paymentMethod._id,
      room: habitacion,
      user: userId,
    });

    return NextResponse.json({ success: true, data: txn }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
