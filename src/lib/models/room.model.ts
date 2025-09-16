import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking {
  checkIn: Date;
  checkOut: Date;
}

export interface IRoom extends Document {
  roomNumber: string;
  bookings: IBooking[];
  price: number;
  supplies: string[];
  hotel: string;
  state: string; // Added
  traveler: mongoose.Types.ObjectId | null; // Added
  roomType: string; // Added
  towels: number;
}

const RoomSchema: Schema = new Schema({
  roomNumber: { type: String, required: true, unique: true },
  bookings: [
    { 
      checkIn: { type: Date }, // Removed required: true
      checkOut: { type: Date }, // Removed required: true
    }
  ],
  price: { type: Number }, // Removed required: true,
  supplies: [{ type: String }],
  hotel: { type: String, required: true },
  state: { type: String, default: 'available' }, // Added
  traveler: { type: mongoose.Schema.Types.ObjectId, ref: 'Traveler', default: null }, // Added
  roomType: { type: String, required: true }, // Added
  towels: { type: Number, default: 0 },
});

const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
