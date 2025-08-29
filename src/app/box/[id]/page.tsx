"use client";

import { Divider, Tabs, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { CashBanknote, CashBanknoteOff } from "tabler-icons-react";

import BoxTable from "@/components/BoxTable";
import PublicModal from "@/components/PublicModal";
import {
  showAddCashAction,
  showWithdrawCashAction,
} from "@/store/actions/modalAction";
import { incrementCharge } from "@/store/actions/dateAction";
import CashReseived from "@/components/CashReseived";
import CashWithdrawed from "@/components/CashWithdrawed";
import AtamsaLogo from "@/components/AtamsaLogo";

export default function BoxId({ params }: { params: { id: string } }) {
  const thisIsTheBox = params.id;
  const headquartersMap: Record<string, string> = {
    "201": "Natural Sevgi",
    "202": "Natural Sevgi",
    "203": "Natural Sevgi",
    "204": "Natural Sevgi",
    "301": "Natural Sevgi",
    "302": "Natural Sevgi",
    "303": "Natural Sevgi",
    "304": "Natural Sevgi",
    "401": "Natural Sevgi",
    "402": "Natural Sevgi",
    "403": "Natural Sevgi",
    "404": "Natural Sevgi",
    "221": "Oporto 83",
    "222": "Oporto 83",
    "223": "Oporto 83",
    "224": "Oporto 83",
    "225": "Oporto 83",
    "321": "Oporto 83",
    "322": "Oporto 83",
    "323": "Oporto 83",
    "324": "Oporto 83",
    "325": "Oporto 83",
    "421": "Oporto 83",
    "423": "Oporto 83",
    "424": "Oporto 83",
  };
  const dataRoom = headquartersMap;

  const dispatch = useDispatch();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [dataBox, setDataBox] = useState<any>({});
  const [dataPayment, setDataPayment] = useState([]);
  const [dataWithdraw, setDataWithdraw] = useState([]);

  const { showAdd, showWitdraw } = useSelector((state: any) => state.modalReducer);
  const { charge } = useSelector((state: any) => state.dateReducer);
  const { existingBalance } = useSelector((state: any) => state.boxReducer);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.data);
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!loadingUser && user) {
      const fetchBox = async () => {
        await fetch(`/api/box/boxrefresh`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${thisIsTheBox}`,
            "Content-Type": "application/json",
          },
        })
          .then((resp) => resp.json())
          .then((data) => {
            if (data.box) {
              setDataBox(data.box);
            }
          });
      };

      fetchBox();

      const fetchPayment = async () => {
        await fetch("/api/box/payment", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((resp) => resp.json())
          .then((data) => {
            if (data.payment) {
              setDataPayment(data.payment);
            }
          });
      };
      fetchPayment();

      const fetchWithdraw = async () => {
        await fetch("/api/box/withdraw", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((resp) => resp.json())
          .then((data) => {
            if (data.withdraw) {
              setDataWithdraw(data.withdraw);
            }
          });
      };
      fetchWithdraw();
    }
  }, [charge, loadingUser, user, thisIsTheBox, router, dispatch]);

  const handleCloseBox = async () => {
    try {
      const response = await fetch(`/api/boxes/${thisIsTheBox}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activeBox: false,
          lastClosingBalance: existingBalance,
          lastClosing: new Date().toISOString(),
          userIdCloseBox: user._id,
        }),
      });

      if (response.ok) {
        router.push("/box");
      } else {
        console.error("Failed to close the box");
      }
    } catch (error) {
      console.error("An error occurred while closing the box:", error);
    }
  };

  const rowsPayment = dataPayment
    .filter((box: any) => box.boxId._id === thisIsTheBox)
    .map((element: any) => (
      <tr key={element._id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.roomId}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Intl.NumberFormat("es-MX").format(element.cash)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.typePayment}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.reasonOfPay}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.concept}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.userId.firstName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.timeTransaction}</td>
      </tr>
    ))
    .reverse();

  const rowsWithdraw = dataWithdraw
    .filter((box: any) => box.boxId._id === thisIsTheBox)
    .map((element: any) => (
      <tr key={element._id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">${new Intl.NumberFormat("es-MX").format(element.cash)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.typeWithdraw}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.reasonOfWithdraw}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.concept}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.userId.firstName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{element.timeTransaction}</td>
      </tr>
    ))
    .reverse();

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AtamsaLogo isLarge />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-gray-800">{dataBox?.nameBox}</h1>
          <p className="text-lg text-gray-600 mt-2">Flujo de Caja</p>
          <p className="text-md text-gray-500">Caja abierta por: {dataBox.userIdOpenBox?.firstName} {dataBox.userIdOpenBox?.lastName}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <BoxTable dataBox={dataBox} />
        </div>

        <div className="flex justify-center space-x-4 my-8">
          <button 
            onClick={() => dispatch(showAddCashAction())}
            className="px-8 py-3 bg-verde-principal text-white rounded-lg shadow-md hover:bg-verde-oscuro transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-verde-principal"
          >
            Añadir Dinero
          </button>
          <button 
            onClick={() => dispatch(showWithdrawCashAction())}
            className="px-8 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
          >
            Retirar Dinero
          </button>
          <button
            onClick={handleCloseBox}
            className="px-8 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cerrar Caja
          </button>
        </div>

        <Divider className="my-8" />

        <div className="bg-white p-6 rounded-lg shadow-md">
          <Tabs defaultValue="entradas" color="#1E6C46">
            <Tabs.List>
              <Tabs.Tab value="entradas" leftSection={<CashBanknote size={16} />}>
                Entradas
              </Tabs.Tab>
              <Tabs.Tab value="salidas" leftSection={<CashBanknoteOff size={16} />}>
                Salidas
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="entradas" pt="lg">
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Habitación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinero Pagado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metodo de Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razon del Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quien Recibio Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Transacción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">{rowsPayment}</tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="salidas" pt="lg">
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinero Retirado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metodo de Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razon del Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quien Realizó Retiro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Transacción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">{rowsWithdraw}</tbody>
              </Table>
            </Tabs.Panel>
          </Tabs>
        </div>

        <PublicModal
          opened={showAdd}
          onClose={() => {
            dispatch(showAddCashAction());
            dispatch(incrementCharge());
          }}
          size="md"
          title="Añadir Dinero"
        >
          <CashReseived
            dataRoom={dataRoom}
            boxId={thisIsTheBox}
            onPaymentSuccess={() => {
              dispatch(showAddCashAction());
              dispatch(incrementCharge());
            }}
          />
        </PublicModal>
        <PublicModal
          opened={showWitdraw}
          onClose={() => {
            dispatch(showWithdrawCashAction());
            dispatch(incrementCharge());
          }}
          size="md"
          title="Retirar Dinero"
        >
          <CashWithdrawed 
            boxId={thisIsTheBox} 
            onWithdrawSuccess={() => {
              dispatch(showWithdrawCashAction());
              dispatch(incrementCharge());
            }}
          />
        </PublicModal>
      </main>
    </div>
  );
}
