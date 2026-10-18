import { describe, it, expect } from "vitest";
import { calculateDeviceColor } from "./deviceColor";

const hex = /^#[0-9a-f]{6}$/;

describe("calculateDeviceColor", () => {
  it("returns warm orange at 2202 K and blue at 4000 K", () => {
    expect(calculateDeviceColor(undefined, undefined, 2202)).toBe("#ffa500");
    expect(calculateDeviceColor(undefined, undefined, 4000)).toBe("#87ceff");
  });

  it("clamps temperatures outside 2202–4000 K to a valid colour", () => {
    // Some IKEA bulbs report 2183 K
    expect(calculateDeviceColor(undefined, undefined, 2183)).toBe("#ffa500");
    expect(calculateDeviceColor(undefined, undefined, 4500)).toBe("#87ceff");
  });

  it("returns a valid hex colour across the range", () => {
    for (let k = 2100; k <= 4100; k += 50) {
      expect(calculateDeviceColor(undefined, undefined, k)).toMatch(hex);
    }
  });
});
