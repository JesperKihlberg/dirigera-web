import type { Meta, StoryObj } from "@storybook/react";
import { FloorPlanUI } from "./FloorPlanUI";

/**
 * FloorPlanUI is a pure presentational component that wraps the FloorPlanRenderer.
 * It displays a floor plan based on the provided configuration and scale.
 */

const meta = {
  component: FloorPlanUI,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FloorPlanUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    imgSrc: "/floor-plan-1.svg",
  },
};

export const WithClassName: Story = {
  args: {
    imgSrc: "/floor-plan-1.svg",
    className: "custom-floor-plan",
  },
};

export const Collapsed: Story = {
  args: {
    imgSrc: "/floor-plan-2.svg",
    defaultCollapsed: true,
  },
};

export const SecondFloor: Story = {
  args: {
    imgSrc: "/floor-plan-2.svg",
  },
};
