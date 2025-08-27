/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-no-useless-fragment */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { existingBalanceBox } from "@/store/actions/boxAction";


export default function BoxTable({ dataBox }) {
  const lastOpeningDate = new Date(dataBox.lastOpening);

  const initialCash = new Intl.NumberFormat("es-MX").format(
    dataBox.initialBalance
  );
  const cashReseivedInThisBox = (dataBox?.cashReseived || [])
    .filter((pay) => new Date(pay.createdAt) > lastOpeningDate)
    .filter((pay) => pay.typePayment === "Efectivo")
    .map((pay) => pay.cash)
    .reduce((total, value) => total + value, 0);
  const priceCopTotal = new Intl.NumberFormat("es-MX").format(
    cashReseivedInThisBox
  );
  const totalTransactionCash = (dataBox?.cashReseived || [])
    .filter((pay) => new Date(pay.createdAt) > lastOpeningDate)
    .filter((pay) => pay.typePayment === "Efectivo")
  .length;

  const transactionReseivedInThisBox = (dataBox?.cashReseived || [])
    .filter((pay) => new Date(pay.createdAt) > lastOpeningDate)
    .filter((pay) => pay.typePayment !== "Efectivo")
    .map((pay) => pay.cash)
    .reduce((total, value) => total + value, 0);
  const priceCopTotalTransaction = new Intl.NumberFormat("es-MX").format(
    transactionReseivedInThisBox
  );
  const totalTransaction = (dataBox?.cashReseived || []).filter(
    (pay) => new Date(pay.createdAt) > lastOpeningDate)
    .filter((pay) => pay.typePayment !== "Efectivo")
  .length;

  const cashWithdrawedInThisBox = (dataBox?.cashWithdrawn || [])
    .filter((pay) => new Date(pay.createdAt) > lastOpeningDate)
    .map((pay) => pay.cash)
    .reduce((total, value) => total + value, 0);
  const priceCopTotalWithdrawed = new Intl.NumberFormat("es-MX").format(
    cashWithdrawedInThisBox
  );
  const totalTransactionCashWithdrawed = (dataBox?.cashWithdrawn || []).filter((pay) => new Date(pay.createdAt) > lastOpeningDate).length;

  const total = (
    cashReseivedInThisBox + dataBox.initialBalance - cashWithdrawedInThisBox
  );

  const totalCash = new Intl.NumberFormat("es-MX").format(total);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(existingBalanceBox(total));
  }, [dataBox]);

  return (
    <>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Nro. Transacciones</th>
              <th>Monto (COP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Total Transacciones (no efectivo)</th>
              <td>{totalTransaction}</td>
              <td>${priceCopTotalTransaction}</td>
            </tr>
            <tr>
              <th>Saldo Inicial</th>
              <td></td>
              <td>${initialCash}</td>
            </tr>
            <tr>
              <th>Efectivo Recibido</th>
              <td>{totalTransactionCash}</td>
              <td>${priceCopTotal}</td>
            </tr>
            <tr>
              <th>Efectivo Retirado</th>
              <td>{totalTransactionCashWithdrawed}</td>
              <td className="text-red-600">
                - ${priceCopTotalWithdrawed}
              </td>
            </tr>
            <tr>
              <th>Saldo Existente</th>
              <td></td>
              <td>
                $<b >{totalCash}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}