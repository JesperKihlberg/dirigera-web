import React from "react";
import { useNavigate } from "react-router-dom";
import { RoomCardUI } from "../ui/RoomCardUI";
import { Scenes } from "@/features/scenes";
import { DeviceControl, BatteryIndicator } from "@/features/devices";
import { useRoomConfig } from "@/hooks";
import type { Room, Device } from "@/graphql.types";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();
  const { getRoomConfig } = useRoomConfig();
  const roomName = getRoomConfig(room.id)?.name ?? room.name;

  const handleNavigateToRoom = () => {
    navigate(`room/${room.id}`);
  };

  const renderScenes = <Scenes scope="room" scopeId={room.id} />;

  const renderDeviceControl = (device: Device) => (
    <DeviceControl device={device} />
  );

  const renderBatteryIcon = (device: Device) => (
    <BatteryIndicator
      batteryPercentage={device.batteryPercentage!}
      name={device.name}
    />
  );

  return (
    <RoomCardUI
      roomName={roomName}
      devices={room.devices}
      onNavigateToRoom={handleNavigateToRoom}
      renderScenes={renderScenes}
      renderDeviceControl={renderDeviceControl}
      renderBatteryIcon={renderBatteryIcon}
    />
  );
}
