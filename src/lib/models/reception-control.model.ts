import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReceptionControl extends Document {
  fecha: string;
  userId?: mongoose.Schema.Types.ObjectId;
  valorCajaInicio7AM: number;
  valorCajaFinalDia: number;
  ingresos: Array<{
    id: number;
    bloque: string;
    concepto: string;
    medioPago: string;
    valor: number;
  }>;
  egresos: Array<{
    id: number;
    concepto: string;
    medioPago: string;
    valor: number;
  }>;
  totales: {
    valorTotalIngresos: number;
    totalIngresosEfectivo: number;
    totalOtrosMediosIngresos: number;
    desgloseOtrosMedios?: Record<string, number>;
    valorTotalEgresos: number;
    totalEgresosEfectivo: number;
    valorCajaFinalDiaCalculado: number;
    saldoNetoCalculado: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const receptionControlSchema = new Schema(
  {
    fecha: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    valorCajaInicio7AM: {
      type: Number,
      default: 0,
    },
    valorCajaFinalDia: {
      type: Number,
      default: 0,
    },
    ingresos: [
      {
        id: Number,
        bloque: String,
        concepto: String,
        medioPago: String,
        valor: Number,
      },
    ],
    egresos: [
      {
        id: Number,
        concepto: String,
        medioPago: String,
        valor: Number,
      },
    ],
    totales: {
      valorTotalIngresos: { type: Number, default: 0 },
      totalIngresosEfectivo: { type: Number, default: 0 },
      totalOtrosMediosIngresos: { type: Number, default: 0 },
      desgloseOtrosMedios: { type: Schema.Types.Mixed, default: {} },
      valorTotalEgresos: { type: Number, default: 0 },
      totalEgresosEfectivo: { type: Number, default: 0 },
      valorCajaFinalDiaCalculado: { type: Number, default: 0 },
      saldoNetoCalculado: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para consultar rápidamente por fecha
receptionControlSchema.index({ fecha: -1 });

const ReceptionControl: Model<IReceptionControl> =
  mongoose.models.ReceptionControl ||
  mongoose.model<IReceptionControl>("ReceptionControl", receptionControlSchema);

export default ReceptionControl;
