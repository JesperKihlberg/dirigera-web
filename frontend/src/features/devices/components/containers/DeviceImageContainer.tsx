import { DeviceImage } from "../ui/DeviceImage";
import {
  useLocalIsOn,
  useLocalLightLevel,
  useDeviceColor,
} from "../../hooks/useDeviceLocalState";
import { useSyncDeviceState } from "../../hooks/useSyncDeviceState";
import type { Device } from "@/graphql.types";
import { useDeviceImages } from "@/hooks";

export interface DeviceImageContainerProps {
  device: Device;
  imagePath?: string | undefined;
}

export function DeviceImageContainer({
  device,
  imagePath,
}: DeviceImageContainerProps) {
  const localIsOn = useLocalIsOn(device.id);
  const localLightLevel = useLocalLightLevel(device.id);
  const deviceColor = useDeviceColor(device.id);
  const { getDeviceImage } = useDeviceImages();

  const resolvedImagePath = imagePath ?? getDeviceImage(device.id);

  useSyncDeviceState(device);

  return (
    <DeviceImage
      imagePath={resolvedImagePath}
      name={device.name}
      isOn={localIsOn ?? !!device.isOn}
      isReachable={device.isReachable}
      {...(localLightLevel != null && { lightLevel: localLightLevel })}
      {...(deviceColor && { lightColor: deviceColor })}
    />
  );
}
