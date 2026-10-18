import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { SET_IS_ON_MUTATION } from "@/features/devices/api/devicesApi";
import type { Device, ControlType } from "@/graphql.types";
import type {
  SetIsOnMutation,
  SetIsOnMutationVariables,
} from "@/components/deviceControls/IsOn.types.gen";

export function useToggleRoomLights(devices: Device[]) {
  const [toggleLoading, setToggleLoading] = useState(false);

  const [setIsOn] = useMutation<SetIsOnMutation, SetIsOnMutationVariables>(
    SET_IS_ON_MUTATION
  );

  // Get toggleable devices (have isOn property)
  const toggleableDevices = useMemo(
    () =>
      devices.filter(
        (device) =>
          device.isOn !== null &&
          device.isOn !== undefined &&
          (device.batteryPercentage === null ||
            device.batteryPercentage === undefined)
      ),
    [devices]
  );

  const handleToggleAllLamps = useCallback(
    async (isOn: boolean) => {
      setToggleLoading(true);
      try {
        await Promise.all(
          toggleableDevices
            .filter((device) => device.isReachable)
            .map((device) =>
              setIsOn({
                variables: {
                  id: device.id,
                  type: device.type as ControlType,
                  isOn,
                },
              })
            )
        );
      } finally {
        setToggleLoading(false);
      }
    },
    [toggleableDevices, setIsOn]
  );

  return { handleToggleAllLamps, toggleLoading };
}
