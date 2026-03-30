"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PublicModal from "@/components/PublicModal";
import { calculateReservationAmounts } from "@/lib/reservation-pricing";
import {
  addDays,
  createLocalDateFromDayString,
  formatReservationDateInput,
  getDayDiff,
  getDayOffset,
  normalizeStoredReservationDate,
  overlapsRange,
} from "@/lib/reservation-dates";

type CalendarDay = {
  key: string;
  iso: string;
  dayNumber: number;
  weekDayShort: string;
  monthShort: string;
};

type ReservationBlock = {
  id: string;
  guestName: string;
  phoneNumber: string;
  email: string;
  hasIva: boolean;
  paymentMethod: string;
  notes: string;
  guestCount: number;
  roomPrice: number;
  travelerId: string | null;
  isPersisted: boolean;
  roomId: string | null;
  roomNumber: string;
  roomType: string;
  hotel: string;
  status: string;
  source: string | null;
  checkIn: string;
  checkOut: string;
  startOffsetDays: number;
  spanDays: number;
  isClippedStart: boolean;
  isClippedEnd: boolean;
  colorKey: string;
};

type CalendarRoom = {
  roomId: string;
  roomNumber: string;
  hotel: string;
  state: string;
  reservations: ReservationBlock[];
};

type CalendarGroup = {
  roomType: string;
  rooms: CalendarRoom[];
};

type RoomOption = {
  _id: string;
  roomNumber: string;
  hotel: string;
  roomType: string;
};

type ReservationFormState = {
  guestName: string;
  phoneNumber: string;
  email: string;
  hasIva: boolean;
  paymentMethod: string;
  guestCount: string;
  roomPrice: string;
  roomId: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source: string;
  notes: string;
};

type ReservationExtraDraft = {
  id: string;
  name: string;
  unitValue: string;
  quantity: string;
};

type ReservationExtraPayload = {
  name: string;
  unitValue: number;
  quantity: number;
  totalValue: number;
};

const DAY_COLUMN_WIDTH = 110;
const ROOM_COLUMN_WIDTH = 170;

function formatInputDate(date: Date) {
  return formatReservationDateInput(date);
}

function colorClasses(colorKey: string) {
  switch (colorKey) {
    case "confirmed":
      return "bg-emerald-500 text-white border-emerald-700";
    case "checked_in":
      return "bg-red-500 text-white border-red-700";
    case "checked_out":
      return "bg-sky-300 text-sky-950 border-sky-500";
    case "noshow":
      return "bg-violet-300 text-violet-950 border-violet-500";
    case "cancelled":
      return "bg-slate-400 text-white border-slate-600 opacity-80";
    case "unassigned":
      return "bg-amber-500 text-white border-amber-700";
    default:
      return "bg-emerald-500 text-white border-emerald-700";
  }
}

function getStatusColorKey(status: string) {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "checked_in":
      return "checked_in";
    case "checked_out":
      return "checked_out";
    case "noshow":
      return "noshow";
    case "cancelled":
      return "cancelled";
    case "unassigned":
      return "unassigned";
    default:
      return "confirmed";
  }
}

function getReservationBlockStyle(reservation: ReservationBlock) {
  const blockInset = 4;
  const left =
    reservation.startOffsetDays * DAY_COLUMN_WIDTH +
    (reservation.isClippedStart ? blockInset : DAY_COLUMN_WIDTH / 2 + blockInset);

  const width =
    reservation.spanDays * DAY_COLUMN_WIDTH +
    (reservation.isClippedStart ? DAY_COLUMN_WIDTH / 2 : 0) +
    (reservation.isClippedEnd ? DAY_COLUMN_WIDTH / 2 : 0) -
    blockInset * 2;

  return {
    left,
    width: Math.max(32, width),
  };
}

const statusLegend = [
  {
    key: "confirmed",
    label: "Confirmada",
    dotClass: "bg-emerald-500 border-emerald-700",
  },
  {
    key: "checked_in",
    label: "Check-in",
    dotClass: "bg-red-500 border-red-700",
  },
  {
    key: "checked_out",
    label: "Check-out",
    dotClass: "bg-sky-300 border-sky-500",
  },
  {
    key: "noshow",
    label: "No presentado",
    dotClass: "bg-violet-300 border-violet-500",
  },
  {
    key: "unassigned",
    label: "No asignada",
    dotClass: "bg-amber-500 border-amber-700",
  },
  {
    key: "cancelled",
    label: "Cancelada",
    dotClass: "bg-slate-400 border-slate-600",
  },
];

const reservationSourceOptions = [
  "Directo",
  "Booking",
  "Expedia",
  "Airbnb",
  "Despegar",
  "BestTravel",
  "Otro",
];

const paymentMethodOptions = [
  "Efectivo",
  "Datafono",
  "Transferencia Nequi",
  "Transferencia Banco",
  "Airbnb",
  "Ota Colect",
  "Debe",
];

const reservationModalSections = [
  "DETALLES",
  "HUÉSPEDES",
  "SERVICIOS INCLUIDOS",
  "ELEMENTOS EXTRAS",
  "PAGOS",
  "NOTAS",
  "FACTURAS",
];

function createInitialReservationForm(startDate: string, hotelFilter: string): ReservationFormState {
  return {
    guestName: "",
    phoneNumber: "",
    email: "",
    hasIva: false,
    paymentMethod: "",
    guestCount: "1",
    roomPrice: "",
    roomId: "",
    hotel: hotelFilter || "Natural Sevgi",
    checkIn: startDate,
    checkOut: formatInputDate(addDays(createLocalDateFromDayString(startDate), 1)),
    status: "confirmed",
    source: "",
    notes: "",
  };
}

function createEmptyReservationExtra(index: number): ReservationExtraDraft {
  return {
    id: `${Date.now()}-${index}`,
    name: "",
    unitValue: "0",
    quantity: "1",
  };
}

function mapExtrasToDrafts(extras: unknown): ReservationExtraDraft[] {
  if (!Array.isArray(extras)) {
    return [];
  }

  return extras.map((extra, index) => {
    const item = extra as Record<string, unknown>;
    return {
      id: String(item.id || item._id || `${Date.now()}-${index}`),
      name: String(item.name || ""),
      unitValue: String(item.unitValue ?? 0),
      quantity: String(item.quantity ?? 1),
    };
  });
}

function serializeReservationExtras(extras: ReservationExtraDraft[]): ReservationExtraPayload[] {
  return extras
    .map((extra) => {
      const name = extra.name.trim();
      const unitValue = Math.max(0, Number(extra.unitValue || 0));
      const quantity = Math.max(0, Number(extra.quantity || 0));

      if (!name) {
        return null;
      }

      return {
        name,
        unitValue,
        quantity,
        totalValue: unitValue * quantity,
      };
    })
    .filter(Boolean) as ReservationExtraPayload[];
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [hotel, setHotel] = useState("");
  const [start, setStart] = useState(() => formatInputDate(new Date()));
  const [daysToShow, setDaysToShow] = useState(14);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [groups, setGroups] = useState<CalendarGroup[]>([]);
  const [unassigned, setUnassigned] = useState<ReservationBlock[]>([]);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [activeReservationSection, setActiveReservationSection] = useState("DETALLES");
  const [reservationExtras, setReservationExtras] = useState<ReservationExtraDraft[]>([]);
  const [reservationExtraDrafts, setReservationExtraDrafts] = useState<ReservationExtraDraft[]>([]);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [isLegacyReservationDraft, setIsLegacyReservationDraft] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [deletingReservation, setDeletingReservation] = useState(false);
  const [previewReservationId, setPreviewReservationId] = useState<string | null>(null);
  const [draggedReservationId, setDraggedReservationId] = useState<string | null>(null);
  const [dragTargetRoomId, setDragTargetRoomId] = useState<string | null>(null);
  const [dragTargetDayIndex, setDragTargetDayIndex] = useState<number | null>(null);
  const [isUnassignedDropActive, setIsUnassignedDropActive] = useState(false);
  const [reservationForm, setReservationForm] = useState<ReservationFormState>(() =>
    createInitialReservationForm(formatInputDate(new Date()), "")
  );
  const previewLayerRef = useRef<HTMLDivElement | null>(null);

  const end = useMemo(
    () => formatInputDate(addDays(createLocalDateFromDayString(start), daysToShow)),
    [start, daysToShow]
  );
  const rangeStartDate = useMemo(() => createLocalDateFromDayString(start), [start]);
  const rangeEndDate = useMemo(() => createLocalDateFromDayString(end), [end]);
  const availableRooms = useMemo(
    () => rooms.filter((room) => !reservationForm.hotel || room.hotel === reservationForm.hotel),
    [reservationForm.hotel, rooms]
  );
  const reservationsIndex = useMemo(() => {
    const index = new Map<string, ReservationBlock>();

    groups.forEach((group) => {
      group.rooms.forEach((room) => {
        room.reservations.forEach((reservation) => {
          index.set(reservation.id, reservation);
        });
      });
    });

    unassigned.forEach((reservation) => {
      index.set(reservation.id, reservation);
    });

    return index;
  }, [groups, unassigned]);

  const sortReservationBlocks = useCallback(
    (items: ReservationBlock[]) =>
      [...items].sort((left, right) =>
        left.startOffsetDays === right.startOffsetDays
          ? left.guestName.localeCompare(right.guestName)
          : left.startOffsetDays - right.startOffsetDays
      ),
    []
  );

  const buildReservationBlock = useCallback(
    (reservation: any): ReservationBlock | null => {
      const checkIn = normalizeStoredReservationDate(reservation.checkIn);
      const checkOut = normalizeStoredReservationDate(reservation.checkOut);

      if (!overlapsRange(checkIn, checkOut, rangeStartDate, rangeEndDate)) {
        return null;
      }

      const roomId =
        typeof reservation.roomId === "object" && reservation.roomId !== null
          ? String(reservation.roomId._id || reservation.roomId)
          : reservation.roomId
            ? String(reservation.roomId)
            : null;

      const roomOption = roomId ? rooms.find((room) => room._id === roomId) : null;
      const roomNumber =
        reservation.roomId && typeof reservation.roomId === "object"
          ? reservation.roomId.roomNumber
          : roomOption?.roomNumber || reservation.roomNumberSnapshot || "";
      const roomType =
        reservation.roomId && typeof reservation.roomId === "object"
          ? reservation.roomId.roomType
          : roomOption?.roomType || reservation.roomTypeSnapshot || "Sin categoría";
      const reservationHotel =
        reservation.roomId && typeof reservation.roomId === "object"
          ? reservation.roomId.hotel
          : roomOption?.hotel || reservation.hotel || "";

      if (hotel && reservationHotel !== hotel) {
        return null;
      }

      const blockStart = checkIn < rangeStartDate ? rangeStartDate : checkIn;
      const blockEnd = checkOut > rangeEndDate ? rangeEndDate : checkOut;

      return {
        id: String(reservation._id || reservation.id),
        guestName: reservation.guestName,
        phoneNumber: reservation.phoneNumber || "",
        email: reservation.email || "",
        hasIva: Boolean(reservation.hasIva),
        paymentMethod: reservation.paymentMethod || "",
        notes: reservation.notes || "",
        guestCount: Number(reservation.guestCount || 1),
        roomPrice: Number(reservation.roomPrice || 0),
        travelerId: reservation.travelerId ? String(reservation.travelerId) : null,
        isPersisted: reservation.isPersisted !== undefined ? reservation.isPersisted : true,
        roomId,
        roomNumber,
        roomType,
        hotel: reservationHotel,
        status: reservation.status,
        source: reservation.source || null,
        checkIn: formatReservationDateInput(checkIn),
        checkOut: formatReservationDateInput(checkOut),
        startOffsetDays: getDayOffset(rangeStartDate, blockStart),
        spanDays: getDayDiff(blockStart, blockEnd),
        isClippedStart: checkIn < rangeStartDate,
        isClippedEnd: checkOut > rangeEndDate,
        colorKey: getStatusColorKey(reservation.status),
      };
    },
    [hotel, rangeEndDate, rangeStartDate, rooms]
  );

  const applyReservationToState = useCallback(
    (reservation: any) => {
      const nextBlock = buildReservationBlock(reservation);
      const reservationId = String(reservation._id || reservation.id);

      setUnassigned((current) => {
        const filtered = current.filter((item) => item.id !== reservationId);
        if (nextBlock && !nextBlock.roomId) {
          return sortReservationBlocks([...filtered, nextBlock]);
        }
        return filtered;
      });

      setGroups((currentGroups) =>
        currentGroups.map((group) => ({
          ...group,
          rooms: group.rooms.map((room) => {
            const filteredReservations = room.reservations.filter((item) => item.id !== reservationId);

            if (nextBlock && nextBlock.roomId === room.roomId) {
              return {
                ...room,
                reservations: sortReservationBlocks([...filteredReservations, nextBlock]),
              };
            }

            return {
              ...room,
              reservations: filteredReservations,
            };
          }),
        }))
      );
    },
    [buildReservationBlock, sortReservationBlocks]
  );

  const removeReservationFromState = useCallback((reservationId: string) => {
    setUnassigned((current) => current.filter((item) => item.id !== reservationId));
    setGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        rooms: group.rooms.map((room) => ({
          ...room,
          reservations: room.reservations.filter((item) => item.id !== reservationId),
        })),
      }))
    );
  }, []);

  const fetchCalendar = useCallback(async () => {
    setLoadingCalendar(true);

    try {
      const params = new URLSearchParams({
        start,
        end,
      });

      if (hotel) {
        params.set("hotel", hotel);
      }

      const response = await fetch(`/api/calendar/reservations?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo cargar el calendario.");
        return;
      }

      setDays(data.data.days);
      setGroups(data.data.groups);
      setUnassigned(data.data.unassigned);
    } catch (error) {
      toast.error("Ocurrió un error al cargar el calendario.");
    } finally {
      setLoadingCalendar(false);
    }
  }, [end, hotel, start]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
          if (!data.data.authorized && !data.data.isWaitress) {
            router.push("/unauthorized");
          }
        } else if (response.status === 401) {
          router.push("/login");
        } else {
          router.push("/unauthorized");
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
    if (loadingUser || !user || (!user.authorized && !user.isWaitress)) {
      return;
    }
    fetchCalendar();
  }, [fetchCalendar, loadingUser, user]);

  useEffect(() => {
    if (loadingUser || !user || (!user.authorized && !user.isWaitress)) {
      return;
    }

    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/rooms");
        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "No se pudieron cargar las habitaciones.");
          return;
        }

        setRooms(data.data);
      } catch (error) {
        toast.error("Ocurrió un error al cargar las habitaciones.");
      }
    };

    fetchRooms();
  }, [loadingUser, user]);

  const goToday = () => setStart(formatInputDate(new Date()));
  const goPreviousRange = () =>
    setStart(formatInputDate(addDays(createLocalDateFromDayString(start), -daysToShow)));
  const goNextRange = () =>
    setStart(formatInputDate(addDays(createLocalDateFromDayString(start), daysToShow)));

  const resetReservationModal = () => {
    setEditingReservationId(null);
    setIsLegacyReservationDraft(false);
    setActiveReservationSection("DETALLES");
    setReservationExtras([]);
    setReservationExtraDrafts([]);
    setReservationForm(createInitialReservationForm(start, hotel));
  };

  const openNewReservationModal = () => {
    resetReservationModal();
    setIsReservationModalOpen(true);
  };

  const openEditReservationModal = async (reservation: ReservationBlock) => {
    if (!reservation.isPersisted) {
      setEditingReservationId(null);
      setIsLegacyReservationDraft(true);
      setReservationForm({
        guestName: reservation.guestName || "",
        phoneNumber: reservation.phoneNumber || "",
        email: reservation.email || "",
        hasIva: Boolean(reservation.hasIva),
        paymentMethod: reservation.paymentMethod || "",
        guestCount: String(reservation.guestCount || 1),
        roomPrice: String(reservation.roomPrice || ""),
        roomId: reservation.roomId || "",
        hotel: reservation.hotel || hotel || "Natural Sevgi",
        checkIn: reservation.checkIn.slice(0, 10),
        checkOut: reservation.checkOut.slice(0, 10),
        status: reservation.roomId ? reservation.status || "confirmed" : "unassigned",
        source: reservation.source || "",
        notes: `Migrada desde traveler ${reservation.travelerId || reservation.id}`,
      });
      setReservationExtras([]);
      setReservationExtraDrafts([]);
      setIsReservationModalOpen(true);
      return;
    }

    try {
      const response = await fetch(`/api/calendar/reservations/${reservation.id}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo cargar la reserva.");
        return;
      }

      const persistedReservation = data.data;
      setEditingReservationId(persistedReservation._id);
      setIsLegacyReservationDraft(false);
      setReservationExtras(mapExtrasToDrafts(persistedReservation.extras));
      setReservationExtraDrafts([]);
      setReservationForm({
        guestName: persistedReservation.guestName || "",
        phoneNumber: persistedReservation.phoneNumber || "",
        email: persistedReservation.email || "",
        hasIva: Boolean(persistedReservation.hasIva),
        paymentMethod: persistedReservation.paymentMethod || "",
        guestCount: String(persistedReservation.guestCount || 1),
        roomPrice: String(persistedReservation.roomPrice || ""),
        roomId:
          typeof persistedReservation.roomId === "object" && persistedReservation.roomId !== null
            ? String(persistedReservation.roomId._id)
            : persistedReservation.roomId
              ? String(persistedReservation.roomId)
              : "",
        hotel:
          persistedReservation.roomId && typeof persistedReservation.roomId === "object"
            ? persistedReservation.roomId.hotel
            : persistedReservation.hotel || "",
        checkIn: persistedReservation.checkIn?.slice(0, 10) || start,
        checkOut:
          persistedReservation.checkOut?.slice(0, 10) ||
          formatInputDate(addDays(createLocalDateFromDayString(start), 1)),
        status: persistedReservation.status || "confirmed",
        source: persistedReservation.source || "",
        notes: persistedReservation.notes || "",
      });
      setIsReservationModalOpen(true);
    } catch (error) {
      toast.error("Ocurrió un error al cargar la reserva.");
    }
  };

  const handleReservationFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : value;
    setReservationForm((current) => ({ ...current, [name]: nextValue }));
  };

  const handleReservationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingReservation(true);

    try {
      const serializedExtras = serializeReservationExtras([
        ...reservationExtras,
        ...reservationExtraDrafts,
      ]);
      const payload = {
        ...reservationForm,
        guestCount: Number(reservationForm.guestCount || 1),
        roomPrice: Number(reservationForm.roomPrice || 0),
        roomId: reservationForm.roomId || null,
        extras: serializedExtras,
      };

      const response = await fetch(
        editingReservationId
          ? `/api/calendar/reservations/${editingReservationId}`
          : "/api/calendar/reservations",
        {
          method: editingReservationId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo guardar la reserva.");
        return;
      }

      setReservationExtras(mapExtrasToDrafts(data.data?.extras));
      setReservationExtraDrafts([]);
      toast.success(editingReservationId ? "Reserva actualizada." : "Reserva creada.");
      applyReservationToState(data.data);
      setIsReservationModalOpen(false);
      resetReservationModal();
    } catch (error) {
      toast.error("Ocurrió un error al guardar la reserva.");
    } finally {
      setSavingReservation(false);
    }
  };

  const handleSyncSheets = async () => {
    setSyncingSheets(true);

    try {
      const response = await fetch("/api/calendar/sync-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotel: hotel || null,
          start,
          end,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo sincronizar con Google Sheets.");
        return;
      }

      toast.success(`Sincronización lista. Reservas enviadas: ${data.data.synced}.`);
    } catch (error) {
      toast.error("Ocurrió un error al sincronizar con Google Sheets.");
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleDragStart = (reservationId: string) => {
    setPreviewReservationId((current) => (current === reservationId ? null : current));
    setDraggedReservationId(reservationId);
  };

  const handleDragEnd = () => {
    setDraggedReservationId(null);
    setDragTargetRoomId(null);
    setDragTargetDayIndex(null);
    setIsUnassignedDropActive(false);
  };

  const toggleReservationPreview = (reservationId: string) => {
    setPreviewReservationId((current) => (current === reservationId ? null : reservationId));
  };

  const closeReservationPreview = (reservationId?: string) => {
    setPreviewReservationId((current) =>
      !reservationId || current === reservationId ? null : current
    );
  };

  useEffect(() => {
    if (!previewReservationId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!previewLayerRef.current?.contains(event.target as Node)) {
        setPreviewReservationId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [previewReservationId]);

  const handleDeleteReservation = async () => {
    if (!editingReservationId) {
      return;
    }

    const confirmed = window.confirm("¿Seguro que deseas eliminar esta reserva?");
    if (!confirmed) {
      return;
    }

    setDeletingReservation(true);

    try {
      const response = await fetch(`/api/calendar/reservations/${editingReservationId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo eliminar la reserva.");
        return;
      }

      removeReservationFromState(editingReservationId);
      toast.success("Reserva eliminada.");
      setIsReservationModalOpen(false);
      resetReservationModal();
    } catch (error) {
      toast.error("Ocurrió un error al eliminar la reserva.");
    } finally {
      setDeletingReservation(false);
    }
  };

  const handleAddReservationExtra = () => {
    setReservationExtraDrafts((current) => [
      ...current,
      createEmptyReservationExtra(current.length),
    ]);
  };

  const handleRemoveReservationExtra = (extraId: string) => {
    setReservationExtraDrafts((current) => current.filter((extra) => extra.id !== extraId));
  };

  const handleReservationExtraChange = (
    extraId: string,
    field: keyof Omit<ReservationExtraDraft, "id">,
    value: string
  ) => {
    setReservationExtraDrafts((current) =>
      current.map((extra) => (extra.id === extraId ? { ...extra, [field]: value } : extra))
    );
  };

  const handleRemoveSavedReservationExtra = (extraId: string) => {
    setReservationExtras((current) => current.filter((extra) => extra.id !== extraId));
  };

  const handleMoveReservation = async (
    reservationId: string,
    {
      roomId,
      dayIndex,
      unassign = false,
    }: { roomId: string | null; dayIndex?: number | null; unassign?: boolean }
  ) => {
    const reservation = reservationsIndex.get(reservationId);
    if (!reservation) {
      toast.error("No se encontró la reserva seleccionada.");
      return;
    }

    try {
      if (!reservation.isPersisted) {
        const bootstrapResponse = await fetch("/api/calendar/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guestName: reservation.guestName,
            phoneNumber: reservation.phoneNumber || "",
            email: reservation.email || "",
            hasIva: Boolean(reservation.hasIva),
            paymentMethod: reservation.paymentMethod || "",
            guestCount: reservation.guestCount || 1,
            roomPrice: reservation.roomPrice || 0,
            travelerId: reservation.travelerId,
            roomId: unassign ? null : roomId,
            hotel: reservation.hotel,
            checkIn: dayIndex !== null && dayIndex !== undefined
              ? formatInputDate(addDays(createLocalDateFromDayString(start), dayIndex))
              : reservation.checkIn.slice(0, 10),
            checkOut: (() => {
              const currentCheckIn = normalizeStoredReservationDate(reservation.checkIn);
              const currentCheckOut = normalizeStoredReservationDate(reservation.checkOut);
              const durationDays = Math.max(
                1,
                Math.round((currentCheckOut.getTime() - currentCheckIn.getTime()) / (24 * 60 * 60 * 1000))
              );
              const nextCheckIn = dayIndex !== null && dayIndex !== undefined
                ? formatInputDate(addDays(createLocalDateFromDayString(start), dayIndex))
                : reservation.checkIn.slice(0, 10);
              return formatInputDate(addDays(createLocalDateFromDayString(nextCheckIn), durationDays));
            })(),
            status: unassign ? "unassigned" : reservation.status || "confirmed",
            source: reservation.source || "",
            notes: `Creada desde bloque legacy ${reservation.travelerId || reservation.id}`,
          }),
        });

        const bootstrapData = await bootstrapResponse.json();

        if (!bootstrapResponse.ok || !bootstrapData.success) {
          toast.error(bootstrapData.error || "No se pudo convertir la reserva heredada.");
          return;
        }

        toast.success("Reserva heredada convertida y movida correctamente.");
        applyReservationToState(bootstrapData.data);
        handleDragEnd();
        return;
      }

      let response: Response;

      if (unassign) {
        response = await fetch(`/api/calendar/reservations/${reservationId}/assign-room`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId: null,
            status: "unassigned",
          }),
        });
      } else {
        const currentCheckIn = normalizeStoredReservationDate(reservation.checkIn);
        const currentCheckOut = normalizeStoredReservationDate(reservation.checkOut);
        const durationDays = Math.max(
          1,
          Math.round((currentCheckOut.getTime() - currentCheckIn.getTime()) / (24 * 60 * 60 * 1000))
        );
        const nextCheckIn = dayIndex !== null && dayIndex !== undefined
          ? formatInputDate(addDays(createLocalDateFromDayString(start), dayIndex))
          : reservation.checkIn.slice(0, 10);
        const nextCheckOut = formatInputDate(addDays(createLocalDateFromDayString(nextCheckIn), durationDays));

        response = await fetch(`/api/calendar/reservations/${reservationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            hotel: roomId
              ? rooms.find((room) => room._id === roomId)?.hotel || reservation.hotel
              : reservation.hotel,
            checkIn: nextCheckIn,
            checkOut: nextCheckOut,
            status: roomId ? reservation.status : "unassigned",
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo mover la reserva.");
        return;
      }

      toast.success(
        unassign
          ? "Reserva enviada a no asignadas."
          : "Reserva movida en el calendario."
      );
      applyReservationToState(data.data);
    } catch (error) {
      toast.error("Ocurrió un error al mover la reserva.");
    } finally {
      handleDragEnd();
    }
  };

  if (loadingUser || loadingCalendar) {
    return <div className="flex min-h-screen items-center justify-center">Cargando calendario...</div>;
  }

  if (!user || (!user.authorized && !user.isWaitress)) {
    return null;
  }

  const reservationPriceValue = Number(reservationForm.roomPrice || 0);
  const pricingPreview = calculateReservationAmounts(reservationPriceValue, reservationForm.hasIva);
  const estimatedTaxValue = pricingPreview.ivaAmount;
  const estimatedTotalValue = pricingPreview.roomPriceWithIva;
  const filledReservationExtras = reservationExtras.filter((extra) => extra.name.trim());
  const savedExtrasTotal = filledReservationExtras.reduce((sum, extra) => {
    const unitValue = Number(extra.unitValue || 0);
    const quantity = Number(extra.quantity || 0);
    return sum + unitValue * quantity;
  }, 0);
  const estimatedReservationGrandTotal = estimatedTotalValue + savedExtrasTotal;

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-heading text-verde-principal">Calendario de reservas</h1>
              <p className="mt-1 text-sm text-stone-600">
                Vista inicial de planeación por habitación, agrupada por tipo y lista para crecer hacia sincronización con Google Sheets.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <button
                type="button"
                onClick={openNewReservationModal}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Nueva reserva
              </button>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Hotel
                </label>
                <select
                  value={hotel}
                  onChange={(event) => setHotel(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="Oporto 83">Oporto 83</option>
                  <option value="Natural Sevgi">Natural Sevgi</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Inicio
                </label>
                <input
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Rango
                </label>
                <select
                  value={daysToShow}
                  onChange={(event) => setDaysToShow(Number(event.target.value))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={21}>21 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>

              <button
                type="button"
                onClick={goToday}
                className="rounded-lg bg-verde-principal px-4 py-2 text-sm font-semibold text-white"
              >
                Hoy
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goPreviousRange}
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={goNextRange}
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                >
                  Siguiente
                </button>
              </div>

              <button
                type="button"
                onClick={handleSyncSheets}
                disabled={syncingSheets}
                className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {syncingSheets ? "Sincronizando..." : "Sincronizar Sheets"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-heading text-slate-800">Leyenda del calendario</h2>
              <p className="text-sm text-stone-600">
                Los colores identifican el estado operativo de cada reserva y ayudan a detectar rápido qué está ocupando cada habitación.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {statusLegend.map((item) => (
                <div
                  key={item.key}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
                >
                  <span className={`h-3 w-3 rounded-full border ${item.dotClass}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {unassigned.length > 0 ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsUnassignedDropActive(true);
            }}
            onDragLeave={() => setIsUnassignedDropActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsUnassignedDropActive(false);
              if (draggedReservationId) {
                handleMoveReservation(draggedReservationId, { roomId: null, unassign: true });
              }
            }}
            className={`rounded-2xl border p-4 shadow-sm transition-colors ${
              isUnassignedDropActive
                ? "border-amber-400 bg-amber-100"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <h2 className="text-lg font-heading text-amber-800">Reservas no asignadas</h2>
            <p className="mt-1 text-sm text-amber-700">
              Arrastra aquí una reserva para quitarle la habitación actual.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {unassigned.map((reservation) => (
                <button
                  type="button"
                  key={reservation.id}
                  onClick={() => openEditReservationModal(reservation)}
                  draggable
                  onDragStart={() => handleDragStart(reservation.id)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-lg border px-3 py-2 text-sm shadow-sm ${colorClasses(reservation.colorKey)}`}
                >
                  {reservation.guestName} · {reservation.checkIn.slice(0, 10)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div
            className="min-w-max"
            style={{ width: ROOM_COLUMN_WIDTH + days.length * DAY_COLUMN_WIDTH }}
          >
            <div className="sticky top-0 z-20 grid border-b border-stone-200 bg-stone-50"
              style={{ gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${days.length}, ${DAY_COLUMN_WIDTH}px)` }}>
              <div className="border-r border-stone-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
                Habitación
              </div>
              {days.map((day) => (
                <div key={day.key} className="border-r border-stone-200 px-2 py-3 text-center">
                  <div className="text-xs font-semibold text-stone-500">{day.weekDayShort}</div>
                  <div className="text-2xl font-semibold text-stone-800">{day.dayNumber}</div>
                  <div className="text-xs text-stone-500">{day.monthShort}</div>
                </div>
              ))}
            </div>

            {groups.map((group) => (
              <div key={group.roomType} className="border-b border-stone-200 last:border-b-0">
                <div className="border-b border-stone-200 bg-sky-50 px-4 py-3 text-xl font-heading text-slate-700">
                  {group.roomType}
                </div>

                {group.rooms.map((room) => (
                  <div
                    key={room.roomId}
                    className="grid border-b border-stone-100 last:border-b-0"
                    style={{ gridTemplateColumns: `${ROOM_COLUMN_WIDTH}px repeat(${days.length}, ${DAY_COLUMN_WIDTH}px)` }}
                  >
                    <div className="border-r border-stone-200 bg-stone-50 px-4 py-4">
                      <div className="text-xl font-semibold text-stone-800">{room.roomNumber}</div>
                      <div className="text-xs uppercase tracking-wide text-stone-500">{room.hotel}</div>
                    </div>

                    <div
                      className="relative col-span-full"
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragTargetRoomId(room.roomId);
                        const rowRect = event.currentTarget.getBoundingClientRect();
                        const offsetX = Math.max(0, event.clientX - rowRect.left);
                        const dayIndex = Math.max(
                          0,
                          Math.min(days.length - 1, Math.floor(offsetX / DAY_COLUMN_WIDTH))
                        );
                        setDragTargetDayIndex(dayIndex);
                      }}
                      onDragLeave={() => {
                        setDragTargetRoomId((current) => (current === room.roomId ? null : current));
                        setDragTargetDayIndex((current) =>
                          dragTargetRoomId === room.roomId ? null : current
                        );
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragTargetRoomId(null);
                        const rowRect = event.currentTarget.getBoundingClientRect();
                        const offsetX = Math.max(0, event.clientX - rowRect.left);
                        const dayIndex = Math.max(
                          0,
                          Math.min(days.length - 1, Math.floor(offsetX / DAY_COLUMN_WIDTH))
                        );
                        setDragTargetDayIndex(null);
                        if (draggedReservationId) {
                          handleMoveReservation(draggedReservationId, {
                            roomId: room.roomId,
                            dayIndex,
                          });
                        }
                      }}
                      style={{
                        gridColumn: `2 / span ${days.length}`,
                        minHeight: 72,
                        backgroundImage: `linear-gradient(to right, rgba(203,213,225,0.7) 1px, transparent 1px)`,
                        backgroundSize: `${DAY_COLUMN_WIDTH}px 100%`,
                      }}
                    >
                      {dragTargetRoomId === room.roomId ? (
                        <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/70" />
                      ) : null}
                      {dragTargetRoomId === room.roomId && dragTargetDayIndex !== null ? (
                        <div
                          className="pointer-events-none absolute inset-y-2 w-[110px] rounded-md border border-emerald-500 bg-emerald-200/60"
                          style={{ left: dragTargetDayIndex * DAY_COLUMN_WIDTH + 2 }}
                        />
                      ) : null}
                      {room.reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          draggable
                          onDragStart={() => handleDragStart(reservation.id)}
                          onDragEnd={handleDragEnd}
                          className={`absolute top-3 flex h-12 overflow-visible rounded-md border-l-4 text-sm font-semibold shadow-sm ${colorClasses(
                            reservation.colorKey
                          )}`}
                          style={getReservationBlockStyle(reservation)}
                          title={`${reservation.guestName} · ${reservation.checkIn.slice(0, 10)} → ${reservation.checkOut.slice(0, 10)}`}
                        >
                          <button
                            type="button"
                            draggable={false}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleReservationPreview(reservation.id);
                            }}
                            className="flex h-full w-5 flex-none items-center justify-center bg-black/10 text-white/95 transition hover:bg-black/20"
                            aria-label={`Ver detalles de ${reservation.guestName}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3"
                            >
                              <circle cx="11" cy="11" r="7" />
                              <path d="m20 20-3.5-3.5" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            draggable={false}
                            onClick={() => openEditReservationModal(reservation)}
                            className="min-w-0 flex-1 px-2.5 text-left"
                          >
                            <span className="block truncate">
                              {reservation.guestName}
                            </span>
                            <span className="block truncate text-[11px] font-medium text-white/85">
                              {reservation.source || reservation.status}
                            </span>
                          </button>

                          {previewReservationId === reservation.id ? (
                            <div
                              ref={previewLayerRef}
                              className="absolute left-0 top-[calc(100%+10px)] z-40 w-80 select-text rounded-2xl border border-stone-200 bg-white p-4 text-left text-stone-700 shadow-2xl"
                            >
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                                    Reserva
                                  </p>
                                  <h3 className="mt-1 text-lg font-heading text-slate-800">
                                    {reservation.guestName}
                                  </h3>
                                </div>
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                                  {reservation.status.replaceAll("_", " ")}
                                </span>
                              </div>

                              <div className="grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Habitación
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">
                                    {reservation.roomNumber || "Sin asignar"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Hotel
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">
                                    {reservation.hotel || "Sin hotel"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Check-in
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">{reservation.checkIn}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Check-out
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">{reservation.checkOut}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Teléfono
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">
                                    {reservation.phoneNumber || "Sin dato"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Correo
                                  </p>
                                  <p className="mt-1 truncate font-medium text-stone-700">
                                    {reservation.email || "Sin dato"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Personas
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">{reservation.guestCount}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                    Valor
                                  </p>
                                  <p className="mt-1 font-medium text-stone-700">
                                    {reservation.roomPrice
                                      ? `$${reservation.roomPrice.toLocaleString("es-CO")}`
                                      : "Sin valor"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                      IVA
                                    </p>
                                    <p className="mt-1 font-medium text-stone-700">
                                      {reservation.hasIva ? "Sí" : "No"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                      Forma de pago
                                    </p>
                                    <p className="mt-1 font-medium text-stone-700">
                                      {reservation.paymentMethod || "Sin especificar"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                  Ubicación de la reserva
                                </p>
                                <p className="mt-1 font-medium text-stone-700">
                                  {reservation.source || "Sin especificar"}
                                </p>
                              </div>

                              <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                  Notas
                                </p>
                                <p className="mt-1 whitespace-pre-wrap font-medium text-stone-700">
                                  {reservation.notes || "Sin notas"}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <PublicModal
        opened={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          resetReservationModal();
        }}
        size="94rem"
        title={
          editingReservationId
            ? "Editar reserva"
            : isLegacyReservationDraft
              ? "Convertir bloque heredado en reserva"
              : "Nueva reserva"
        }
      >
        <form onSubmit={handleReservationSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-[26px] border border-verde-principal/20 bg-white shadow-[0_26px_80px_-35px_rgba(21,128,61,0.28)]">
            <div className="border-b border-verde-principal bg-verde-principal px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                    Nueva reserva
                  </p>
                  <h3 className="mt-1 text-xl font-heading text-white">
                    {editingReservationId
                      ? "Editar reserva"
                      : isLegacyReservationDraft
                        ? "Convertir bloque heredado en reserva"
                        : "Nueva reserva"}
                  </h3>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  {reservationForm.checkIn} → {reservationForm.checkOut}
                </div>
              </div>
            </div>

            <div className="border-b border-verde-principal/15 bg-verde-claro/20 px-4 py-0">
              <div className="flex flex-wrap gap-1 overflow-x-auto text-[11px] font-semibold uppercase tracking-wide text-verde-principal">
                {reservationModalSections.map((section, index) => (
                  <div
                    key={section}
                    onClick={() => setActiveReservationSection(section)}
                    className={`rounded-t-xl px-4 py-3 ${
                      activeReservationSection === section
                        ? "bg-white text-verde-principal shadow-sm"
                        : "text-verde-principal/75"
                    } cursor-pointer transition-colors hover:text-verde-principal`}
                  >
                    {section}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 p-6">
              <div className="mb-5 rounded-2xl border border-verde-principal/15 bg-verde-principal/10 px-4 py-3 text-sm font-medium text-verde-principal">
                Reserva creada correctamente.
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_380px]">
                <div className="space-y-5">
                  {activeReservationSection === "DETALLES" ? (
                  <>
                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">Entrada</label>
                        <input
                          type="date"
                          name="checkIn"
                          value={reservationForm.checkIn}
                          onChange={handleReservationFormChange}
                          required
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">Salida</label>
                        <input
                          type="date"
                          name="checkOut"
                          value={reservationForm.checkOut}
                          onChange={handleReservationFormChange}
                          required
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">Hotel</label>
                        <select
                          name="hotel"
                          value={reservationForm.hotel}
                          onChange={(event) => {
                            handleReservationFormChange(event);
                            setReservationForm((current) => ({ ...current, roomId: "" }));
                          }}
                          required
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        >
                          <option value="Natural Sevgi">Natural Sevgi</option>
                          <option value="Oporto 83">Oporto 83</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-verde-oscuro/80">Estado</label>
                        <select
                          name="status"
                          value={reservationForm.status}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        >
                          <option value="confirmed">Confirmada</option>
                          <option value="checked_in">Check-in</option>
                          <option value="checked_out">Check-out</option>
                          <option value="noshow">No presentado</option>
                          <option value="cancelled">Cancelada</option>
                          <option value="unassigned">No asignada</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                        Contacto principal
                      </h4>
                      <span className="text-xs font-medium text-slate-400">
                        Datos del huésped
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">Nombre</label>
                        <input
                          name="guestName"
                          value={reservationForm.guestName}
                          onChange={handleReservationFormChange}
                          required
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">Número de teléfono</label>
                        <input
                          name="phoneNumber"
                          value={reservationForm.phoneNumber}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          placeholder="3001234567"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-stone-700">Correo electrónico</label>
                        <input
                          type="email"
                          name="email"
                          value={reservationForm.email}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          placeholder="huesped@correo.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                        Detalles de la estancia
                      </h4>
                      <span className="text-xs font-medium text-slate-400">
                        Asignación y operación
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">Habitación</label>
                        <select
                          name="roomId"
                          value={reservationForm.roomId}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        >
                          <option value="">Sin asignar</option>
                          {availableRooms.map((room) => (
                            <option key={room._id} value={room._id}>
                              {room.roomNumber} · {room.roomType}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">Adultos / personas</label>
                        <input
                          type="number"
                          min="1"
                          name="guestCount"
                          value={reservationForm.guestCount}
                          onChange={handleReservationFormChange}
                          required
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        />
                      </div>

                      <div className="xl:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-stone-700">Ubicación de la reserva</label>
                        <select
                          name="source"
                          value={reservationForm.source}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        >
                          <option value="">Select an option</option>
                          {reservationSourceOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 xl:col-span-4">
                        <label className="mb-2 block text-sm font-medium text-stone-700">Notas</label>
                        <textarea
                          name="notes"
                          value={reservationForm.notes}
                          onChange={handleReservationFormChange}
                          rows={4}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          placeholder="Agrega observaciones de la reserva, llegada o condiciones especiales..."
                        />
                      </div>
                    </div>
                  </div>
                  </>
                  ) : null}

                  {activeReservationSection === "ELEMENTOS EXTRAS" ? (
                    <div className="rounded-2xl border border-verde-principal/10 bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                            Elementos extras
                          </h4>
                          <p className="mt-2 text-sm text-stone-500">
                            Aquí puedes registrar y volver a ver los extras asociados a esta reserva.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddReservationExtra}
                          className="text-sm font-semibold text-[#ef7d57] transition hover:text-[#d9623c]"
                        >
                          + Añadir nuevo
                        </button>
                      </div>

                      {filledReservationExtras.length > 0 ? (
                        <div className="mt-5 rounded-2xl border border-verde-principal/10 bg-verde-claro/10 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                              Extras guardados
                            </h5>
                            <span className="text-xs font-medium text-stone-500">
                              {filledReservationExtras.length} {filledReservationExtras.length === 1 ? "extra" : "extras"}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {filledReservationExtras.map((extra) => {
                              const unitValue = Number(extra.unitValue || 0);
                              const quantity = Number(extra.quantity || 0);
                              const totalValue = unitValue * quantity;

                              return (
                                <div
                                  key={`summary-${extra.id}`}
                                  className="grid gap-2 rounded-xl border border-white/70 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm md:grid-cols-[minmax(0,1.6fr)_110px_110px_130px_52px]"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                      Extra
                                    </p>
                                    <p className="truncate font-medium text-stone-700">{extra.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                      Valor
                                    </p>
                                    <p className="font-medium text-stone-700">
                                      ${unitValue.toLocaleString("es-CO")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                      Cantidad
                                    </p>
                                    <p className="font-medium text-stone-700">{quantity}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                      Total
                                    </p>
                                    <p className="font-semibold text-verde-principal">
                                      ${totalValue.toLocaleString("es-CO")}
                                    </p>
                                  </div>
                                  <div className="flex items-start justify-end pt-5">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSavedReservationExtra(extra.id)}
                                      className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                                    >
                                      Borrar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-6 min-h-[120px] rounded-2xl border border-dashed border-stone-200 bg-white p-4">
                        <div className="space-y-4">
                          {reservationExtraDrafts.map((extra) => {
                            const unitValue = Number(extra.unitValue || 0);
                            const quantity = Number(extra.quantity || 0);
                            const totalValue = unitValue * quantity;

                            return (
                              <div
                                key={extra.id}
                                className="rounded-xl border border-stone-200 bg-white px-3.5 py-3 shadow-sm"
                              >
                                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_170px_130px_110px] xl:items-end">
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveReservationExtra(extra.id)}
                                      className="mb-1 text-lg font-bold leading-none text-rose-200 transition hover:text-rose-400"
                                      aria-label="Eliminar extra"
                                    >
                                      ×
                                    </button>
                                    <label className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                                      Extra
                                    </label>
                                    <input
                                      type="text"
                                      value={extra.name}
                                      onChange={(event) =>
                                        handleReservationExtraChange(extra.id, "name", event.target.value)
                                      }
                                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                                      placeholder="Escribe el nombre del extra"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                                      Total de elementos
                                    </label>
                                    <div className="flex overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
                                      <input
                                        type="number"
                                        min="0"
                                        value={extra.unitValue}
                                        onChange={(event) =>
                                          handleReservationExtraChange(extra.id, "unitValue", event.target.value)
                                        }
                                        className="w-full border-0 px-3 py-2 text-right text-sm text-stone-700 focus:outline-none focus:ring-0"
                                      />
                                      <div className="flex items-center border-l border-stone-300 px-3 text-base text-stone-500">
                                        $
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-stone-500">
                                      Cantidad
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={extra.quantity}
                                      onChange={(event) =>
                                        handleReservationExtraChange(extra.id, "quantity", event.target.value)
                                      }
                                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-right text-sm font-semibold uppercase tracking-wide text-stone-500">
                                      Total
                                    </label>
                                    <div className="pt-2 text-right text-lg font-semibold leading-none text-stone-700">
                                      ${totalValue.toLocaleString("es-CO")}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {reservationExtraDrafts.length === 0 ? (
                            <div className="flex min-h-[80px] items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,250,252,0.95))] p-8">
                              <div className="max-w-md text-center">
                                <p className="text-base font-heading text-verde-principal">
                                  No hay extras en edición
                                </p>
                                <p className="mt-2 text-sm leading-6 text-stone-500">
                                  Usa <span className="font-semibold text-[#ef7d57]">+ Añadir nuevo</span> para abrir un nuevo input de extra.
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                          Resumen de su reserva
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Panel visual de valores
                        </p>
                      </div>
                      <div className="rounded-full bg-verde-principal/10 px-3 py-1 text-xs font-semibold text-verde-principal">
                        Vista previa
                      </div>
                    </div>

                    <div className="space-y-3 border-b border-slate-100 pb-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">Tarifa de habitación</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          name="roomPrice"
                          value={reservationForm.roomPrice}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                          placeholder="0"
                        />
                      </div>

                      <div className="rounded-xl border border-verde-principal/10 bg-verde-principal/5 px-4 py-4">
                        <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
                          <input
                            type="checkbox"
                            name="hasIva"
                            checked={reservationForm.hasIva}
                            onChange={handleReservationFormChange}
                            className="h-4 w-4 rounded border-stone-300 text-verde-principal focus:ring-verde-principal/30"
                          />
                          Incluir impuestos / IVA
                        </label>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-stone-700">Forma de pago</label>
                        <select
                          name="paymentMethod"
                          value={reservationForm.paymentMethod}
                          onChange={handleReservationFormChange}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base shadow-sm focus:border-verde-principal focus:outline-none focus:ring-2 focus:ring-verde-principal/20"
                        >
                          <option value="">Selecciona una opción</option>
                          {paymentMethodOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-stone-700">
                      <div className="flex items-center justify-between gap-4">
                        <span>Precio sin IVA</span>
                        <span className="font-semibold">${pricingPreview.roomPriceWithoutIva.toLocaleString("es-CO")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Total de impuestos</span>
                        <span className="font-semibold">${estimatedTaxValue.toLocaleString("es-CO")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Total extras</span>
                        <span className="font-semibold">${savedExtrasTotal.toLocaleString("es-CO")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3 text-base font-semibold text-stone-900">
                        <span>Total reserva</span>
                        <span>${estimatedReservationGrandTotal.toLocaleString("es-CO")}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-wide text-stone-500">
                        <span>Base con IVA</span>
                        <span>${estimatedTotalValue.toLocaleString("es-CO")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-verde-principal/10 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-verde-principal">
                      Estado actual
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {reservationForm.status === "confirmed" ? "Confirmada" : reservationForm.status.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {reservationForm.paymentMethod || "Sin forma de pago"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {reservationForm.hasIva ? "Con IVA" : "Sin IVA"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              {editingReservationId ? (
                <button
                  type="button"
                  onClick={handleDeleteReservation}
                  disabled={deletingReservation || savingReservation}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingReservation ? "Eliminando..." : "Eliminar reserva"}
                </button>
              ) : (
                <span />
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsReservationModalOpen(false);
                  resetReservationModal();
                }}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingReservation || deletingReservation}
                className="rounded-xl bg-verde-principal px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingReservation
                  ? "Guardando..."
                  : editingReservationId
                    ? "Guardar cambios"
                    : isLegacyReservationDraft
                      ? "Convertir en reserva"
                      : "Crear reserva"}
              </button>
            </div>
          </div>
        </form>
      </PublicModal>
    </div>
  );
}
