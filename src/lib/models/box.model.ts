import mongoose, { Schema, Document } from 'mongoose';

export interface IBox extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  userIdOpenBox: mongoose.Schema.Types.ObjectId;
  userIdCloseBox: mongoose.Schema.Types.ObjectId;
  nameBox: string;
  lastClosingBalance?: number;
  timesOpen: number;
  lastOpening: string;
  lastClosing: string;
  activeBox: boolean;
  initialBalance: number;
  cashReseived: mongoose.Schema.Types.ObjectId[];
  cashWithdrawn: mongoose.Schema.Types.ObjectId[];
  existingBalance: number;
}

const boxSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userIdOpenBox: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userIdCloseBox: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    nameBox: {
      type: String,
      required: true,
    },
    lastClosingBalance: {
      type: Number,
      required: false,
    },
    timesOpen: Number,
    lastOpening: String,
    lastClosing: String,
    activeBox: Boolean,
    initialBalance: Number,
    cashReseived: {
      type: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
    },
    cashWithdrawn: {
      type: [{ type: Schema.Types.ObjectId, ref: "Withdraw" }],
    },
    existingBalance: Number,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Box = mongoose.models.Box || mongoose.model<IBox>('Box', boxSchema);

export default Box;