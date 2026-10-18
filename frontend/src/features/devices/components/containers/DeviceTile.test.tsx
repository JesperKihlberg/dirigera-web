import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DeviceTile } from "./DeviceTile";
import { useDeviceLocalStateStore } from "../../hooks/useDeviceLocalState";
import type { Device } from "@/graphql.types";

const control = {
  handleIsOnChange: vi.fn(),
  handleLightLevelChange: vi.fn(),
  handleColorHueSaturationChange: vi.fn(),
  handleColorTemperatureChange: vi.fn(),
};
vi.mock("../../hooks/useDeviceControl", () => ({
  useDeviceControl: () => control,
}));
vi.mock("@/hooks", () => ({
  useDeviceImages: () => ({ getDeviceImage: () => undefined }),
}));

const light = (overrides: Partial<Device>): Device => ({
  __typename: "Device",
  id: "d1",
  name: "Lamp",
  type: "DEVICE",
  isReachable: true,
  batteryPercentage: null,
  isOn: true,
  lightLevel: 50,
  colorHue: null,
  colorSaturation: null,
  colorTemperature: null,
  ...overrides,
});

const pointer = (x: number, y: number) => ({
  pointerId: 1,
  clientX: x,
  clientY: y,
});

function holdAndDrag(dx: number, dy: number) {
  const tile = screen.getByTitle("Lamp");
  fireEvent.pointerDown(tile, pointer(100, 100));
  act(() => vi.advanceTimersByTime(400));
  fireEvent.pointerMove(tile, pointer(100 + dx, 100 + dy));
  fireEvent.pointerUp(tile, pointer(100 + dx, 100 + dy));
}

describe("DeviceTile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(control).forEach((fn) => fn.mockReset());
    useDeviceLocalStateStore.setState({ deviceStates: {} });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("toggles on tap", () => {
    render(<DeviceTile device={light({ isOn: true })} />);
    const tile = screen.getByTitle("Lamp");
    fireEvent.pointerDown(tile, pointer(10, 10));
    fireEvent.pointerUp(tile, pointer(10, 10));
    expect(control.handleIsOnChange).toHaveBeenCalledWith(false);
  });

  it("sets the light level on a vertical drag and turns an off light on", () => {
    render(<DeviceTile device={light({ isOn: false, lightLevel: 20 })} />);
    holdAndDrag(0, -75);
    expect(control.handleIsOnChange).toHaveBeenCalledWith(true);
    expect(control.handleLightLevelChange).toHaveBeenLastCalledWith(70);
  });

  it("changes hue on a colour light, keeping saturation", () => {
    render(
      <DeviceTile
        device={light({
          colorHue: 0,
          colorSaturation: 0.5,
          colorTemperature: 3000,
        })}
      />
    );
    holdAndDrag(125, 0);
    expect(control.handleColorHueSaturationChange).toHaveBeenLastCalledWith(
      180,
      0.5
    );
    expect(control.handleColorTemperatureChange).not.toHaveBeenCalled();
  });

  it("changes colour temperature on a white-spectrum light", () => {
    render(<DeviceTile device={light({ colorTemperature: 2202 })} />);
    holdAndDrag(125, 0);
    expect(control.handleColorTemperatureChange).toHaveBeenLastCalledWith(3101);
  });

  it("ignores drags a device can't do", () => {
    render(<DeviceTile device={light({ lightLevel: null })} />);
    holdAndDrag(0, -75);
    holdAndDrag(125, 0);
    expect(control.handleLightLevelChange).not.toHaveBeenCalled();
    expect(control.handleColorHueSaturationChange).not.toHaveBeenCalled();
    expect(control.handleColorTemperatureChange).not.toHaveBeenCalled();
  });

  it("throttles sends while dragging and sends the final value on release", () => {
    render(<DeviceTile device={light({ lightLevel: 10 })} />);
    const tile = screen.getByTitle("Lamp");
    fireEvent.pointerDown(tile, pointer(100, 100));
    act(() => vi.advanceTimersByTime(400));
    fireEvent.pointerMove(tile, pointer(100, 85));
    fireEvent.pointerMove(tile, pointer(100, 70));
    fireEvent.pointerMove(tile, pointer(100, 55));
    expect(control.handleLightLevelChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText("40 %")).toBeInTheDocument();
    fireEvent.pointerUp(tile, pointer(100, 55));
    expect(control.handleLightLevelChange).toHaveBeenLastCalledWith(40);
    expect(screen.queryByText("40 %")).not.toBeInTheDocument();
  });

  it("ignores gestures when unreachable", () => {
    render(<DeviceTile device={light({ isReachable: false })} />);
    const tile = screen.getByTitle("Lamp");
    fireEvent.pointerDown(tile, pointer(10, 10));
    fireEvent.pointerUp(tile, pointer(10, 10));
    holdAndDrag(0, -75);
    expect(control.handleIsOnChange).not.toHaveBeenCalled();
    expect(control.handleLightLevelChange).not.toHaveBeenCalled();
  });
});
