/* eslint-disable react/no-array-index-key */
/* eslint-disable no-unused-vars */
/* eslint-disable react/button-has-type */
import { useState } from "react";
import { CashBanknote } from "tabler-icons-react";
import { Select } from "@mantine/core";
import { format } from "date-fns";
import toast from "react-hot-toast";

import InputValidator from "@/components/InputValidator";
import AtamsaLogo from "@/components/AtamsaLogo";

function CashWithdrawed({ boxId, onWithdrawSuccess }) {
  const [paymentBy, setPaymentBy] = useState("react");
  const thisDay = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const [cash, setcash] = useState({
    concept: "",
    cash: "",
    typeWithdraw: "Efectivo",
    reasonOfWithdraw: "",
    boxId: "",
  });

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
      reasonOfWithdraw: paymentBy,
      boxId: boxId,
      timeTransaction: thisDay,
    };

    try {
      const response = await fetch('/api/box/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Retiro añadido con éxito!');
        // Clear form fields
        setPaymentBy("react");
        setcash({
          concept: "",
          cash: "",
          typeWithdraw: "Efectivo",
          reasonOfWithdraw: "",
          boxId: "",
        });
        // Trigger refresh in parent
        if (onWithdrawSuccess) {
          onWithdrawSuccess();
        }
      } else {
        toast.error(data.message || 'Error al añadir el retiro.');
      }
    } catch (error) {
      console.error('Error adding withdraw:', error);
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
          leftSection={<CashBanknote size={14} />}
          value={paymentBy}
          onChange={setPaymentBy}
          label="Motivo del Retiro"
          placeholder="Retiro por"
          data={[
            {
              value: "Cafeteria",
              label: "Cafeteria",
            },
            {
              value: "Turnos",
              label: "Turnos",
            },
            {
              value: "Retiro",
              label: "Retiro Caja",
            },
            {
              value: "Otros",
              label: "Otros",
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
          placeholder="Dinero a Retirar"
          onChange={onChange}
        />
      </div>
      <div className="mt-6 px-4 pb-4">
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Retirar Dinero
        </button>
      </div>
    </form>
  );
}

export default CashWithdrawed;
