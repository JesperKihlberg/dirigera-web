import { describe, it, expect } from "vitest";
import {
  classifyPress,
  lockAxis,
  levelFromDrag,
  hueFromDrag,
  temperatureFromDrag,
} from "./holdDrag";

describe("classifyPress", () => {
  it("is pending while the finger is still and the hold time has not passed", () => {
    expect(classifyPress(100, 2, 3)).toBe("pending");
  });

  it("is a scroll when the finger moves past the slop before the hold", () => {
    expect(classifyPress(200, 0, 12)).toBe("scroll");
  });

  it("is a hold once the hold time has passed", () => {
    expect(classifyPress(400, 0, 0)).toBe("hold");
    expect(classifyPress(500, 30, 0)).toBe("hold");
  });
});

describe("lockAxis", () => {
  it("does not lock before 10 px", () => {
    expect(lockAxis(6, -7)).toBeNull();
  });

  it("locks to the dominant axis", () => {
    expect(lockAxis(3, -12)).toBe("vertical");
    expect(lockAxis(-15, 4)).toBe("horizontal");
  });
});

describe("levelFromDrag", () => {
  it("raises the level when dragging up, 150 px = 100 %", () => {
    expect(levelFromDrag(20, -75)).toBe(70);
  });

  it("clamps to 1–100", () => {
    expect(levelFromDrag(50, -500)).toBe(100);
    expect(levelFromDrag(50, 500)).toBe(1);
  });
});

describe("hueFromDrag", () => {
  it("maps 250 px to a full turn", () => {
    expect(hueFromDrag(0, 125)).toBe(180);
  });

  it("wraps around in both directions", () => {
    expect(hueFromDrag(300, 125)).toBe(120);
    expect(hueFromDrag(10, -25)).toBe(334);
  });
});

describe("temperatureFromDrag", () => {
  it("maps 250 px to the full range", () => {
    expect(temperatureFromDrag(2202, 125)).toBe(3101);
  });

  it("clamps to 2202–4000", () => {
    expect(temperatureFromDrag(3000, 1000)).toBe(4000);
    expect(temperatureFromDrag(3000, -1000)).toBe(2202);
  });
});
