const IVA_RATE = 0.19;

function roundPrice(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

export function calculateReservationAmounts(roomPrice: number, hasIva: boolean) {
  const roomPriceWithoutIva = Math.max(0, roundPrice(Number(roomPrice || 0)));

  if (!hasIva) {
    return {
      roomPriceWithoutIva,
      roomPriceWithIva: roomPriceWithoutIva,
      ivaAmount: 0,
    };
  }

  const ivaAmount = roundPrice(roomPriceWithoutIva * IVA_RATE);
  const roomPriceWithIva = roundPrice(roomPriceWithoutIva + ivaAmount);

  return {
    roomPriceWithoutIva,
    roomPriceWithIva,
    ivaAmount,
  };
}

export function calculateReservationBalance(reservation: {
  roomPrice?: number;
  hasIva?: boolean;
  roomPriceWithIva?: number;
  extras?: Array<{ totalValue?: number; unitValue?: number; quantity?: number }>;
  payments?: Array<{ amount?: number }>;
  status?: string;
  pendingDebt?: number;
}) {
  const pricing = calculateReservationAmounts(
    Number(reservation.roomPrice || 0),
    Boolean(reservation.hasIva)
  );
  const roomPriceWithIva = Number(
    reservation.roomPriceWithIva !== undefined &&
      reservation.roomPriceWithIva !== null &&
      !Number.isNaN(reservation.roomPriceWithIva)
      ? reservation.roomPriceWithIva
      : pricing.roomPriceWithIva
  );

  const extrasTotal = (reservation.extras || []).reduce((sum, extra) => {
    const val = Number(extra?.totalValue);
    if (!Number.isNaN(val) && val > 0) return sum + val;
    const unit = Number(extra?.unitValue || 0);
    const qty = Number(extra?.quantity || 0);
    return sum + unit * qty;
  }, 0);

  const totalPrice = Math.round(roomPriceWithIva + extrasTotal);

  const totalPaid = (reservation.payments || []).reduce((sum, p) => {
    return sum + (Number(p?.amount) || 0);
  }, 0);

  const pendingDebt = Math.max(0, totalPrice - totalPaid);
  const hasPendingDebt = reservation.status !== "cancelled" && pendingDebt > 0;

  return {
    roomPriceWithIva,
    extrasTotal,
    totalPrice,
    totalPaid,
    pendingDebt,
    hasPendingDebt,
  };
}

export { IVA_RATE };
