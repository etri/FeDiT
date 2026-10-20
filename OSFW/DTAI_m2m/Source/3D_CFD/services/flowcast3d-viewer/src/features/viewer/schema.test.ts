import { describe, expect, it } from "vitest";
import { sceneSchema } from "./schema";
const geometry = {
  contextKey: "static-city",
  origin: [1000, 2000, 0],
  bounds: [
    [1001, 2002, 0],
    [1003, 2006, 3],
  ],
  assets: [
    { kind: "tiles", format: "3d-tiles", url: "/app-api/assets/city.json" },
  ],
  warnings: [],
};
describe("static geometry scene contract", () => {
  it("accepts the actual static city payload without a field timestamp", () => {
    const result = sceneSchema.parse(geometry);
    expect(result.assets[0].kind).toBe("tiles");
    expect(result.time).toBeUndefined();
    expect(result.origin).toEqual([1000, 2000, 0]);
  });
  it("requires actual time for numeric field scenes", () => {
    expect(() =>
      sceneSchema.parse({
        ...geometry,
        field: { id: "concentration", unit: "ug/m3" },
      }),
    ).toThrow("source time");
  });
});
