export type CalendarDay = {
  key: string;
  iso: string;
  dayNumber: number;
  weekDayShort: string;
  monthShort: string;
};

export type ReservationPayment = {
  _id?: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes?: string;
  registeredBy?: string;
};

export type ReservationBlock = {
  id: string;
  guestName: string;
  phoneNumber: string;
  email: string;
  hasIva: boolean;
  paymentMethod: string;
  notes: string;
  guestCount: number;
  roomPrice: number;
  travelerId: string | null;
  isPersisted: boolean;
  roomId: string | null;
  roomNumber: string;
  roomType: string;
  hotel: string;
  status: string;
  source: string | null;
  checkIn: string;
  checkOut: string;
  startOffsetDays: number;
  spanDays: number;
  isClippedStart: boolean;
  isClippedEnd: boolean;
  colorKey: string;
  payments?: ReservationPayment[];
  totalPrice?: number;
  totalPaid?: number;
  pendingDebt?: number;
  hasPendingDebt?: boolean;
};

export type CalendarRoom = {
  roomId: string;
  roomNumber: string;
  hotel: string;
  state: string;
  reservations: ReservationBlock[];
};

export type CalendarGroup = {
  roomType: string;
  rooms: CalendarRoom[];
};

export type RoomOption = {
  _id: string;
  roomNumber: string;
  hotel: string;
  roomType: string;
};

export type ReservationFormState = {
  guestName: string;
  phoneNumber: string;
  email: string;
  hasIva: boolean;
  paymentMethod: string;
  guestCount: string;
  roomPrice: string;
  roomId: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source: string;
  notes: string;
};

export type ReservationExtraDraft = {
  id: string;
  name: string;
  unitValue: string;
  quantity: string;
};

export type ReservationExtraPayload = {
  name: string;
  unitValue: number;
  quantity: number;
  totalValue: number;
};
