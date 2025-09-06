"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateRoomModal from '@/components/CreateRoomModal';
import RoomStateModal from '@/components/RoomStateModal'; // Importar el nuevo modal
import Room from '@/lib/models/room.model';
import { Card, Text, Badge, Group } from '@mantine/core';

interface UserData {
  id: string;
  isAdmin: boolean;
  authorized: boolean;
  isSuperUser: boolean;
}

export default function RoomManagementPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [roomsOporto, setRoomsOporto] = useState<typeof Room[]>([]);
  const [roomsNatural, setRoomsNatural] = useState<typeof Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomStateModalOpen, setIsRoomStateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
            if (!data.data.authorized) {
              router.push('/unauthorized');
            }
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchRoomsData = async () => {
    try {
      const resOporto = await fetch('/api/rooms?hotel=Oporto 83');
      const dataOporto = await resOporto.json();
      if (dataOporto.success) {
        setRoomsOporto(dataOporto.data);
      }

      const resNatural = await fetch('/api/rooms?hotel=Natural Sevgi');
      const dataNatural = await resNatural.json();
      if (dataNatural.success) {
        setRoomsNatural(dataNatural.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (user && user.authorized) {
      fetchRoomsData(); // Call the new function
    }
  }, [user]);

  if (loadingUser || loadingRooms) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!user || !user.authorized) {
    return null; // Should be redirected by router.push
  }

  const handleRoomCreated = () => {
    setIsModalOpen(false);
    fetchRoomsData(); // Re-fetch rooms after creation
  };

  const getCardColor = (state: string) => {
    switch (state) {
      case 'Disponible':
        return 'bg-[#E6F4EA] border-[#1E6C46]'; // Verde principal
      case 'Ocupada':
        return 'bg-red-100 border-red-500';
      case 'CheckOut':
        return 'bg-blue-100 border-blue-500'; // Tono naranja para CheckOut
      case 'Repaso':
        return  'bg-orange-100 border-orange-500';
      case 'Revisar':
        return 'bg-purple-100 border-purple-500'; // Tono púrpura para Revisar
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const handleCardClick = (room: any) => {
    setSelectedRoom(room);
    setIsRoomStateModalOpen(true);
  };

  const handleRoomStateUpdated = () => {
    setIsRoomStateModalOpen(false);
    fetchRoomsData(); // Re-fetch rooms after state update
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-verde-principal">Gestión de Habitaciones</h1>
      {user && user.isAdmin && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-verde-principal hover:bg-verde-oscuro text-white font-bold py-2 px-4 rounded mb-4"
        >
          Crear Habitación
        </button>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap -mx-2 gap-y-8 sm:gap-x-8">
        <div className="flex-1 px-2">
          <h2 className="text-3xl font-bold mb-4 text-verde-principal text-center">Oporto 83</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomsOporto.map((room: any) => (
              <Card
                key={room._id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                className={`${getCardColor(room.state)} cursor-pointer`}
                onClick={() => handleCardClick(room)}
              >
                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={500}>Habitación: {room.roomNumber}</Text>
                  <Badge color="verde-principal" variant="light">
                    {room.state}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                  Tipo: {room.roomType}
                </Text>
                <Text size="sm" c="dimmed">
                  Precio: ${room.price}
                </Text>
              </Card>
            ))}
          </div>
        </div>
        <div className="flex-1 px-2">
          <h2 className="text-3xl font-bold mb-4 text-verde-principal text-center">Natural Sevgi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomsNatural.map((room: any) => (
              <Card
                key={room._id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                className={`${getCardColor(room.state)} cursor-pointer`}
                onClick={() => handleCardClick(room)}
              >
                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={500}>Habitación: {room.roomNumber}</Text>
                  <Badge color="verde-principal" variant="light">
                    {room.state}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                  Tipo: {room.roomType}
                </Text>
                <Text size="sm" c="dimmed">
                  Precio: ${room.price}
                </Text>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />

      {selectedRoom && (
        <RoomStateModal
          isOpen={isRoomStateModalOpen}
          onClose={() => setIsRoomStateModalOpen(false)}
          room={selectedRoom}
          onStateUpdated={handleRoomStateUpdated}
        />
      )}
    </div>
  );
}
