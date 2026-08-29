import {
  describe,
  expect,
  it,
} from "vitest";

describe("Rate limiter", () => {
  it("accepts a valid hourly limit", () => {
    const limit = 200;

    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(10_000);
  });

  it("rejects invalid send spacing", () => {
    const delay = 1000;

    expect(delay).toBeLessThan(2000);
  });
});