import mongoose, { Document, Model, Schema, models } from "mongoose";

export type ReservationStatus =
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "unassigned";

export interface IReservation extends Document {
  guestName: string;
  phoneNumber?: string;
  email?: string;
  guestCount: number;
  roomPrice: number;
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
  sheetRowId?: string;
  createdBy?: mongoose.Types.ObjectId | null;
  updatedBy?: mongoose.Types.ObjectId | null;
}

const reservationSchema = new Schema<IReservation>(
  {
    guestName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    guestCount: { type: Number, default: 1, min: 1 },
    roomPrice: { type: Number, default: 0, min: 0 },
    travelerId: { type: mongoose.Schema.Types.ObjectId, ref: "TravelerRecord", default: null },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    roomNumberSnapshot: { type: String, trim: true },
    hotel: { type: String, required: true, trim: true },
    roomTypeSnapshot: { type: String, required: true, trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled", "unassigned"],
      default: "confirmed",
    },
    source: { type: String, trim: true },
    notes: { type: String, trim: true },
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

const Reservation: Model<IReservation> =
  models.Reservation || mongoose.model<IReservation>("Reservation", reservationSchema);

export default Reservation;
