import { useEffect } from "react";
import {
  useDeviceLocalStateStore,
  type DeviceLocalState,
} from "./useDeviceLocalState";
import type { Device } from "@/graphql.types";

// Sync server state to local state
export function useSyncDeviceState(device: Device) {
  const { syncDeviceState } = useDeviceLocalStateStore();

  useEffect(() => {
    const stateUpdate: Partial<DeviceLocalState> = {};
    if (device.isOn != null) stateUpdate.isOn = device.isOn;
    if (device.lightLevel != null) stateUpdate.lightLevel = device.lightLevel;
    if (device.colorHue != null) stateUpdate.colorHue = device.colorHue;
    if (device.colorSaturation != null)
      stateUpdate.colorSaturation = device.colorSaturation;
    if (device.colorTemperature != null)
      stateUpdate.colorTemperature = device.colorTemperature;

    if (Object.keys(stateUpdate).length > 0) {
      syncDeviceState(device.id, stateUpdate);
    }
  }, [
    device.id,
    device.isOn,
    device.lightLevel,
    device.colorHue,
    device.colorSaturation,
    device.colorTemperature,
    syncDeviceState,
  ]);
}
