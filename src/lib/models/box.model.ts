import mongoose, { Schema, Document } from 'mongoose';

export interface IBox extends Document {
  name: string;
  description?: string;
  user: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BoxSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Box = mongoose.models.Box || mongoose.model<IBox>('Box', BoxSchema);

export default Box;
