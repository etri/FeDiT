import type { ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { ViewCompass } from "./ViewCompass";

let frame: (() => void) | undefined;
const camera = new PerspectiveCamera();
vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: () => void) => {
    frame = callback;
  },
  useThree: () => ({ camera, size: { width: 800, height: 600 } }),
}));
vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function look(x: number, y: number, z: number) {
  camera.quaternion.setFromUnitVectors(
    new Vector3(0, 0, -1),
    new Vector3(x, y, z).normalize(),
  );
  camera.updateMatrixWorld();
}
beforeEach(() => {
  frame = undefined;
  look(0, 1, 0);
});
afterEach(cleanup);

describe("camera view compass", () => {
  it.each([
    [0, 1, 0, "북"],
    [1, 0, 90, "동"],
    [0, -1, 180, "남"],
    [-1, 0, 270, "서"],
  ])(
    "maps camera direction (%s, %s) to clockwise heading %s",
    (x, y, degrees, name) => {
      look(Number(x), Number(y), 0);
      const { container } = render(<ViewCompass />);
      expect(screen.getByRole("img")).toHaveAccessibleName(
        `시점 방향 ${name} ${degrees}도`,
      );
      expect(container.querySelector("[data-view-arrow]")).not.toHaveAttribute(
        "transform",
      );
      expect(container.querySelector("[data-view-dial]")).toHaveAttribute(
        "transform",
        `rotate(${-Number(degrees)} 40 40)`,
      );
      expect(container.querySelector('[data-cardinal="N"]')).toHaveAttribute(
        "transform",
        `rotate(${degrees} 40 9)`,
      );
      expect(container.querySelectorAll("[data-view-tick]")).toHaveLength(16);
      expect(container.querySelector('[data-cardinal="N"]')).toHaveAttribute(
        "y",
        "9",
      );
      expect(container.querySelector('[data-cardinal="E"]')).toHaveAttribute(
        "x",
        "71",
      );
    },
  );
  it("shows the horizontal diagonal regardless of camera pitch", () => {
    look(1, 1, -2);
    render(<ViewCompass />);
    expect(screen.getByRole("img")).toHaveAccessibleName("시점 방향 북동 45도");
  });
  it("updates the heading after the user orbits the camera", () => {
    const { container } = render(<ViewCompass />);
    act(() => {
      look(-1, -1, -1);
      frame?.();
    });
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "시점 방향 남서 225도",
    );
    expect(container.querySelector("[data-view-arrow]")).not.toHaveAttribute(
      "transform",
    );
    expect(container.querySelector("[data-view-dial]")).toHaveAttribute(
      "transform",
      "rotate(-225 40 40)",
    );
    expect(container.querySelector('[data-cardinal="E"]')).toHaveAttribute(
      "transform",
      "rotate(225 71 40)",
    );
  });
  it.each([
    [-1, "수직 아래"],
    [1, "수직 위"],
  ])("does not invent a heading when looking vertically %s", (z, label) => {
    const { container } = render(<ViewCompass />);
    act(() => {
      look(0, 0, Number(z));
      frame?.();
    });
    expect(screen.getByRole("img")).toHaveAccessibleName(`시점 방향 ${label}`);
    expect(container.querySelector("[data-view-arrow]")).toHaveAttribute(
      "opacity",
      "0",
    );
    expect(container.querySelector("[data-view-arrow]")).not.toHaveAttribute(
      "transform",
    );
    expect(container.querySelector("[data-view-dial]")).not.toHaveAttribute(
      "transform",
    );
    expect(container.querySelector("[data-view-dial]")).toHaveAttribute(
      "opacity",
      "0.4",
    );
    expect(screen.queryByText(/0°/)).not.toBeInTheDocument();
    act(() => {
      look(0, 1, -1);
      frame?.();
    });
    expect(screen.getByRole("img")).toHaveAccessibleName("시점 방향 북 0도");
    expect(container.querySelector("[data-view-arrow]")).toHaveAttribute(
      "opacity",
      "1",
    );
    expect(container.querySelector("[data-view-dial]")).toHaveAttribute(
      "transform",
      "rotate(0 40 40)",
    );
    expect(container.querySelector("[data-view-dial]")).toHaveAttribute(
      "opacity",
      "1",
    );
  });
});
