import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { format } from 'date-fns-tz';
import Payment, { IPayment } from '@/lib/models/payment.model';
import Withdraw, { IWithdraw } from '@/lib/models/withdraw.model';
import dbConnect from '@/lib/db';
import Traveler from '@/lib/models/traveler.model';
import { FilterQuery } from 'mongoose';
import User from '@/lib/models/user.model';

const formatToCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const drawTable = (doc: PDFKit.PDFDocument, startY: number, headers: string[], data: any[][], colWidths: number[]) => {
    let currentY = startY;
    const rowHeight = 20;
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, i) => {
        doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: colWidths[i] - 10, align: 'left' });
    });
    doc.font('Helvetica');
    currentY += rowHeight;
    doc.moveTo(50, currentY - 10).lineTo(50 + colWidths.reduce((a, b) => a + b, 0), currentY - 10).stroke();

    data.forEach(row => {
        row.forEach((cell, i) => {
            doc.text(String(cell), 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: colWidths[i] - 10, align: 'left' });
        });
        currentY += rowHeight;
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }
    });
    return currentY;
};

const generateReportPdf = (reportData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    const buffers: any[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    doc.fontSize(20).text(`Reporte Diario - ${reportData.reportDate}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Resumen por Usuario');
    doc.moveDown();
    let lastY = doc.y;
    Object.entries(reportData.userIncomeSummary).forEach(([userName, summary]: [string, any]) => {
        doc.fontSize(12).font('Helvetica-Bold').text(userName, 50, lastY, { continued: true });
        doc.font('Helvetica').text(` - Total: ${formatToCOP(summary.total)}`);
        lastY += 20;
        Object.entries(summary.payments).forEach(([method, total]: [string, any]) => {
            doc.fontSize(10).text(`    - ${method}: ${formatToCOP(total)}`);
            lastY += 15;
        });
        lastY += 10;
        doc.y = lastY;
        if (doc.y > 700) {
            doc.addPage();
            lastY = 50;
            doc.y = lastY;
        }
    });
    doc.moveDown(2);

    if (reportData.withdrawals && reportData.withdrawals.length > 0) {
        doc.y = lastY > 650 ? 50 : lastY + 20;
        if (lastY > 650) doc.addPage();
        doc.fontSize(16).text('Retiros Detallados');
        doc.moveDown();
        doc.font('Helvetica').fontSize(10);
        const withdrawalHeaders = ['Usuario', 'Monto', 'Razón'];
        
        const withdrawalRows = reportData.withdrawals.map((w: any) => {
            const userName = w.user?.firstName || 'N/A';
            return [userName, formatToCOP(w.cash), w.reasonOfWithdraw];
        });

        lastY = drawTable(doc, doc.y, withdrawalHeaders, withdrawalRows, [150, 100, 230]);
    }

    if (reportData.payments && reportData.payments.length > 0) {
        doc.y = lastY > 650 ? 50 : lastY + 20;
        if (lastY > 650) doc.addPage();
        doc.fontSize(16).text('Transacciones Detalladas');
        doc.moveDown();
        doc.font('Helvetica').fontSize(10);
        const paymentHeaders = ['Usuario', 'Habitación', 'Medio de Pago', 'Concepto', 'Valor'];
        const paymentRows = reportData.payments.map((p: any) => {
            const userName = p.user?.firstName || 'N/A';
            const room = p.traveler?.roomNumber || 'N/A';
            return [userName, room, p.typePayment, p.reasonOfPay, formatToCOP(p.cash)];
        });
        lastY = drawTable(doc, doc.y, paymentHeaders, paymentRows, [100, 70, 100, 150, 60]);
    }

    doc.y = lastY > 650 ? 50 : lastY + 20;
    if (lastY > 650) doc.addPage();
    doc.fontSize(16).text('Resumen de Transacciones');
    doc.moveDown();
    lastY = doc.y;
    Object.entries(reportData.paymentsByMethod).forEach(([method, total]: [string, any]) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${method}:`, 50, lastY);
        doc.font('Helvetica').text(formatToCOP(total), 200, lastY);
        lastY += 20;
    });
    doc.font('Helvetica-Bold').text('Gran Total:', 50, lastY);
    doc.text(formatToCOP(reportData.totalCash), 200, lastY);

    doc.end();
  });
};

const sendEmailWithAttachment = async (pdfBuffer: Buffer, reportData: any) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.REPORT_RECIPIENT,
    subject: `Reporte Diario de Caja - ${reportData.reportDate}`,
    html: `<h1>Reporte de Caja</h1><p>Adjunto encontrarás el reporte de caja para el día ${reportData.reportDate}.</p>`,
    attachments: [{ filename: `reporte-${reportData.reportDate}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  };

  await transporter.sendMail(mailOptions);
  console.log('Report email sent successfully.');
};

export async function GET(req: NextRequest) {
  console.log('Generating and sending daily report...');

  try {
    console.log('--- Debugging Email Environment Variables ---');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS is set:', !!process.env.EMAIL_PASS);
    console.log('-------------------------------------------');
    await dbConnect();
    
    const timeZone = 'America/Bogota';
    const now = new Date();

    const year = parseInt(format(now, 'yyyy', { timeZone }));
    const month = parseInt(format(now, 'MM', { timeZone }));
    const day = parseInt(format(now, 'dd', { timeZone }));

    let endDate = new Date(Date.UTC(year, month - 1, day, 11, 30, 0, 0));

    if (now.getTime() < endDate.getTime()) {
        endDate.setDate(endDate.getDate() - 1);
    }

    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    const paymentsFilter: FilterQuery<IPayment> = { createdAt: { $gte: startDate, $lte: endDate } };
    const paymentsFound = await (Payment.find as any)(paymentsFilter);
    const paymentsData = await User.populate(paymentsFound, { path: 'userId', select: 'firstName lastName' });
    const detailedPayments = await Promise.all(
      paymentsData.map(async (payment: any) => {
        const traveler = await Traveler.findOne({ roomNumber: payment.roomId });
        return { ...payment.toObject(), user: payment.userId, traveler: traveler ? { roomNumber: traveler.roomNumber, headquarters: traveler.headquarters, name: traveler.name } : null, reasonOfPay: payment.reasonOfPay };
      })
    );
    const totalCash = paymentsData.reduce((acc: number, payment: any) => acc + payment.cash, 0);
    const paymentsByMethod = {} as Record<string, number>;
    paymentsData.forEach((payment: any) => {
      paymentsByMethod[payment.typePayment] = (paymentsByMethod[payment.typePayment] || 0) + payment.cash;
    });

    const userIncomeSummary = detailedPayments.reduce((acc, payment) => {
        const userName = payment.user?.firstName || 'N/A';
        if (!acc[userName]) {
            acc[userName] = { total: 0, payments: {} };
        }
        acc[userName].total += payment.cash;
        if (!acc[userName].payments[payment.typePayment]) {
            acc[userName].payments[payment.typePayment] = 0;
        }
        acc[userName].payments[payment.typePayment] += payment.cash;
        return acc;
    }, {} as Record<string, { total: number; payments: Record<string, number> }>);

    const withdrawalsFilter: FilterQuery<IWithdraw> = { createdAt: { $gte: startDate, $lte: endDate } };
    const withdrawalsFound = await (Withdraw.find as any)(withdrawalsFilter);
    const withdrawalsData = await User.populate(withdrawalsFound, { path: 'userId', select: 'firstName lastName' });
    const detailedWithdrawals = withdrawalsData.map((withdrawal: any) => ({ ...withdrawal.toObject(), user: withdrawal.userId, reasonOfWithdraw: withdrawal.reasonOfWithdraw }));

    const reportDateForTitle = format(startDate, 'yyyy-MM-dd hh:mm a', { timeZone });
    const reportData = {
        reportDate: reportDateForTitle,
        totalCash,
        paymentsByMethod,
        payments: detailedPayments,
        withdrawals: detailedWithdrawals,
        userIncomeSummary,
    };

    const pdfBuffer = await generateReportPdf(reportData);
    await sendEmailWithAttachment(pdfBuffer, reportData);

    return NextResponse.json({ success: true, message: `Report for ${reportData.reportDate} sent successfully.` });

  } catch (error) {
    console.error('Error generating or sending daily report:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}