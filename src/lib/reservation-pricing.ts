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

export { IVA_RATE };
