import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdraw extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  concept: string;
  typeWithdraw: string;
  reasonOfWithdraw: string;
  boxId: mongoose.Schema.Types.ObjectId;
  cash: number;
  timeTransaction: string;
}

const withdrawSchema = new Schema(
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
    typeWithdraw: {
      type: String,
      required: true,
    },
    reasonOfWithdraw: {
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

const Withdraw = mongoose.models.Withdraw || mongoose.model<IWithdraw>("Withdraw", withdrawSchema);

export default Withdraw;
