import {
  useLocalIsOn,
  useLocalLightLevel,
  useDeviceColor,
} from "@/features/devices/hooks/useDeviceLocalState";
import { useSyncDeviceState } from "../../hooks/useSyncDeviceState";
import type { Device } from "@/graphql.types";
import { useDeviceImages } from "@/hooks";
import { CompactDeviceControlUI } from "../ui/CompactDeviceControlUI";
import { Switch } from "@/components/ui/Switch";
import { useDeviceControl } from "../../hooks/useDeviceControl";

export interface CompactDeviceControlProps {
  device: Device;
}

export function CompactDeviceControl({ device }: CompactDeviceControlProps) {
  const localIsOn = useLocalIsOn(device.id);
  const localLightLevel = useLocalLightLevel(device.id);
  const deviceColor = useDeviceColor(device.id);
  const { getDeviceImage } = useDeviceImages();

  const imagePath = getDeviceImage(device.id);
  const {
    handleIsOnChange,
    handleLightLevelChange,
    handleVolumeChange,
    loading,
  } = useDeviceControl({
    id: device.id,
    type: device.type,
  });
  useSyncDeviceState(device);

  const isOn = localIsOn ?? !!device.isOn;
  const lightLevel = localLightLevel ?? device.lightLevel ?? 0;
  const lightColor = deviceColor ?? "#ffffff";
  const shouldShowGlow = !!(
    lightColor &&
    lightLevel &&
    isOn &&
    device.isReachable
  );

  const onToggle = (checked: boolean) => {
    handleIsOnChange(checked);
  };

  const switchColor = isOn && device.isReachable ? lightColor : undefined;

  const onOffControl = (
    <Switch
      checked={isOn}
      onChange={onToggle}
      disabled={!device.isReachable}
      color={switchColor}
    />
  );

  return (
    <CompactDeviceControlUI
      name={device.name}
      imagePath={imagePath}
      isOn={isOn}
      isReachable={device.isReachable}
      lightLevel={lightLevel}
      lightColor={lightColor}
      showGlow={shouldShowGlow}
      onOffControl={onOffControl}
    />
  );
}
