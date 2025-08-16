import mongoose, { Schema, models } from 'mongoose';

const paymentMethodSchema = new Schema({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });

const PaymentMethod = models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
