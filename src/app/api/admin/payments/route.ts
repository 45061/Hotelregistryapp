import { NextRequest, NextResponse } from 'next/server';
import Payment, { IPayment } from '@/lib/models/payment.model';
import Withdraw, { IWithdraw } from '@/lib/models/withdraw.model';
import dbConnect from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import Traveler from '@/lib/models/traveler.model';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Please provide a date range' }, { status: 400 });
    }

    const paymentsFilter: any = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const paymentsData = await Payment.find<IPayment>(paymentsFilter).populate('userId', 'firstName lastName');

    const detailedPayments = await Promise.all(
      paymentsData.map(async (payment) => {
        const traveler = await Traveler.findOne({ roomNumber: payment.roomId });
        return {
          ...payment.toObject(),
          user: payment.userId, // Rename userId to user
          traveler: traveler ? { roomNumber: traveler.roomNumber } : null,
        };
      })
    );

    const totalCash = paymentsData.reduce((acc, payment) => acc + payment.cash, 0);

    const paymentsByMethod = {} as Record<string, number>;
    paymentsData.forEach(payment => {
      paymentsByMethod[payment.typePayment] = (paymentsByMethod[payment.typePayment] || 0) + payment.cash;
    });

    const withdrawalsFilter: any = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const withdrawalsData = await Withdraw.find<IWithdraw>(withdrawalsFilter).populate('userId', 'firstName lastName');

    const detailedWithdrawals = withdrawalsData.map(withdrawal => ({
      ...withdrawal.toObject(),
      user: withdrawal.userId,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalCash,
        paymentsByMethod,
        payments: detailedPayments, // Devolver los pagos detallados
        withdrawals: detailedWithdrawals,
      },
    });
  } catch (error) {
    console.error('Error fetching payments data:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
