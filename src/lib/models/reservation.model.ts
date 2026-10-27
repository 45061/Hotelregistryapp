import mongoose, { Document, Model, Schema, models } from "mongoose";

export type ReservationStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "noshow"
  | "cancelled"
  | "unassigned";

export interface IReservationExtra {
  name: string;
  unitValue: number;
  quantity: number;
  totalValue: number;
}

export interface IReservationPayment {
  _id?: string;
  amount: number;
  paymentMethod: string;
  date: Date;
  notes?: string;
  registeredBy?: string;
}

export interface IReservation extends Document {
  guestName: string;
  phoneNumber?: string;
  email?: string;
  hasIva: boolean;
  hasIvaExtras: boolean;
  paymentMethod?: string;
  guestCount: number;
  roomPrice: number;
  ivaAmount: number;
  roomPriceWithoutIva: number;
  roomPriceWithIva: number;
  travelerId?: mongoose.Types.ObjectId | null;
  roomId?: mongoose.Types.ObjectId | null;
  roomNumberSnapshot?: string;
  hotel: string;
  roomTypeSnapshot: string;
  checkIn: Date;
  checkOut: Date;
  status: ReservationStatus;
  source?: string;
  notes?: string;
  extras: IReservationExtra[];
  payments: IReservationPayment[];
  sheetRowId?: string;
  createdBy?: mongoose.Types.ObjectId | null;
  updatedBy?: mongoose.Types.ObjectId | null;
}

const reservationPaymentSchema = new Schema<IReservationPayment>(
  {
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "" },
    registeredBy: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: true }
);

const reservationExtraSchema = new Schema<IReservationExtra>(
  {
    name: { type: String, required: true, trim: true },
    unitValue: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 1, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const reservationSchema = new Schema<IReservation>(
  {
    guestName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    hasIva: { type: Boolean, default: false },
    hasIvaExtras: { type: Boolean, default: false },
    paymentMethod: { type: String, trim: true, default: "" },
    guestCount: { type: Number, default: 1, min: 1 },
    roomPrice: { type: Number, default: 0, min: 0 },
    ivaAmount: { type: Number, default: 0, min: 0 },
    roomPriceWithoutIva: { type: Number, default: 0, min: 0 },
    roomPriceWithIva: { type: Number, default: 0, min: 0 },
    travelerId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelerRecord", default: null },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    roomNumberSnapshot: { type: String, trim: true },
    hotel: { type: String, required: true, trim: true },
    roomTypeSnapshot: { type: String, required: true, trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "noshow", "cancelled", "unassigned"],
      default: "confirmed",
    },
    source: { type: String, trim: true },
    notes: { type: String, trim: true },
    extras: { type: [reservationExtraSchema], default: [] },
    payments: { type: [reservationPaymentSchema], default: [] },
    sheetRowId: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

reservationSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
reservationSchema.index({ hotel: 1, checkIn: 1 });
reservationSchema.index({ status: 1, checkIn: 1 });

reservationSchema.pre("validate", function (next) {
  if (!this.checkIn || !this.checkOut) {
    return next();
  }

  if (this.checkOut <= this.checkIn) {
    this.invalidate("checkOut", "Check-out must be later than check-in.");
  }

  if (!this.roomId && this.status !== "unassigned") {
    this.status = "unassigned";
  }

  next();
});

const existingReservationModel = models.Reservation as Model<IReservation> | undefined;

if (existingReservationModel && !existingReservationModel.schema.path("extras")) {
  delete mongoose.models.Reservation;
}

const Reservation: Model<IReservation> =
  (mongoose.models.Reservation as Model<IReservation>) ||
  mongoose.model<IReservation>("Reservation", reservationSchema);

export default Reservation;
