"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculateReservationAmounts, calculateReservationBalance } from "@/lib/reservation-pricing";
import {
  addDays,
  createLocalDateFromDayString,
  formatReservationDateInput,
  getDayDiff,
  getDayOffset,
  normalizeStoredReservationDate,
  overlapsRange,
} from "@/lib/reservation-dates";

import {
  CalendarDay,
  CalendarGroup,
  ReservationBlock,
  ReservationExtraDraft,
  ReservationFormState,
  ReservationPayment,
  RoomOption,
} from "./types";
import {
  createEmptyReservationExtra,
  createInitialReservationForm,
  formatInputDate,
  getStatusColorKey,
  mapExtrasToDrafts,
  serializeReservationExtras,
} from "./utils";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { CalendarLegend } from "./components/CalendarLegend";
import { UnassignedReservations } from "./components/UnassignedReservations";
import { CalendarGrid } from "./components/CalendarGrid";
import { ReservationModal } from "./components/ReservationModal";

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
  const [reservationPayments, setReservationPayments] = useState<ReservationPayment[]>([]);
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
      const balance = calculateReservationBalance(reservation);

      return {
        id: String(reservation._id || reservation.id),
        guestName: reservation.guestName,
        phoneNumber: reservation.phoneNumber || "",
        email: reservation.email || "",
        hasIva: Boolean(reservation.hasIva),
        hasIvaExtras: Boolean(reservation.hasIvaExtras),
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
        payments: reservation.payments || [],
        totalPrice: balance.totalPrice,
        totalPaid: balance.totalPaid,
        pendingDebt: balance.pendingDebt,
        hasPendingDebt: balance.hasPendingDebt,
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
          const currentUser = data.data;
          setUser(currentUser);
          const isAllowed = Boolean(
            currentUser &&
            !currentUser.isWaitress &&
            (currentUser.authorized || currentUser.isAdmin || currentUser.isSuperUser)
          );
          if (!isAllowed) {
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

  const canAccessCalendar = Boolean(
    user &&
    !user.isWaitress &&
    (user.authorized || user.isAdmin || user.isSuperUser)
  );

  useEffect(() => {
    if (loadingUser || !canAccessCalendar) {
      return;
    }
    fetchCalendar();
  }, [fetchCalendar, loadingUser, canAccessCalendar]);

  useEffect(() => {
    if (loadingUser || !canAccessCalendar) {
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
  }, [canAccessCalendar, loadingUser]);

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
    setReservationPayments([]);
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
      setReservationPayments([]);
      setReservationForm({
        guestName: reservation.guestName || "",
        phoneNumber: reservation.phoneNumber || "",
        email: reservation.email || "",
        hasIva: Boolean(reservation.hasIva),
        hasIvaExtras: Boolean(reservation.hasIvaExtras),
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
      setReservationPayments(
        Array.isArray(persistedReservation.payments)
          ? persistedReservation.payments.map((p: any) => ({
              _id: p._id ? String(p._id) : undefined,
              amount: Number(p.amount || 0),
              paymentMethod: String(p.paymentMethod || "Efectivo"),
              date: p.date ? String(p.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
              notes: p.notes || "",
              registeredBy: p.registeredBy || "",
            }))
          : []
      );
      setReservationForm({
        guestName: persistedReservation.guestName || "",
        phoneNumber: persistedReservation.phoneNumber || "",
        email: persistedReservation.email || "",
        hasIva: Boolean(persistedReservation.hasIva),
        hasIvaExtras: Boolean(persistedReservation.hasIvaExtras),
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

  const handleAddPayment = async (payment: ReservationPayment) => {
    const updatedPayments = [...reservationPayments, payment];
    setReservationPayments(updatedPayments);

    if (editingReservationId) {
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
          payments: updatedPayments,
        };

        const response = await fetch(`/api/calendar/reservations/${editingReservationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          applyReservationToState(data.data);
        }
      } catch (error) {
        console.error("Error auto-updating reservation with new payment:", error);
      }
    }
  };

  const handleRemovePayment = async (index: number) => {
    const updatedPayments = reservationPayments.filter((_, i) => i !== index);
    setReservationPayments(updatedPayments);
    toast("Pago eliminado.", { icon: "ℹ️" });

    if (editingReservationId) {
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
          payments: updatedPayments,
        };

        const response = await fetch(`/api/calendar/reservations/${editingReservationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          applyReservationToState(data.data);
        }
      } catch (error) {
        console.error("Error auto-updating reservation after removing payment:", error);
      }
    }
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
        payments: reservationPayments,
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
      setReservationPayments([]);
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
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "No se pudo sincronizar con Google Sheets.");
        return;
      }

      toast.success(
        `Sincronización lista: ${data.data.synced} reservas (mes actual y 2 meses siguientes).`
      );
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
            hasIvaExtras: Boolean(reservation.hasIvaExtras),
            paymentMethod: reservation.paymentMethod || "",
            guestCount: reservation.guestCount || 1,
            roomPrice: reservation.roomPrice || 0,
            travelerId: reservation.travelerId,
            roomId: unassign ? null : roomId,
            hotel: reservation.hotel,
            checkIn:
              dayIndex !== null && dayIndex !== undefined
                ? formatInputDate(addDays(createLocalDateFromDayString(start), dayIndex))
                : reservation.checkIn.slice(0, 10),
            checkOut: (() => {
              const currentCheckIn = normalizeStoredReservationDate(reservation.checkIn);
              const currentCheckOut = normalizeStoredReservationDate(reservation.checkOut);
              const durationDays = Math.max(
                1,
                Math.round(
                  (currentCheckOut.getTime() - currentCheckIn.getTime()) / (24 * 60 * 60 * 1000)
                )
              );
              const nextCheckIn =
                dayIndex !== null && dayIndex !== undefined
                  ? formatInputDate(addDays(createLocalDateFromDayString(start), dayIndex))
                  : reservation.checkIn.slice(0, 10);
              return formatInputDate(
                addDays(createLocalDateFromDayString(nextCheckIn), durationDays)
              );
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
          Math.round(
            (currentCheckOut.getTime() - currentCheckIn.getTime()) / (24 * 60 * 60 * 1000)
          )
        );
        const nextCheckIn =
          dayIndex !== null && dayIndex !== undefined
            ? formatInputDate(addDays(createLocalDateFromDayString(start), dayIndex))
            : reservation.checkIn.slice(0, 10);
        const nextCheckOut = formatInputDate(
          addDays(createLocalDateFromDayString(nextCheckIn), durationDays)
        );

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
        unassign ? "Reserva enviada a no asignadas." : "Reserva movida en el calendario."
      );
      applyReservationToState(data.data);
    } catch (error) {
      toast.error("Ocurrió un error al mover la reserva.");
    } finally {
      handleDragEnd();
    }
  };

  if (loadingUser || loadingCalendar) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando calendario...
      </div>
    );
  }

  if (!canAccessCalendar) {
    return null;
  }

  const reservationPriceValue = Number(reservationForm.roomPrice || 0);
  const pricingPreview = calculateReservationAmounts(reservationPriceValue, reservationForm.hasIva);
  const filledReservationExtras = reservationExtras.filter((extra) => extra.name.trim());
  const savedExtrasTotal = filledReservationExtras.reduce((sum, extra) => {
    const unitValue = Number(extra.unitValue || 0);
    const quantity = Number(extra.quantity || 0);
    return sum + unitValue * quantity;
  }, 0);
  const extrasTaxValue = reservationForm.hasIvaExtras ? Math.round(savedExtrasTotal * 0.19) : 0;
  const extrasTotalWithTax = savedExtrasTotal + extrasTaxValue;
  const estimatedTaxValue = pricingPreview.ivaAmount + extrasTaxValue;
  const estimatedTotalValue = pricingPreview.roomPriceWithIva;
  const estimatedReservationGrandTotal = estimatedTotalValue + extrasTotalWithTax;

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <CalendarToolbar
          hotel={hotel}
          setHotel={setHotel}
          start={start}
          setStart={setStart}
          daysToShow={daysToShow}
          setDaysToShow={setDaysToShow}
          goToday={goToday}
          goPreviousRange={goPreviousRange}
          goNextRange={goNextRange}
          openNewReservationModal={openNewReservationModal}
          handleSyncSheets={handleSyncSheets}
          syncingSheets={syncingSheets}
        />

        <CalendarLegend />

        <UnassignedReservations
          unassigned={unassigned}
          isUnassignedDropActive={isUnassignedDropActive}
          setIsUnassignedDropActive={setIsUnassignedDropActive}
          draggedReservationId={draggedReservationId}
          handleMoveReservation={handleMoveReservation}
          openEditReservationModal={openEditReservationModal}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
        />

        <CalendarGrid
          days={days}
          groups={groups}
          dragTargetRoomId={dragTargetRoomId}
          dragTargetDayIndex={dragTargetDayIndex}
          draggedReservationId={draggedReservationId}
          setDragTargetRoomId={setDragTargetRoomId}
          setDragTargetDayIndex={setDragTargetDayIndex}
          handleMoveReservation={handleMoveReservation}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          toggleReservationPreview={toggleReservationPreview}
          openEditReservationModal={openEditReservationModal}
          previewReservationId={previewReservationId}
          previewLayerRef={previewLayerRef}
        />
      </div>

      <ReservationModal
        opened={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          resetReservationModal();
        }}
        editingReservationId={editingReservationId}
        isLegacyReservationDraft={isLegacyReservationDraft}
        reservationForm={reservationForm}
        setReservationForm={setReservationForm}
        activeReservationSection={activeReservationSection}
        setActiveReservationSection={setActiveReservationSection}
        handleReservationFormChange={handleReservationFormChange}
        availableRooms={availableRooms}
        filledReservationExtras={filledReservationExtras}
        reservationExtraDrafts={reservationExtraDrafts}
        handleAddReservationExtra={handleAddReservationExtra}
        handleRemoveReservationExtra={handleRemoveReservationExtra}
        handleRemoveSavedReservationExtra={handleRemoveSavedReservationExtra}
        handleReservationExtraChange={handleReservationExtraChange}
        reservationPayments={reservationPayments}
        onAddPayment={handleAddPayment}
        onRemovePayment={handleRemovePayment}
        pricingPreview={pricingPreview}
        estimatedTaxValue={estimatedTaxValue}
        savedExtrasTotal={savedExtrasTotal}
        estimatedReservationGrandTotal={estimatedReservationGrandTotal}
        estimatedTotalValue={estimatedTotalValue}
        handleReservationSubmit={handleReservationSubmit}
        handleDeleteReservation={handleDeleteReservation}
        savingReservation={savingReservation}
        deletingReservation={deletingReservation}
      />
    </div>
  );
}
