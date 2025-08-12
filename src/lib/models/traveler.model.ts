
import mongoose, { Schema, models } from "mongoose";

const travelerSchema = new Schema({
    roomNumber: { type: String, required: true },
    date: { type: Date, required: true },
    name: { type: String, required: true },
    nationality: { type: String, required: true },
    headquarters: { type: String, required: true },
    origin: { type: String, required: true },
    reservedNights: { type: Number, required: true },
    reservationLocation: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    destination: { type: String, required: true },
    idType: { type: String, required: true },
    idNumber: { type: String, required: true },
    expeditionPlace: { type: String, required: true },
    breakfast: { type: Boolean, required: true },
    amountPaid: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    companions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Companion' }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const TravelerRecord = models.TravelerRecord || mongoose.model("TravelerRecord", travelerSchema);

export default TravelerRecord;
