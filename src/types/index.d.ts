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