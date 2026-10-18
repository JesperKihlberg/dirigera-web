import { useMemo } from "react";
import { MobileRoomCardUI } from "../ui/MobileRoomCardUI";
import { useRoomConfig } from "@/hooks";
import { useToggleRoomLights } from "../../hooks/useToggleRoomLights";
import type { Room } from "@/graphql.types";

interface MobileRoomCardProps {
  room: Room;
}

// Battery devices (remotes, sensors) are hidden on the mobile page.
export const visibleDevices = (room: Room) =>
  room.devices.filter(
    (device) =>
      device.batteryPercentage === null ||
      device.batteryPercentage === undefined
  );

export function MobileRoomCard({ room }: MobileRoomCardProps) {
  const { getRoomIcon, getRoomConfig } = useRoomConfig();
  const devices = useMemo(() => visibleDevices(room), [room]);
  const { handleToggleAllLamps, toggleLoading } = useToggleRoomLights(devices);

  return (
    <MobileRoomCardUI
      roomName={getRoomConfig(room.id)?.name ?? room.name}
      roomIcon={getRoomIcon(room.id)}
      devices={devices}
      onToggleAllLamps={handleToggleAllLamps}
      toggleAllLampsLoading={toggleLoading}
    />
  );
}
