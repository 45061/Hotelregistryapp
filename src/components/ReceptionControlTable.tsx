"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Conceptos predefinidos para el Panel Izquierdo (Ingresos)
const BLOQUE_AZUL: string[] = [
  "Apartaestudio 221",
  "222",
  "223",
  "224",
  "225",
  "Apartaestudio 321",
  "322",
  "323",
  "324",
  "325",
  "Apartaestudio 421",
  "423",
  "424",
];

const BLOQUE_VERDE: string[] = [
  "201",
  "Apartaestudio 202",
  "203",
  "204",
  "301",
  "Apartaestudio 302",
  "303",
  "304",
  "401",
  "Apartaestudio 402",
  "403",
  "404",
];

// Las filas del bloque amarillo inician completamente en blanco (sin datos)
const FILAS_AMARILLO_INICIALES = 10;

export const MEDIOS_PAGO = [
  "Efectivo",
  "Datafono",
  "Transferencia Nequi",
  "Transferencia Banco",
  "AirBnb",
  "Ota Colect",
] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number] | string;

export interface FilaIngreso {
  id: number;
  bloque: "azul" | "verde" | "amarillo";
  concepto: string;
  medioPago: MedioPago;
  valor: number | "";
  esEditableConcepto?: boolean;
}

export interface FilaEgreso {
  id: number;
  concepto: string;
  medioPago: MedioPago;
  valor: number | "";
}

// Utilidad para formatear a pesos colombianos (COP)
export const formatCOP = (val: number | "" | null | undefined): string => {
  if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
    return "";
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(val));
};

// Utilidad para extraer solo números enteros limpios
export const parseNumber = (val: string | number): number | "" => {
  if (val === "" || val === null || val === undefined) return "";
  const clean = String(val).replace(/[^\d]/g, "");
  if (!clean) return "";
  const num = parseInt(clean, 10);
  return isNaN(num) ? "" : num;
};

// Componente de celda numérica con edición fluida y formato Excel
interface CurrencyCellProps {
  value: number | "";
  onChange: (val: number | "") => void;
  className?: string;
  placeholder?: string;
}

const CurrencyCell: React.FC<CurrencyCellProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState<string>(value === "" ? "" : String(value));

  useEffect(() => {
    if (!isFocused) {
      setRawText(value === "" ? "" : String(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setRawText(value === "" ? "" : String(value));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseNumber(rawText);
    onChange(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parsed = parseNumber(val);
    setRawText(parsed === "" ? "" : String(parsed));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={isFocused ? rawText : formatCOP(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 outline-none px-2 py-1 text-xs sm:text-sm text-right font-mono transition-colors focus:bg-white/90 focus:text-stone-900 ${className}`}
    />
  );
};

export default function ReceptionControlTable() {
  const getTodayISO = () => new Date().toISOString().split("T")[0];

  const [fecha, setFecha] = useState<string>(getTodayISO());
  const [valorInicio, setValorInicio] = useState<number | "">("");
  const [valorFinal, setValorFinal] = useState<number | "">("");

  // Inicializar filas de Ingresos
  const buildInitialIngresos = (): FilaIngreso[] => {
    const items: FilaIngreso[] = [];
    let idCounter = 1;

    BLOQUE_AZUL.forEach((concepto) => {
      items.push({
        id: idCounter++,
        bloque: "azul",
        concepto,
        medioPago: "",
        valor: "",
      });
    });

    BLOQUE_VERDE.forEach((concepto) => {
      items.push({
        id: idCounter++,
        bloque: "verde",
        concepto,
        medioPago: "",
        valor: "",
      });
    });

    // Bloque Amarillo: completamente en blanco y editable
    for (let i = 0; i < FILAS_AMARILLO_INICIALES; i++) {
      items.push({
        id: idCounter++,
        bloque: "amarillo",
        concepto: "",
        medioPago: "",
        valor: "",
        esEditableConcepto: true,
      });
    }

    return items;
  };

  // Inicializar filas de Egresos (misma cantidad de filas que ingresos, dinámicas y vacías)
  const buildInitialEgresos = (): FilaEgreso[] => {
    const totalInicial = BLOQUE_AZUL.length + BLOQUE_VERDE.length + FILAS_AMARILLO_INICIALES;
    return Array.from({ length: totalInicial }, (_, i) => ({
      id: i + 1,
      concepto: "",
      medioPago: "",
      valor: "",
    }));
  };

  const [ingresos, setIngresos] = useState<FilaIngreso[]>(buildInitialIngresos);
  const [egresos, setEgresos] = useState<FilaEgreso[]>(buildInitialEgresos);

  // Modal para ver y exportar JSON consolidado
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [consolidatedJsonString, setConsolidatedJsonString] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cargar datos: primero desde la base de datos MongoDB, luego localStorage o plantilla limpia
  useEffect(() => {
    let isCancelled = false;

    const cargarDatos = async () => {
      // 1. Intentar cargar desde la base de datos
      try {
        const res = await fetch(`/api/reception-control?fecha=${fecha}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && !isCancelled) {
            const record = json.data;
            if (record.valorCajaInicio7AM !== undefined) setValorInicio(record.valorCajaInicio7AM);
            if (Array.isArray(record.ingresos) && record.ingresos.length > 0) setIngresos(record.ingresos);
            if (Array.isArray(record.egresos) && record.egresos.length > 0) setEgresos(record.egresos);
            toast.success(`Datos cargados desde la base de datos (${fecha})`, { id: "load-date" });
            return;
          }
        }
      } catch (err) {
        console.error("Error al consultar base de datos para la fecha:", err);
      }

      // 2. Si no existe en base de datos, intentar localStorage
      try {
        const storageKey = `atamsa_reception_table_v3_${fecha}`;
        const saved = localStorage.getItem(storageKey);
        if (saved && !isCancelled) {
          const parsed = JSON.parse(saved);
          if (parsed.valorInicio !== undefined) setValorInicio(parsed.valorInicio);
          if (Array.isArray(parsed.ingresos)) setIngresos(parsed.ingresos);
          if (Array.isArray(parsed.egresos)) setEgresos(parsed.egresos);
          toast.success(`Datos cargados localmente (${fecha})`, { id: "load-date" });
          return;
        }
      } catch (err) {
        console.error("Error al cargar datos desde localStorage:", err);
      }

      // 3. Reiniciar con la plantilla limpia si no hay datos guardados para esa fecha
      if (!isCancelled) {
        setValorInicio("");
        setIngresos(buildInitialIngresos());
        setEgresos(buildInitialEgresos());
      }
    };

    cargarDatos();

    return () => {
      isCancelled = true;
    };
  }, [fecha]);

  // Actualizadores de Ingresos
  const handleIngresoChange = useCallback(
    (index: number, field: keyof FilaIngreso, value: any) => {
      setIngresos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  // Actualizadores de Egresos
  const handleEgresoChange = useCallback(
    (index: number, field: keyof FilaEgreso, value: any) => {
      setEgresos((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  // Cálculos en tiempo real
  const isEfectivo = (mp: string): boolean => {
    return String(mp || "").trim().toLowerCase() === "efectivo";
  };

  const totalIngresos = useMemo(() => {
    return ingresos.reduce((acc, row) => {
      const val = typeof row.valor === "number" ? row.valor : 0;
      return acc + val;
    }, 0);
  }, [ingresos]);

  // Total Ingresos en Efectivo
  const totalIngresosEfectivo = useMemo(() => {
    return ingresos.reduce((acc, row) => {
      if (isEfectivo(row.medioPago) && typeof row.valor === "number") {
        return acc + row.valor;
      }
      return acc;
    }, 0);
  }, [ingresos]);

  // Total Egresos en Efectivo
  const totalEgresosEfectivo = useMemo(() => {
    return egresos.reduce((acc, row) => {
      if (isEfectivo(row.medioPago) && typeof row.valor === "number") {
        return acc + row.valor;
      }
      return acc;
    }, 0);
  }, [egresos]);

  // Total Ingresos en Otros Medios de Pago (Transferencias, Datafono, AirBnb, etc.)
  const totalOtrosMediosIngresos = useMemo(() => {
    return ingresos.reduce((acc, row) => {
      if (!isEfectivo(row.medioPago) && row.medioPago && typeof row.valor === "number") {
        return acc + row.valor;
      }
      return acc;
    }, 0);
  }, [ingresos]);

  // Desglose agrupado por cada uno de los otros medios de pago
  const desgloseOtrosMedios = useMemo(() => {
    const map: Record<string, number> = {};
    ingresos.forEach((row) => {
      if (!isEfectivo(row.medioPago) && row.medioPago && typeof row.valor === "number" && row.valor > 0) {
        map[row.medioPago] = (map[row.medioPago] || 0) + row.valor;
      }
    });
    return map;
  }, [ingresos]);

  const totalEgresos = useMemo(() => {
    return egresos.reduce((acc, row) => {
      const val = typeof row.valor === "number" ? row.valor : 0;
      return acc + val;
    }, 0);
  }, [egresos]);

  // Valor Caja Final del Día: Valor inicio 7:00 AM + Ingresos Efectivo - Egresos Efectivo
  const valorCajaFinalCalculado = useMemo(() => {
    const inicio = typeof valorInicio === "number" ? valorInicio : 0;
    return inicio + totalIngresosEfectivo - totalEgresosEfectivo;
  }, [valorInicio, totalIngresosEfectivo, totalEgresosEfectivo]);

  const saldoNetoCalculado = useMemo(() => {
    const inicio = typeof valorInicio === "number" ? valorInicio : 0;
    return inicio + totalIngresos - totalEgresos;
  }, [valorInicio, totalIngresos, totalEgresos]);

  // Generador de PDF con formato y manual de marca institucional ATAMSA
  const generarPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. Franja Superior Institucional ATAMSA
      doc.setFillColor(30, 108, 70); // #1E6C46 Verde Principal ATAMSA
      doc.rect(0, 0, 210, 22, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("HOTEL ATAMSA - CONTROL DE CAJA DE RECEPCIÓN", 105, 10, { align: "center" });

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Fecha de Control: ${fecha}   |   Generado el: ${new Date().toLocaleDateString("es-CO")} ${new Date().toLocaleTimeString("es-CO")}`,
        105,
        17,
        { align: "center" }
      );

      // 2. Resumen Superior (Caja Inicio, Ingresos Efectivo, Otros Medios, Egresos, Caja Final)
      autoTable(doc, {
        startY: 26,
        head: [
          [
            "Valor Caja Inicio 7:00 AM",
            "Ingresos en Efectivo",
            "Otros Medios (No Efectivo)",
            "Total Egresos",
            "Valor Caja Final Día",
          ],
        ],
        body: [
          [
            formatCOP(valorInicio || 0) || "$ 0",
            formatCOP(totalIngresosEfectivo) || "$ 0",
            formatCOP(totalOtrosMediosIngresos) || "$ 0",
            formatCOP(totalEgresos) || "$ 0",
            formatCOP(valorCajaFinalCalculado) || "$ 0",
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [240, 245, 240],
          textColor: [30, 108, 70],
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8.5,
          fontStyle: "bold",
          halign: "center",
          textColor: [20, 20, 20],
        },
        margin: { left: 14, right: 14 },
      });

      // 3. Tabla de Ingresos Efectuados
      const filasIngresosConDatos = ingresos.filter(
        (r) =>
          (typeof r.valor === "number" && r.valor > 0) ||
          r.concepto.trim() !== "" ||
          (r.medioPago && r.medioPago.trim() !== "")
      );

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 5,
        head: [
          [
            {
              content: "INGRESOS EFECTUADOS",
              colSpan: 3,
              styles: {
                halign: "center",
                fillColor: [30, 108, 70],
                textColor: [255, 255, 255],
                fontStyle: "bold",
              },
            },
          ],
          ["Concepto", "Medio de Pago", "Valor"],
        ],
        body:
          filasIngresosConDatos.length > 0
            ? filasIngresosConDatos.map((r) => [
                r.concepto || "-",
                r.medioPago || "-",
                typeof r.valor === "number" ? formatCOP(r.valor) : "$ 0",
              ])
            : [["Sin ingresos registrados", "-", "$ 0"]],
        foot: [
          [
            {
              content: "VALOR TOTAL INGRESOS",
              colSpan: 2,
              styles: { halign: "right", fontStyle: "bold" },
            },
            {
              content: formatCOP(totalIngresos) || "$ 0",
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [226, 239, 218],
          textColor: [20, 20, 20],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        footStyles: {
          fillColor: [226, 239, 218],
          textColor: [20, 20, 20],
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { cellWidth: 47 },
          2: { cellWidth: 40, halign: "right" },
        },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 },
      });

      // 4. Tabla de Egresos Efectuados
      const filasEgresosConDatos = egresos.filter(
        (r) =>
          (typeof r.valor === "number" && r.valor > 0) ||
          r.concepto.trim() !== "" ||
          (r.medioPago && r.medioPago.trim() !== "")
      );

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 5,
        head: [
          [
            {
              content: "EGRESOS EFECTUADOS",
              colSpan: 3,
              styles: {
                halign: "center",
                fillColor: [180, 50, 60],
                textColor: [255, 255, 255],
                fontStyle: "bold",
              },
            },
          ],
          ["Concepto", "Medio de Pago", "Valor"],
        ],
        body:
          filasEgresosConDatos.length > 0
            ? filasEgresosConDatos.map((r) => [
                r.concepto || "-",
                r.medioPago || "-",
                typeof r.valor === "number" ? formatCOP(r.valor) : "$ 0",
              ])
            : [["Sin egresos registrados en este turno", "-", "$ 0"]],
        foot: [
          [
            {
              content: "VALOR TOTAL EGRESOS",
              colSpan: 2,
              styles: { halign: "right", fontStyle: "bold" },
            },
            {
              content: formatCOP(totalEgresos) || "$ 0",
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [254, 226, 226],
          textColor: [20, 20, 20],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        footStyles: {
          fillColor: [254, 226, 226],
          textColor: [20, 20, 20],
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 95 },
          1: { cellWidth: 47 },
          2: { cellWidth: 40, halign: "right" },
        },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 },
      });

      // 5. Resumen de Medios de Pago
      const mediosRows: Array<[string, string]> = [
        ["Efectivo (Ingreso en caja física)", formatCOP(totalIngresosEfectivo) || "$ 0"],
      ];
      Object.entries(desgloseOtrosMedios).forEach(([m, val]) => {
        mediosRows.push([`${m} (Pago electrónico / OTA)`, formatCOP(val) || "$ 0"]);
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 5,
        head: [
          [
            {
              content: "RESUMEN CONSOLIDADO POR MEDIO DE PAGO",
              colSpan: 2,
              styles: {
                halign: "center",
                fillColor: [70, 90, 120],
                textColor: [255, 255, 255],
                fontStyle: "bold",
              },
            },
          ],
          ["Medio de Pago", "Total Recaudado"],
        ],
        body: mediosRows,
        foot: [
          [
            {
              content: "TOTAL RECAUDADO (TODOS LOS MEDIOS)",
              styles: { halign: "right", fontStyle: "bold" },
            },
            {
              content: formatCOP(totalIngresos) || "$ 0",
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [240, 245, 255],
          textColor: [20, 20, 20],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        footStyles: {
          fillColor: [240, 245, 255],
          textColor: [20, 20, 20],
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 142 },
          1: { cellWidth: 40, halign: "right" },
        },
        bodyStyles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 },
      });

      // 6. Firmas
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const signatureY = finalY > pageHeight - 30 ? pageHeight - 25 : finalY;

      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(20, signatureY, 90, signatureY);
      doc.line(120, signatureY, 190, signatureY);

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("Firma Recepcionista de Turno", 55, signatureY + 4, { align: "center" });
      doc.text("Firma Auditoría / Administración", 155, signatureY + 4, { align: "center" });

      doc.save(`caja-recepcion-${fecha}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      toast.error("Error al generar el archivo PDF");
    }
  };

  // Función para guardar en base de datos, generar PDF y respaldar localmente
  const handleGuardar = async () => {
    setGuardando(true);
    const toastId = toast.loading("Guardando en base de datos y generando PDF...");

    try {
      // 1. Generar y descargar el PDF
      generarPDF();

      // 2. Construir el objeto consolidado
      const consolidated = {
        titulo: "CAJA RECEPCION",
        fecha,
        valorCajaInicio7AM: valorInicio === "" ? 0 : Number(valorInicio),
        valorCajaFinalDia: valorCajaFinalCalculado,
        ingresos: ingresos.map((item) => ({
          id: item.id,
          bloque: item.bloque,
          concepto: item.concepto,
          medioPago: item.medioPago || "",
          valor: item.valor === "" ? 0 : Number(item.valor),
        })),
        egresos: egresos.map((item) => ({
          id: item.id,
          concepto: item.concepto,
          medioPago: item.medioPago || "",
          valor: item.valor === "" ? 0 : Number(item.valor),
        })),
        totales: {
          valorTotalIngresos: totalIngresos,
          totalIngresosEfectivo,
          totalOtrosMediosIngresos,
          desgloseOtrosMedios,
          valorTotalEgresos: totalEgresos,
          totalEgresosEfectivo,
          valorCajaFinalDiaCalculado: valorCajaFinalCalculado,
          saldoNetoCalculado,
        },
      };

      // 3. Guardar en Base de Datos MongoDB
      const res = await fetch("/api/reception-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consolidated),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "No se pudo guardar en la base de datos");
      }

      // 4. Guardar respaldo en localStorage
      try {
        const storageKey = `atamsa_reception_table_v3_${fecha}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            valorInicio,
            valorFinal: valorCajaFinalCalculado,
            ingresos,
            egresos,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn("No se pudo persistir en localStorage", e);
      }

      const jsonString = JSON.stringify(consolidated, null, 2);
      setConsolidatedJsonString(jsonString);

      toast.success("¡Control de caja guardado en la base de datos y PDF descargado!", {
        id: toastId,
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Error al guardar control de caja:", error);
      toast.error(error.message || "Error al guardar en la base de datos", {
        id: toastId,
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleCopiarJSON = async () => {
    try {
      await navigator.clipboard.writeText(consolidatedJsonString);
      toast.success("JSON copiado al portapapeles");
    } catch (err) {
      toast.error("Error al copiar al portapapeles");
    }
  };

  const handleDescargarJSON = () => {
    try {
      const blob = new Blob([consolidatedJsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `caja-recepcion-${fecha}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado");
    } catch (err) {
      toast.error("Error al descargar archivo");
    }
  };

  const handleAgregarFila = () => {
    const newId = Date.now();
    setIngresos((prev) => [
      ...prev,
      {
        id: newId,
        bloque: "amarillo",
        concepto: "",
        medioPago: "",
        valor: "",
        esEditableConcepto: true,
      },
    ]);
    setEgresos((prev) => [
      ...prev,
      {
        id: newId,
        concepto: "",
        medioPago: "",
        valor: "",
      },
    ]);
    toast.success("Fila adicional agregada al bloque amarillo");
  };

  const handleEliminarFila = (index: number) => {
    const minRows = BLOQUE_AZUL.length + BLOQUE_VERDE.length + 1;
    if (ingresos.length <= minRows) {
      toast.error("Debe existir al menos una fila en el bloque amarillo");
      return;
    }
    setIngresos((prev) => prev.filter((_, i) => i !== index));
    setEgresos((prev) => prev.filter((_, i) => i !== index));
    toast.success("Fila eliminada");
  };

  const handleLimpiarTabla = () => {
    if (window.confirm("¿Estás seguro de que deseas reiniciar todos los valores de la tabla?")) {
      setValorInicio("");
      setValorFinal("");
      setIngresos(buildInitialIngresos());
      setEgresos(buildInitialEgresos());
      try {
        localStorage.removeItem(`atamsa_reception_table_v3_${fecha}`);
      } catch (e) {}
      toast("Tabla restablecida a valores iniciales");
    }
  };

  // Función para obtener clase de fondo por bloque
  const getFondoBloque = (bloque: "azul" | "verde" | "amarillo") => {
    switch (bloque) {
      case "azul":
        return "bg-sky-100";
      case "verde":
        return "bg-emerald-100";
      case "amarillo":
        return "bg-amber-100";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de Acciones y Resumen Rápido */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-verde-principal/10 flex items-center justify-center text-verde-principal font-bold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              Control de Caja de Recepción
            </h2>
            <p className="text-xs text-stone-500">
              Formato tipo hoja de cálculo con balance en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAgregarFila}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Agregar una nueva fila al bloque amarillo (y a egresos)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-amber-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Agregar fila</span>
          </button>
          <button
            type="button"
            onClick={handleLimpiarTabla}
            className="px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-300"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={generarPDF}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Descargar reporte en formato PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-verde-principal hover:bg-verde-oscuro disabled:opacity-60 rounded-lg transition-all shadow-sm flex items-center gap-2 focus:ring-2 focus:ring-verde-principal/40 cursor-pointer"
            title="Guardar en Base de Datos y generar archivo PDF"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tarjetas informativas de Totales en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Ingresos */}
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
              Total Ingresos
            </span>
            <span className="text-[10px] font-semibold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded">
              Global
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-950 mt-1">
            {formatCOP(totalIngresos) || "$ 0"}
          </p>
          <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-between mt-0.5">
            <span>Efectivo: {formatCOP(totalIngresosEfectivo) || "$ 0"}</span>
          </div>
        </div>

        {/* Otros Medios de Pago (Transferencias, Datafono, AirBnb, etc.) */}
        <div className="bg-sky-50 border border-sky-300 p-3 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-sky-800 tracking-wider">
              Otros Medios de Pago
            </span>
            <span className="text-[10px] font-semibold bg-sky-200/80 text-sky-900 px-1.5 py-0.5 rounded">
              No Efectivo
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-sky-950 mt-1">
            {formatCOP(totalOtrosMediosIngresos) || "$ 0"}
          </p>
          <div
            className="text-[10px] text-sky-700 truncate font-medium mt-0.5"
            title={
              Object.keys(desgloseOtrosMedios).length > 0
                ? Object.entries(desgloseOtrosMedios)
                    .map(([m, val]) => `${m}: ${formatCOP(val)}`)
                    .join(" | ")
                : "Datafono, Nequi, Banco, AirBnb, Ota Colect"
            }
          >
            {Object.keys(desgloseOtrosMedios).length > 0
              ? Object.entries(desgloseOtrosMedios)
                  .map(([m, val]) => `${m}: ${formatCOP(val)}`)
                  .join(" | ")
              : "Datafono, Nequi, Banco, AirBnb, Ota Colect"}
          </div>
        </div>

        {/* Total Egresos */}
        <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-rose-800 tracking-wider">
              Total Egresos
            </span>
            <span className="text-[10px] font-semibold bg-rose-200/80 text-rose-900 px-1.5 py-0.5 rounded">
              Salidas
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-rose-950 mt-1">
            {formatCOP(totalEgresos) || "$ 0"}
          </p>
          <span className="text-[10px] text-rose-700 font-medium">
            Gastos y egresos registrados
          </span>
        </div>

        {/* Saldo Calculado Caja Final (Efectivo en Caja) */}
        <div className="bg-orange-50 border border-orange-300 p-3 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-orange-900 tracking-wider">
              Valor Caja Final Día
            </span>
            <span className="text-[10px] font-semibold bg-orange-200/80 text-orange-900 px-1.5 py-0.5 rounded">
              Caja Efectivo
            </span>
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-orange-950 mt-1">
            {formatCOP(valorCajaFinalCalculado) || "$ 0"}
          </p>
          <span className="text-[10px] text-orange-800 truncate font-medium">
            Inicio ({formatCOP(valorInicio || 0)}) + Efectivo ({formatCOP(totalIngresosEfectivo)})
          </span>
        </div>
      </div>

      {/* Contenedor responsivo con scroll horizontal para mantener la cuadrícula de Excel exacta */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-black p-0.5">
        <table className="w-full border-collapse border border-black text-xs sm:text-sm select-none min-w-[980px]">
          {/* Anchos de columna predefinidos para proporciones de hoja de cálculo */}
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
          </colgroup>

          <thead>
            {/* 1. ENCABEZADO GLOBAL - FILA 1 (Blanca, texto centrado: Título "CAJA RECEPCION [Selector de Fecha]") */}
            <tr>
              <th
                colSpan={6}
                className="bg-white border border-black py-2.5 px-4 text-center font-bold text-sm sm:text-base text-stone-900"
              >
                <div className="inline-flex items-center justify-center gap-2 flex-wrap">
                  <span className="tracking-wide">CAJA RECEPCION</span>
                  <span className="text-stone-400 font-normal">[</span>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="border border-stone-400 rounded px-2 py-0.5 text-xs sm:text-sm font-semibold text-stone-900 bg-white cursor-pointer shadow-inner focus:outline-none focus:ring-1 focus:ring-verde-principal"
                  />
                  <span className="text-stone-400 font-normal">]</span>
                </div>
              </th>
            </tr>

            {/* 1. ENCABEZADO GLOBAL - FILA 2 (Dividida en 4 columnas) */}
            <tr>
              {/* Col 1 (Fondo azul claro): Texto "Valor caja inicio 7:00 AM" */}
              <th
                colSpan={2}
                className="bg-sky-100 border border-black px-3 py-1.5 text-center font-bold text-stone-900 text-xs sm:text-sm"
              >
                Valor caja inicio 7:00 AM
              </th>

              {/* Col 2 (Fondo blanco): Input numérico */}
              <td className="bg-white border border-black p-0">
                <CurrencyCell
                  value={valorInicio}
                  onChange={(val) => setValorInicio(val)}
                  placeholder="$ 0"
                  className="font-bold text-stone-900"
                />
              </td>

              {/* Col 3 (Fondo naranja/marrón claro): Texto "Valor caja Final dia" */}
              <th
                colSpan={2}
                className="bg-orange-100 border border-black px-3 py-1.5 text-center font-bold text-stone-900 text-xs sm:text-sm"
              >
                Valor caja Final dia
              </th>

              {/* Col 4 (Fondo naranja/marrón claro): Presenta la suma de Efectivo + Valor caja inicio */}
              <td className="bg-orange-100 border border-black px-3 py-1.5 text-right font-bold font-mono text-xs sm:text-sm text-stone-900">
                {formatCOP(valorCajaFinalCalculado) || "$ 0"}
              </td>
            </tr>

            {/* 2. CUERPO PRINCIPAL - FILA DE TÍTULOS DE PANEL */}
            <tr>
              {/* Panel Izquierdo: "Ingresos efectuados" (Fondo verde claro) */}
              <th
                colSpan={3}
                className="bg-emerald-100 border border-black py-1.5 px-3 text-center font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wide"
              >
                Ingresos efectuados
              </th>

              {/* Panel Derecho: "Egresos efectuados" (Fondo rosa claro) */}
              <th
                colSpan={3}
                className="bg-rose-100 border border-black py-1.5 px-3 text-center font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wide"
              >
                Egresos efectuados
              </th>
            </tr>

            {/* 2. CUERPO PRINCIPAL - FILA DE SUBCOLUMNAS */}
            <tr>
              {/* Panel Izquierdo: "Concepto", "Medio de pago", "Valor" (Fondo verde claro) */}
              <th className="bg-emerald-100 border border-black py-1 px-2 text-center font-bold text-stone-900 text-xs sm:text-sm">
                Concepto
              </th>
              <th className="bg-emerald-100 border border-black py-1 px-2 text-center font-bold text-stone-900 text-xs sm:text-sm">
                Medio de pago
              </th>
              <th className="bg-emerald-100 border border-black py-1 px-2 text-center font-bold text-stone-900 text-xs sm:text-sm">
                Valor
              </th>

              {/* Panel Derecho: "concepto", "Medio de pago", "Valor" (Fondo rosa claro) */}
              <th className="bg-rose-100 border border-black py-1 px-2 text-center font-bold text-stone-900 text-xs sm:text-sm">
                concepto
              </th>
              <th className="bg-rose-100 border border-black py-1 px-2 text-center font-bold text-stone-900 text-xs sm:text-sm">
                Medio de pago
              </th>
              <th className="bg-rose-100 border border-black py-1 px-2 text-center font-bold text-stone-900 text-xs sm:text-sm">
                Valor
              </th>
            </tr>
          </thead>

          <tbody>
            {/* 3 & 4. DATOS DE LOS PANELES (34 filas simétricas) */}
            {ingresos.map((ingresoRow, index) => {
              const egresoRow = egresos[index] || {
                id: index + 1,
                concepto: "",
                medioPago: "",
                valor: "",
              };
              const fondoBloqueIngreso = getFondoBloque(ingresoRow.bloque);

              return (
                <tr key={`row-${index}`} className="hover:brightness-95 transition-all">
                  {/* --- PANEL IZQUIERDO: INGRESOS --- */}
                  {/* Concepto (Pre-cargado, no editable por bloque; editable en las filas del bloque amarillo) */}
                  <td
                    className={`${fondoBloqueIngreso} border border-black px-2 py-1 text-stone-800 text-xs sm:text-sm font-medium`}
                  >
                    {ingresoRow.esEditableConcepto ? (
                      <div className="flex items-center justify-between gap-1 group">
                        <input
                          type="text"
                          value={ingresoRow.concepto}
                          onChange={(e) =>
                            handleIngresoChange(index, "concepto", e.target.value)
                          }
                          placeholder=""
                          className="w-full bg-transparent border-0 outline-none px-0 py-0 text-xs sm:text-sm text-stone-800 font-medium focus:bg-white/70"
                        />
                        {ingresoRow.bloque === "amarillo" &&
                          ingresos.length > BLOQUE_AZUL.length + BLOQUE_VERDE.length + 1 && (
                            <button
                              type="button"
                              onClick={() => handleEliminarFila(index)}
                              title="Eliminar fila"
                              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-opacity px-1 rounded text-xs font-bold leading-none"
                            >
                              ✕
                            </button>
                          )}
                      </div>
                    ) : (
                      <span>{ingresoRow.concepto}</span>
                    )}
                  </td>

                  {/* Medio de pago (Dropdown: EFECTIVO, TRANSFERENCIA, DATAFONO) */}
                  <td className={`${fondoBloqueIngreso} border border-black p-0`}>
                    <select
                      value={ingresoRow.medioPago}
                      onChange={(e) =>
                        handleIngresoChange(index, "medioPago", e.target.value as MedioPago)
                      }
                      className="w-full bg-transparent border-0 outline-none px-1.5 py-1 text-xs sm:text-sm font-medium text-stone-800 cursor-pointer focus:bg-white/80"
                    >
                      <option value="" className="text-stone-400">
                        -
                      </option>
                      {MEDIOS_PAGO.map((mp) => (
                        <option key={mp} value={mp} className="text-stone-900 font-medium">
                          {mp}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Valor (Input numérico) */}
                  <td className={`${fondoBloqueIngreso} border border-black p-0`}>
                    <CurrencyCell
                      value={ingresoRow.valor}
                      onChange={(val) => handleIngresoChange(index, "valor", val)}
                    />
                  </td>

                  {/* --- PANEL DERECHO: EGRESOS --- */}
                  {/* Todas las celdas con fondo rosa claro */}
                  {/* concepto (Input editable) */}
                  <td className="bg-rose-100 border border-black p-0">
                    <input
                      type="text"
                      value={egresoRow.concepto}
                      onChange={(e) =>
                        handleEgresoChange(index, "concepto", e.target.value)
                      }
                      placeholder=""
                      className="w-full bg-transparent border-0 outline-none px-2 py-1 text-xs sm:text-sm text-stone-800 focus:bg-white/80"
                    />
                  </td>

                  {/* Medio de pago (Dropdown editable) */}
                  <td className="bg-rose-100 border border-black p-0">
                    <select
                      value={egresoRow.medioPago}
                      onChange={(e) =>
                        handleEgresoChange(index, "medioPago", e.target.value as MedioPago)
                      }
                      className="w-full bg-transparent border-0 outline-none px-1.5 py-1 text-xs sm:text-sm font-medium text-stone-800 cursor-pointer focus:bg-white/80"
                    >
                      <option value="" className="text-stone-400">
                        -
                      </option>
                      {MEDIOS_PAGO.map((mp) => (
                        <option key={mp} value={mp} className="text-stone-900 font-medium">
                          {mp}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Valor (Input numérico editable) */}
                  <td className="bg-rose-100 border border-black p-0">
                    <CurrencyCell
                      value={egresoRow.valor}
                      onChange={(val) => handleEgresoChange(index, "valor", val)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            {/* 5. PIE DE TABLA - FILA DE TOTALES */}
            <tr>
              {/* Panel Izquierdo: Texto "VALOR TOTAL" y celda que sume automáticamente los ingresos */}
              <th
                colSpan={2}
                className="bg-emerald-100 border border-black px-3 py-1.5 text-center sm:text-right font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wider"
              >
                VALOR TOTAL
              </th>
              <td className="bg-emerald-100 border border-black px-2 py-1.5 text-right font-bold font-mono text-xs sm:text-sm text-stone-900">
                {formatCOP(totalIngresos) || "$ 0"}
              </td>

              {/* Panel Derecho: Texto "Valor total" y celda que sume automáticamente los egresos */}
              <th
                colSpan={2}
                className="bg-rose-100 border border-black px-3 py-1.5 text-center sm:text-right font-bold text-xs sm:text-sm text-stone-900 tracking-wider"
              >
                Valor total
              </th>
              <td className="bg-rose-100 border border-black px-2 py-1.5 text-right font-bold font-mono text-xs sm:text-sm text-stone-900">
                {formatCOP(totalEgresos) || "$ 0"}
              </td>
            </tr>

            {/* 5. PIE DE TABLA - ÚLTIMA FILA: Vacía que cruza toda la tabla con fondo amarillo brillante sólido */}
            <tr>
              <td
                colSpan={6}
                className="border border-black bg-[#FFE600] h-7 sm:h-8"
                aria-label="Fila final de cierre de tabla"
              />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Botón inferior para agregar filas adicionales al bloque amarillo */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleAgregarFila}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-amber-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Agregar fila adicional (Bloque amarillo)</span>
        </button>
        <span className="text-[11px] text-stone-500 font-medium">
          Total filas activas en cuadrícula: {ingresos.length}
        </span>
      </div>

      {/* Modal de Consolidación de JSON */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-verde-principal/10 flex items-center justify-center text-verde-principal font-bold text-sm">
                  JSON
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                    Caja Consolidada ({fecha})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Estructura consolidada en formato JSON lista para sincronización o respaldo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 rounded-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-stone-900">
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap select-all">
                {consolidatedJsonString}
              </pre>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-stone-200 bg-stone-50 gap-2 flex-wrap">
              <span className="text-xs text-stone-500">
                Guardado localmente en tu navegador
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generarPDF}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                >
                  Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={handleCopiarJSON}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 rounded-lg border border-stone-300 transition-colors"
                >
                  Copiar JSON
                </button>
                <button
                  type="button"
                  onClick={handleDescargarJSON}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-verde-principal hover:bg-verde-oscuro rounded-lg transition-colors"
                >
                  Descargar JSON
                </button>
                <button
                  type="button"
                  onClick={() => setJsonModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
