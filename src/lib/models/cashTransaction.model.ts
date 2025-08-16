import mongoose, { Schema, models } from 'mongoose';

const cashTransactionSchema = new Schema({
  dateTime: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['Ingreso', 'Salida'], required: true },
  concept: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  room: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  referencePMS: { type: String },
}, { timestamps: true });

const CashTransaction = models.CashTransaction || mongoose.model('CashTransaction', cashTransactionSchema);

export default CashTransaction;
