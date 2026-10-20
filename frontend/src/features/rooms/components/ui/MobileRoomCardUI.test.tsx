import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MobileRoomCardUI } from "./MobileRoomCardUI";
import type { Device } from "@/graphql.types";

vi.mock("@/features/devices/components/containers/DeviceTile", () => ({
  DeviceTile: ({ device }: { device: Device }) => <div>{device.name}</div>,
}));

const devices: Device[] = [
  {
    __typename: "Device",
    id: "d1",
    name: "Ceiling",
    type: "DEVICE",
    isReachable: true,
    batteryPercentage: null,
    isOn: true,
    lightLevel: 80,
    colorHue: null,
    colorSaturation: null,
    colorTemperature: 2700,
  },
];

const scenes = [
  { id: "s1", name: "Evening" },
  { id: "s2", name: "Movie" },
];

describe("MobileRoomCardUI", () => {
  it("renders the room's scenes above the tiles", () => {
    render(
      <MobileRoomCardUI
        roomName="Living Room"
        devices={devices}
        scenes={scenes}
        onActivateScene={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Evening" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Movie" })).toBeInTheDocument();
    expect(screen.getByText("Ceiling")).toBeInTheDocument();
  });

  it("activates a scene when it is tapped", async () => {
    const user = userEvent.setup();
    const onActivateScene = vi.fn();
    render(
      <MobileRoomCardUI
        roomName="Living Room"
        devices={devices}
        scenes={scenes}
        onActivateScene={onActivateScene}
      />
    );

    await user.click(screen.getByRole("button", { name: "Movie" }));

    expect(onActivateScene).toHaveBeenCalledWith("s2");
  });

  it("renders no scene row without scenes", () => {
    const { container } = render(
      <MobileRoomCardUI roomName="Living Room" devices={devices} />
    );
    expect(container.querySelector(".mobile-room-card-scenes")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
