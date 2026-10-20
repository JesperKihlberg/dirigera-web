import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TabletPage } from "./TabletPage";
import type { Device, Room } from "@/graphql.types";

const device = (id: string, overrides: Partial<Device> = {}): Device => ({
  __typename: "Device",
  id,
  name: id,
  type: "DEVICE",
  isReachable: true,
  batteryPercentage: null,
  isOn: true,
  lightLevel: 80,
  colorHue: null,
  colorSaturation: null,
  colorTemperature: 2700,
  ...overrides,
});

const room = (id: string, devices: Device[]): Room =>
  ({ __typename: "Room", id, name: id, devices, quickControls: [] }) as Room;

const rooms: Room[] = [
  room("Kitchen", [device("Kitchen ceiling")]),
  room("Bedroom", [
    device("Bedside"),
    device("Remote", { batteryPercentage: 80 }),
  ]),
  room("Garage", [device("Garage light")]),
  room("Hall", [device("Hall sensor", { batteryPercentage: 50 })]),
];

vi.mock("@/features/rooms", () => ({
  useRooms: () => ({ rooms, loading: false, error: undefined }),
}));
vi.mock("@/features/scenes", () => ({
  useScenes: () => ({
    scenes: [
      { id: "s1", name: "Dinner" },
      { id: "s2", name: "Night" },
    ],
  }),
  useActivateScene: () => ({ activateScene: vi.fn(), activeSceneId: null }),
}));
vi.mock("@/features/rooms/hooks/useToggleRoomLights", () => ({
  useToggleRoomLights: () => ({
    handleToggleAllLamps: vi.fn(),
    toggleLoading: false,
  }),
}));
vi.mock("@/features/devices/components/containers/DeviceTile", () => ({
  DeviceTile: ({ device }: { device: Device }) => <div>{device.name}</div>,
}));
vi.mock("@/lib/adminApi", () => ({
  adminFetch: async (path: string) => {
    if (path === "/floors") {
      return {
        floors: [
          {
            id: "f0",
            name: "Ground floor",
            order: 0,
            rooms: ["Kitchen", "Hall"],
          },
          { id: "f1", name: "First floor", order: 1, rooms: ["Bedroom"] },
        ],
      };
    }
    if (path === "/scene-scopes") {
      return { house: [], floors: {}, rooms: { Kitchen: ["s1"] } };
    }
    return { rooms: {} };
  },
}));

describe("TabletPage", () => {
  it("shows the floors in floor order with unassigned rooms last", async () => {
    render(<TabletPage />);
    await screen.findByText("Ground floor");

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "First floor",
      "Ground floor",
      "Other",
    ]);
    const other = headings[2].closest("section") as HTMLElement;
    expect(within(other).getByText("Garage")).toBeInTheDocument();
  });

  it("shows each room's own scenes", async () => {
    render(<TabletPage />);
    expect(
      await screen.findByRole("button", { name: "Dinner" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Night" })).toBeNull();
  });

  it("hides battery devices and rooms with only battery devices", async () => {
    render(<TabletPage />);
    await screen.findByText("Ground floor");

    expect(screen.getByText("Bedside")).toBeInTheDocument();
    expect(screen.queryByText("Remote")).toBeNull();
    expect(screen.queryByText("Hall")).toBeNull();
  });

  it("does not use .floor-section, so scroll-snap stays off", async () => {
    const { container } = render(<TabletPage />);
    await screen.findByText("Ground floor");

    expect(container.querySelector(".floor-section")).toBeNull();
  });
});
