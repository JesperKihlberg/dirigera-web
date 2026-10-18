import type { Meta, StoryObj } from "@storybook/react";
import { DeviceTileUI } from "./DeviceTileUI";

const meta = {
  component: DeviceTileUI,
  title: "Features/Devices/UI/DeviceTileUI",
  tags: ["autodocs"],
  argTypes: {
    name: { control: "text" },
    isOn: { control: "boolean" },
    isReachable: { control: "boolean" },
    lightLevel: { control: { type: "range", min: 0, max: 100, step: 1 } },
    lightColor: { control: "color" },
    holding: { control: "boolean" },
    overlay: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 72 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DeviceTileUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: {
    name: "Ceiling Light",
    isOn: false,
    isReachable: true,
    lightLevel: 60,
  },
};

export const On: Story = {
  args: {
    name: "Ceiling Light",
    isOn: true,
    isReachable: true,
    lightLevel: 100,
    lightColor: "#ffd27f",
  },
};

export const DimmedColour: Story = {
  args: {
    imagePath: "https://picsum.photos/id/199/80/80",
    name: "Sofa lamp with a long name",
    isOn: true,
    isReachable: true,
    lightLevel: 30,
    lightColor: "#ff4fa0",
  },
};

export const Unreachable: Story = {
  args: {
    name: "Garden Light",
    isOn: false,
    isReachable: false,
  },
};

export const Dragging: Story = {
  args: {
    name: "Ceiling Light",
    isOn: true,
    isReachable: true,
    lightLevel: 62,
    lightColor: "#ffd27f",
    holding: true,
    overlay: "62 %",
  },
};
