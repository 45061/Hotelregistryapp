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

declare interface User {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password?: string; // Optional as it's not always returned
  isAdmin: boolean;
  isSuperUser: boolean;
  authorized: boolean;
  cashRole?: 'Cajero' | 'Supervisor' | 'Administrador';
  createdAt?: string;
  updatedAt?: string;
}

declare interface PaymentMethod {
  _id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

declare interface CashTransaction {
  _id?: string;
  dateTime: string;
  type: 'Ingreso' | 'Salida';
  concept: string;
  amount: number;
  paymentMethod: string | PaymentMethod;
  room?: string;
  user: string | User;
  referencePMS?: string;
  createdAt?: string;
  updatedAt?: string;
}