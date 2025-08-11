"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import FormField from "@/components/FormField";
import AtamsaLogo from "@/components/AtamsaLogo";
import Navbar from "@/components/Navbar";
import TravelerList from "@/components/TravelerList";

import { formatInTimeZone } from "date-fns-tz";

const initialFormState: Omit<TravelerRecord, "date" | "arrivalTime" | "_id"> = {
  roomNumber: "",
  name: "",
  nationality: "",
  origin: "",
  reservedNights: 0,
  reservationLocation: "",
  destination: "",
  idType: "",
  idNumber: "",
  expeditionPlace: "",
  amountPaid: 0,
  paymentMethod: "",
  breakfast: false,
};

const initialCompanionFormState = {
  mainTravelerId: "",
  name: "",
  idNumber: "",
  idType: "",
  expeditionPlace: "",
};

const fieldLabels: Record<
  keyof Omit<TravelerRecord, "date" | "arrivalTime" | "_id" | "companions">,
  string
> = {
  roomNumber: "Room No.",
  name: "Name",
  nationality: "Nationality",
  origin: "Origin",
  reservedNights: "Reserved Nights",
  reservationLocation: "Reservation Location",
  destination: "Destination",
  idType: "ID Type",
  idNumber: "ID Number",
  expeditionPlace: "Place of Expedition",
  breakfast: "Breakfast",
  amountPaid: "Amount Paid",
  paymentMethod: "Payment Method",
};

const companionFieldLabels = {
  mainTravelerId: "Main Traveler ID",
  name: "Name",
  idNumber: "ID Number",
  idType: "ID Type",
  expeditionPlace: "Place of Expedition",
};

const allTableFields: (keyof TravelerRecord)[] = [
  "roomNumber",
  "date",
  "name",
  "nationality",
  "origin",
  "reservedNights",
  "reservationLocation",
  "arrivalTime",
  "destination",
  "idType",
  "idNumber",
  "expeditionPlace",
  "breakfast",
  "amountPaid",
  "paymentMethod",
];

const roomNumbers = [
  "201",
  "202",
  "203",
  "204",
  "301",
  "302",
  "303",
  "304",
  "401",
  "402",
  "403",
  "404",
  "221",
  "222",
  "223",
  "224",
  "225",
  "321",
  "322",
  "323",
  "324",
  "325",
  "421",
  "423",
  "424",
];
const idTypes = [
  "Cedula de ciudadanía",
  "Pasaporte",
  "PEP",
  "Licencia de Conduccion",
  "Cedula de Extranjería",
  "Registro Civil",
  "Tarjeta de identidad",
  "ID de otro pais",
];
const paymentMethods = [
  "Nequi",
  "Datafono",
  "Efectivo COP",
  "Dolares",
  "Transferencia",
  "Link de Pago",
  "Euros",
];
const reservationLocations = [
  "Directo",
  "Booking",
  "Expedia",
  "Airbnb",
  "Despegar",
  "BestTravel",
  "Otro",
];

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

export default function HomePage() {
  const [records, setRecords] = useState<TravelerRecord[]>([]);
  const [form, setForm] =
    useState<Omit<TravelerRecord, "date" | "arrivalTime">>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [companionForm, setCompanionForm] = useState(initialCompanionFormState);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshList, setRefreshList] = useState(0);
  const recordsPerPage = 8;
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData.data);
          if (!userData.data.authorized) {
            router.push("/unauthorized");
          }
        } else if (res.status === 401) {
          router.push("/login");
        } else {
          router.push("/unauthorized"); // Fallback for other non-2xx statuses
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loadingUser && user && user.authorized) {
      fetchRecords();
    }
  }, [loadingUser, user]);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/travelers");
      const data = await res.json();
      if (data.success) {
        // Sort records by date (descending) and then by _id (descending) for consistent order
        const sortedRecords = data.data.sort(
          (a: TravelerRecord, b: TravelerRecord) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
              return dateB - dateA; // Sort by date descending
            }
            return b._id.localeCompare(a._id); // Sort by _id descending for stable sort
          }
        );
        setRecords(sortedRecords);
      } else {
        toast.error("Failed to fetch records.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching records.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";

    if (name === "roomNumber") {
      const headquarters = headquartersMap[value] || "";
      setForm({
        ...form,
        roomNumber: value,
        headquarters,
      });
    } else {
      setForm({
        ...form,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const timeZone = "America/Bogota";

    const formattedDate = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
    const formattedTime = formatInTimeZone(now, timeZone, "HH:mm");

    const dataToSend = {
      ...form,
      date: formattedDate,
      arrivalTime: formattedTime,
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/travelers/${editingId}` : "/api/travelers";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        const savedRecord = await res.json();
        toast.success(
          `Record ${editingId ? "updated" : "saved"} successfully!`
        );
        setRefreshList(prev => prev + 1);
        handleClear();
      } else {
        toast.error("Failed to save record.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  const handleEdit = (record: TravelerRecord) => {
    setEditingId(record._id || null);
    // Exclude date and arrivalTime from form when editing, as they are auto-filled
    const { date, arrivalTime, ...rest } = record;
    setForm(rest);
    toast("Editing record. Scroll up to see the form.", { icon: "✍️" });
  };

  const handleClear = () => {
    setForm(initialFormState);
    setEditingId(null);
    setCurrentPage(1); // Reset to first page on clear
    setSearchId(""); // Clear search ID
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/unauthorized");
      } else {
        toast.error("Failed to logout.");
      }
    } catch (error) {
      toast.error("An error occurred during logout.");
    }
  };

  const handleSearch = async () => {
    if (!searchId) {
      toast.error("Please enter an ID number to search.");
      return;
    }

    try {
      const res = await fetch(`/api/travelers/search?idNumber=${searchId}`);
      const data = await res.json();

      if (data.success && data.data) {
        const { _id, date, arrivalTime, ...rest } = data.data;
        // Validate _id before setting it in companionForm
        if (_id && typeof _id === "string" && _id.match(/^[0-9a-fA-F]{24}$/)) {
          setForm(rest);
          setCompanionForm({
            ...initialCompanionFormState,
            mainTravelerId: _id,
          });
          toast.success("Traveler found and form populated.");
        } else {
          toast.error("Invalid Traveler ID found.");
        }
      } else {
        toast.error(data.error || "Traveler not found.");
      }
    } catch (error) {
      toast.error("An error occurred while searching.");
    }
  };

  const handleCompanionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCompanionForm({
      ...companionForm,
      [name]: value,
    });
  };

  const handleCompanionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation for companion form
    if (
      !companionForm.mainTravelerId ||
      !companionForm.name ||
      !companionForm.idNumber ||
      !companionForm.idType ||
      !companionForm.expeditionPlace
    ) {
      toast.error("Please fill in all required fields for the companion.");
      return;
    }

    try {
      const res = await fetch("/api/companions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companionForm),
      });

      if (res.ok) {
        toast.success("Companion saved successfully!");
        setCompanionForm(initialCompanionFormState);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save companion.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(records.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getFieldValue = (
    record: TravelerRecord,
    field: keyof TravelerRecord
  ) => {
    if (field === "date" || field === "arrivalTime") {
      return record[field]
        ? formatInTimeZone(
            new Date(record[field]),
            "America/Bogota",
            field === "date" ? "yyyy-MM-dd" : "HH:mm"
          )
        : "";
    }
    if (typeof record[field] === "boolean") {
      return record[field] ? "Yes" : "No";
    }
    if (field === "companions") {
      return record[field] && record[field].length > 0
        ? record[field].map((c: any) => c.name).join(", ")
        : "N/A";
    }
    return record[field];
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container mx-auto p-4">
        <div className="flex justify-center mb-8">
          <AtamsaLogo />
        </div>

        {/* Traveler Registration Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Traveler Registration
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <FormField
              label={fieldLabels.roomNumber}
              name="roomNumber"
              value={form.roomNumber}
              onChange={handleChange}
              type="select"
              options={roomNumbers}
              required
            />
            <FormField
              label={fieldLabels.name}
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <FormField
              label={fieldLabels.nationality}
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              required
            />

            <FormField
              label={fieldLabels.origin}
              name="origin"
              value={form.origin}
              onChange={handleChange}
              required
            />
            <FormField
              label={fieldLabels.reservedNights}
              name="reservedNights"
              value={form.reservedNights}
              onChange={handleChange}
              type="number"
              required
            />
            <FormField
              label={fieldLabels.reservationLocation}
              name="reservationLocation"
              value={form.reservationLocation}
              onChange={handleChange}
              type="select"
              options={reservationLocations}
              required
            />
            <FormField
              label={fieldLabels.destination}
              name="destination"
              value={form.destination}
              onChange={handleChange}
              required
            />
            <FormField
              label={fieldLabels.idType}
              name="idType"
              value={form.idType}
              onChange={handleChange}
              type="select"
              options={idTypes}
              required
            />
            <FormField
              label={fieldLabels.idNumber}
              name="idNumber"
              value={form.idNumber}
              onChange={handleChange}
              required
            />
            <FormField
              label={fieldLabels.expeditionPlace}
              name="expeditionPlace"
              value={form.expeditionPlace}
              onChange={handleChange}
              required
            />
            <FormField
              label={fieldLabels.amountPaid}
              name="amountPaid"
              value={form.amountPaid}
              onChange={handleChange}
              type="number"
              required
            />
            <FormField
              label={fieldLabels.paymentMethod}
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              type="select"
              options={paymentMethods}
              required
            />
            <FormField
              label={fieldLabels.breakfast}
              name="breakfast"
              checked={form.breakfast}
              onChange={handleChange}
              type="checkbox"
            />
            <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4 mt-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors duration-200"
              >
                {editingId ? "Update Traveler" : "Register Traveler"}
              </button>
            </div>
          </form>
        </div>

        {/* Companion Registration Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Companion Registration
          </h2>
          <div className="flex items-end space-x-4 mb-4">
            <div className="flex-grow">
              <FormField
                label="Search Traveler by ID"
                name="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Traveler ID Number"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Search
            </button>
          </div>
          <form
            onSubmit={handleCompanionSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <FormField
              label={companionFieldLabels.mainTravelerId}
              name="mainTravelerId"
              value={companionForm.mainTravelerId}
              onChange={handleCompanionChange}
              readOnly
              required
            />
            <FormField
              label={companionFieldLabels.name}
              name="name"
              value={companionForm.name}
              onChange={handleCompanionChange}
              required
            />
            <FormField
              label={companionFieldLabels.idType}
              name="idType"
              value={companionForm.idType}
              onChange={handleCompanionChange}
              type="select"
              options={idTypes}
              required
            />
            <FormField
              label={companionFieldLabels.idNumber}
              name="idNumber"
              value={companionForm.idNumber}
              onChange={handleCompanionChange}
              required
            />
            <FormField
              label={companionFieldLabels.expeditionPlace}
              name="expeditionPlace"
              value={companionForm.expeditionPlace}
              onChange={handleCompanionChange}
              required
            />
            <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-500 text-gray-800 rounded-md hover:bg-yellow-600 transition-colors duration-200"
              >
                Add Companion
              </button>
            </div>
          </form>
        </div>

        <TravelerList refreshTrigger={refreshList} onEdit={handleEdit} />
      </div>
    </div>
  );
}
