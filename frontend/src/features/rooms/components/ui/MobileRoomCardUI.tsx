import React from "react";
import { Card } from "@/components/ui";
import { Switch } from "@/components/ui/Switch";
import { DeviceTile } from "@/features/devices/components/containers/DeviceTile";
import type { Device } from "@/graphql.types";
import "./MobileRoomCardUI.css";

interface MobileRoomCardUIProps {
  roomName: string;
  roomIcon?: React.ReactNode;
  devices: Device[];
  onToggleAllLamps?: (isOn: boolean) => void;
  toggleAllLampsLoading?: boolean;
}

export function MobileRoomCardUI({
  roomName,
  roomIcon,
  devices,
  onToggleAllLamps,
  toggleAllLampsLoading = false,
}: MobileRoomCardUIProps) {
  const toggleableDevices = devices.filter(
    (device) => device.isOn !== null && device.isOn !== undefined
  );

  const allLampsOn =
    toggleableDevices.length > 0 &&
    toggleableDevices.every((device) => device.isOn === true);

  const allReachable = toggleableDevices.every((device) => device.isReachable);

  return (
    <Card
      className="mobile-room-card"
      title={
        <span className="mobile-room-card-title">
          {roomIcon && (
            <span className="mobile-room-card-icon">{roomIcon}</span>
          )}
          <span className="mobile-room-card-name">{roomName}</span>
        </span>
      }
      extra={
        toggleableDevices.length > 0 && onToggleAllLamps ? (
          <Switch
            checked={allLampsOn}
            disabled={!allReachable || toggleAllLampsLoading}
            onChange={(checked) => onToggleAllLamps(checked)}
          />
        ) : null
      }
    >
      <div className="mobile-room-card-devices">
        {devices.map((device) => (
          <DeviceTile key={device.id} device={device} />
        ))}
      </div>
    </Card>
  );
}
