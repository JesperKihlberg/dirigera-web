import React from "react";
import { Card } from "@/components/ui";
import { Switch } from "@/components/ui/Switch";
import { DeviceTile } from "@/features/devices/components/containers/DeviceTile";
import { SceneButton } from "@/features/scenes/components/ui/SceneButton";
import type { Device } from "@/graphql.types";
import "./MobileRoomCardUI.css";

interface MobileRoomCardUIProps {
  roomName: string;
  roomIcon?: React.ReactNode;
  devices: Device[];
  onToggleAllLamps?: (isOn: boolean) => void;
  toggleAllLampsLoading?: boolean;
  scenes?: Array<{ id: string; name: string }> | undefined;
  onActivateScene?: ((sceneId: string) => void) | undefined;
  activeSceneId?: string | null | undefined;
}

export function MobileRoomCardUI({
  roomName,
  roomIcon,
  devices,
  onToggleAllLamps,
  toggleAllLampsLoading = false,
  scenes = [],
  onActivateScene,
  activeSceneId,
}: MobileRoomCardUIProps) {
  const toggleableDevices = devices.filter(
    (device) => device.isOn !== null && device.isOn !== undefined
  );

  const allLampsOn =
    toggleableDevices.length > 0 &&
    toggleableDevices.every((device) => device.isOn === true);

  const allReachable = toggleableDevices.every((device) => device.isReachable);

  // One grid column per light on the mobile page; 4+ lights take a full row
  const gridColumn =
    devices.length >= 4 ? "1 / -1" : `span ${Math.max(devices.length, 1)}`;

  return (
    <Card
      className="mobile-room-card"
      style={{ gridColumn }}
      title={
        <span className="mobile-room-card-title">
          {roomIcon && (
            <span className="mobile-room-card-icon">{roomIcon}</span>
          )}
          <span className="mobile-room-card-name">{roomName}</span>
        </span>
      }
      extra={
        // A single light is toggled by tapping its tile
        toggleableDevices.length > 1 && onToggleAllLamps ? (
          <Switch
            checked={allLampsOn}
            disabled={!allReachable || toggleAllLampsLoading}
            onChange={(checked) => onToggleAllLamps(checked)}
          />
        ) : null
      }
    >
      {scenes.length > 0 && onActivateScene && (
        <div className="mobile-room-card-scenes">
          {scenes.map((scene) => (
            <SceneButton
              key={scene.id}
              name={scene.name}
              onClick={() => onActivateScene(scene.id)}
              loading={activeSceneId === scene.id}
            />
          ))}
        </div>
      )}
      <div className="mobile-room-card-devices">
        {devices.map((device) => (
          <DeviceTile key={device.id} device={device} />
        ))}
      </div>
    </Card>
  );
}
