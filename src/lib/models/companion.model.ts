import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface ICompanion extends Document {
  mainTravelerId: mongoose.Schema.Types.ObjectId;
  name: string;
  idNumber: string;
  idType: string;
  expeditionPlace: string;
}

const CompanionSchema: Schema<ICompanion> = new Schema({
  mainTravelerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Traveler', required: true },
  name: { type: String, required: true },
  idNumber: { type: String, required: true },
  idType: { type: String, required: true },
  expeditionPlace: { type: String, required: true },
});

const Companion: Model<ICompanion> = models.Companion || mongoose.model<ICompanion>('Companion', CompanionSchema);

export default Companion;
