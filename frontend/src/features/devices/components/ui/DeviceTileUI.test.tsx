import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeviceTileUI } from "./DeviceTileUI";

describe("DeviceTileUI", () => {
  it("shows the device name", () => {
    render(<DeviceTileUI name="Ceiling Light" isOn isReachable />);
    expect(screen.getByText("Ceiling Light")).toBeInTheDocument();
  });

  it("shows the value overlay only while dragging", () => {
    const { rerender } = render(
      <DeviceTileUI name="Lamp" isOn isReachable lightLevel={62} />
    );
    expect(screen.queryByText("62 %")).not.toBeInTheDocument();

    rerender(
      <DeviceTileUI
        name="Lamp"
        isOn
        isReachable
        lightLevel={62}
        holding
        overlay="62 %"
      />
    );
    expect(screen.getByText("62 %")).toBeInTheDocument();
  });

  it("marks an unreachable device", () => {
    const { container } = render(
      <DeviceTileUI name="Garden" isOn={false} isReachable={false} />
    );
    expect(container.querySelector(".device-tile-unreachable")).not.toBeNull();
    expect(
      container.querySelector(".device-unreachable-overlay")
    ).not.toBeNull();
  });
});
