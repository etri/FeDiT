import { Component, type ReactNode } from "react";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
export class GraphicsBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
export function GraphicsLifecycle({
  onLost,
  onRestored,
}: {
  onLost: (error: Error) => void;
  onRestored: () => void;
}) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onLost(
        new Error(
          "Graphics context lost. Retry rendering or select a smaller ROI.",
        ),
      );
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl, onLost, onRestored]);
  return null;
}
