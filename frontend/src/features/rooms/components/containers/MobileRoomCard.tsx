import { useMemo } from "react";
import { MobileRoomCardUI } from "../ui/MobileRoomCardUI";
import { useRoomConfig } from "@/hooks";
import { useToggleRoomLights } from "../../hooks/useToggleRoomLights";
import type { Room } from "@/graphql.types";

interface MobileRoomCardProps {
  room: Room;
  scenes?: Array<{ id: string; name: string }> | undefined;
  onActivateScene?: ((sceneId: string) => void) | undefined;
  activeSceneId?: string | null | undefined;
}

// Battery devices (remotes, sensors) are hidden on the mobile page.
export const visibleDevices = (room: Room) =>
  room.devices.filter(
    (device) =>
      device.batteryPercentage === null ||
      device.batteryPercentage === undefined
  );

export function MobileRoomCard({
  room,
  scenes,
  onActivateScene,
  activeSceneId,
}: MobileRoomCardProps) {
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
      scenes={scenes}
      onActivateScene={onActivateScene}
      activeSceneId={activeSceneId}
    />
  );
}
