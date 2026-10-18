import { useRef, useState } from "react";
import {
  useDeviceLocalStateStore,
  useLocalIsOn,
  useLocalLightLevel,
  useLocalColorHue,
  useLocalColorSaturation,
  useLocalColorTemperature,
  useDeviceColor,
} from "../../hooks/useDeviceLocalState";
import { useSyncDeviceState } from "../../hooks/useSyncDeviceState";
import { useDeviceControl } from "../../hooks/useDeviceControl";
import { useHoldDrag, useThrottle } from "../../hooks/useHoldDrag";
import {
  MIN_TEMPERATURE,
  hueFromDrag,
  levelFromDrag,
  temperatureFromDrag,
  type DragAxis,
} from "../../utils/holdDrag";
import { DeviceTileUI } from "../ui/DeviceTileUI";
import type { Device } from "@/graphql.types";
import { useDeviceImages } from "@/hooks";

export interface DeviceTileProps {
  device: Device;
}

// Tap toggles; hold and drag up/down for light level, left/right for colour.
export function DeviceTile({ device }: DeviceTileProps) {
  useSyncDeviceState(device);
  const localIsOn = useLocalIsOn(device.id);
  const localLightLevel = useLocalLightLevel(device.id);
  const localHue = useLocalColorHue(device.id);
  const localSaturation = useLocalColorSaturation(device.id);
  const localTemperature = useLocalColorTemperature(device.id);
  const deviceColor = useDeviceColor(device.id);
  const { setDeviceLightLevel, setDeviceColorHue, setDeviceColorTemperature } =
    useDeviceLocalStateStore();
  const { getDeviceImage } = useDeviceImages();
  const {
    handleIsOnChange,
    handleLightLevelChange,
    handleColorHueSaturationChange,
    handleColorTemperatureChange,
  } = useDeviceControl({ id: device.id, type: device.type });
  const throttle = useThrottle(200);
  const [overlay, setOverlay] = useState<string | null>(null);
  const start = useRef({ level: 1, hue: 0, temperature: MIN_TEMPERATURE });
  const turnedOn = useRef(false);

  const isOn = localIsOn ?? !!device.isOn;
  const lightLevel = localLightLevel ?? device.lightLevel ?? undefined;
  // Colour lights in white mode report saturation 0; hue alone would show nothing.
  const saturation = localSaturation || device.colorSaturation || 1;

  const apply = (axis: DragAxis, offset: number, final: boolean) => {
    const send = final ? (fn: () => void) => fn() : throttle;

    if (axis === "vertical") {
      if (device.lightLevel == null) return;
      if (!isOn && !turnedOn.current) {
        turnedOn.current = true;
        void handleIsOnChange(true);
      }
      const level = levelFromDrag(start.current.level, offset);
      setDeviceLightLevel(device.id, level);
      setOverlay(`${level} %`);
      send(() => void handleLightLevelChange(level));
    } else if (device.colorHue != null) {
      const hue = hueFromDrag(start.current.hue, offset);
      setDeviceColorHue(device.id, hue);
      setOverlay(`${hue}°`);
      send(() => void handleColorHueSaturationChange(hue, saturation));
    } else if (device.colorTemperature != null) {
      const temperature = temperatureFromDrag(
        start.current.temperature,
        offset
      );
      setDeviceColorTemperature(device.id, temperature);
      setOverlay(`${temperature} K`);
      send(() => void handleColorTemperatureChange(temperature));
    }
  };

  const { ref, holding, handlers } = useHoldDrag<HTMLDivElement>({
    disabled: !device.isReachable,
    onTap: () => void handleIsOnChange(!isOn),
    onHold: () => {
      turnedOn.current = false;
      start.current = {
        level: lightLevel ?? 1,
        hue: localHue ?? device.colorHue ?? 0,
        temperature:
          localTemperature ?? device.colorTemperature ?? MIN_TEMPERATURE,
      };
    },
    onDrag: (axis, offset) => apply(axis, offset, false),
    onDragEnd: (axis, offset) => {
      apply(axis, offset, true);
      setOverlay(null);
    },
  });

  return (
    <DeviceTileUI
      ref={ref}
      {...handlers}
      name={device.name}
      imagePath={getDeviceImage(device.id)}
      isOn={isOn}
      isReachable={device.isReachable}
      {...(lightLevel != null && { lightLevel })}
      {...(deviceColor && { lightColor: deviceColor })}
      holding={holding}
      overlay={overlay}
    />
  );
}
