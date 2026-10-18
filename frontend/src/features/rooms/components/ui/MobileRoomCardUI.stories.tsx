import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { MdLiving, MdKitchen } from "react-icons/md";
import { MobileRoomCardUI } from "./MobileRoomCardUI";
import type { Device } from "@/graphql.types";

/**
 * MobileRoomCardUI is the dense room card on the #/mobile page: a small
 * header with a switch for all lights, and a grid of device tiles. Tap a tile
 * to toggle it; press and hold, then drag up/down for light level and
 * left/right for colour.
 */

const device = (id: number, overrides: Partial<Device>): Device => ({
  __typename: "Device",
  id: `device-${id}`,
  name: `Light ${id}`,
  type: "DEVICE",
  isReachable: true,
  batteryPercentage: null,
  isOn: true,
  lightLevel: 80,
  colorTemperature: 2700,
  colorHue: null,
  colorSaturation: null,
  ...overrides,
});

const livingRoomDevices: Device[] = [
  device(1, { name: "Ceiling Light" }),
  device(2, { name: "Sofa Lamp", lightLevel: 30 }),
  device(3, { name: "Colour Strip", colorHue: 320, colorSaturation: 1 }),
  device(4, { name: "Reading Lamp", isOn: false }),
  device(5, { name: "Window Light", isReachable: false, isOn: false }),
  device(6, { name: "TV Backlight", colorHue: 200, colorSaturation: 0.8 }),
  device(7, { name: "Shelf", lightLevel: 10 }),
  device(8, {
    name: "Outlet",
    lightLevel: null,
    colorTemperature: null,
  }),
  device(9, { name: "Floor Lamp with a long name", lightLevel: 55 }),
];

const meta = {
  component: MobileRoomCardUI,
  title: "Features/Rooms/UI/MobileRoomCardUI",
  tags: ["autodocs"],
  args: {
    onToggleAllLamps: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 8, boxSizing: "border-box" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileRoomCardUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    roomName: "Living Room",
    roomIcon: <MdLiving />,
    devices: livingRoomDevices,
  },
};

export const AllOn: Story = {
  args: {
    roomName: "Kitchen",
    roomIcon: <MdKitchen />,
    devices: [
      device(1, { name: "Ceiling" }),
      device(2, { name: "Counter", lightLevel: 100 }),
    ],
  },
};

export const ToggleLoading: Story = {
  args: {
    ...Default.args,
    toggleAllLampsLoading: true,
  },
};
