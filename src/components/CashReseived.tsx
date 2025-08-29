/* eslint-disable react/no-array-index-key */
/* eslint-disable no-unused-vars */
/* eslint-disable react/button-has-type */
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Cash, Bed, CashBanknote } from "tabler-icons-react";
import { Select } from "@mantine/core";
import { format } from "date-fns";
import toast from "react-hot-toast";

import InputValidator from "@/components/InputValidator";
import AtamsaLogo from "@/components/AtamsaLogo";
import { paymentBox } from "@/store/actions/boxAction";

function CashReseived({ dataRoom, boxId, onPaymentSuccess }) {
  const [payment, setPayment] = useState("");
  const [room, setRoom] = useState("");
  const [paymentBy, setPaymentBy] = useState("react");
  const [cash, setcash] = useState({
    concept: "",
    cash: "",
    typePayment: "",
    roomId: "",
    reasonOfPay: "",
    boxId: "",
  });

  const thisDay = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  const dispatch = useDispatch();

  const onChange = (e) => {
    setcash({
      ...cash,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...cash,
      cash: parseFloat(cash.cash) || 0,
      typePayment: payment,
      roomId: room,
      reasonOfPay: paymentBy,
      boxId: boxId,
      timeTransaction: thisDay,
    };

    try {
      const response = await fetch('/api/box/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Pago añadido con éxito!');
        // Clear form fields
        setPayment("");
        setRoom("");
        setPaymentBy("react");
        setcash({
          concept: "",
          cash: "",
          typePayment: "",
          roomId: "",
          reasonOfPay: "",
          boxId: "",
        });
        // Trigger refresh in parent
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        toast.error(data.message || 'Error al añadir el pago.');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Error de red o del servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-center mb-6">
        <AtamsaLogo />
      </div>
      <div className="p-4 space-y-6">
        <Select
          required
          maxDropdownHeight={380}
          leftSection={<Cash size={14} />}
          value={payment}
          onChange={setPayment}
          label="Selecciona el metodo de pago"
          placeholder="Metodo de pago"
          data={[
            {
              value: "Efectivo",
              label: "Efectivo",
            },
            {
              value: "Datafono",
              label: "Datafono",
            },
            {
              value: "TransferenciaNequi",
              label: "Transferencia Nequi",
            },
            {
              value: "TransferenciaBanco",
              label: "Transferencia Banco",
            },
            {
              value: "AirBnb",
              label: "AirBnb",
            },
          ]}
        />
        <Select
          required
          maxDropdownHeight={380}
          leftSection={<Bed size={14} />}
          value={room}
          onChange={setRoom}
          label="Habitacion del pago"
          placeholder="Habitación"
          data={Object.keys(dataRoom).map((roomNumber) => ({
            value: roomNumber,
            label: roomNumber,
          }))}
        />
        <Select
          required
          maxDropdownHeight={380}
          leftSection={<CashBanknote size={14} />}
          value={paymentBy}
          onChange={setPaymentBy}
          label="Motivo del Pago"
          placeholder="Pago por"
          data={[
            {
              value: "Consumibles",
              label: "Pago Consumibles",
            },
            {
              value: "Habitacion",
              label: "Pago Habitacion",
            },
            {
              value: "Inyeccion",
              label: "Inyeccion Efectivo Caja",
            },
          ]}
        />
        <InputValidator
          name="concept"
          id="concept"
          value={cash.concept}
          type="text"
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-verde-principal focus:border-verde-principal sm:text-sm"
          placeholder="Concepto"
          onChange={onChange}
          errorMessage="El titulo es obligatorio "
          required
        />
        <InputValidator
          name="cash"
          id="cash"
          value={cash.cash}
          type="number"
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-verde-principal focus:border-verde-principal sm:text-sm"
          placeholder="Dinero a Agregar"
          onChange={onChange}
        />
      </div>
      <div className="mt-6 px-4 pb-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-verde-principal hover:bg-verde-oscuro focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-verde-principal"
        >
          Añadir Dinero
        </button>
      </div>
    </form>
  );
}

export default CashReseived;