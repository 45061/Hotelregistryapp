import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  concept: string;
  typePayment: string;
  reasonOfPay: string;
  roomId: string;
  boxId: mongoose.Schema.Types.ObjectId;
  cash: number;
  timeTransaction: string;
}

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    concept: {
      type: String,
      required: true,
    },
    typePayment: {
      type: String,
      required: true,
    },
    reasonOfPay: {
      type: String,
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    boxId: {
      type: Schema.Types.ObjectId,
      ref: "Box",
      required: true,
    },
    cash: Number,
    timeTransaction: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
