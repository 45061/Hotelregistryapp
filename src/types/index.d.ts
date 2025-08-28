declare interface TravelerRecord {
  _id?: string;
  roomNumber: string;
  date: string;
  name: string;
  nationality: string;
  headquarters: string;
  origin: string;
  reservedNights: number;
  reservationLocation: string;
  arrivalTime: string;
  destination: string;
  idType: string;
  idNumber: string;
  expeditionPlace: string;
  breakfast: boolean;
  amountPaid: number;
  paymentMethod: string;
  companions?: { name: string; idNumber: string; idType: string; expeditionPlace: string }[];
}

// Renamed to avoid clashing with Mongoose's User model
declare interface AppUser {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password?: string; // Optional as it's not always returned
  isAdmin: boolean;
  isSuperUser: boolean;
  authorized: boolean;
  createdAt?: string;
  updatedAt?: string;
}