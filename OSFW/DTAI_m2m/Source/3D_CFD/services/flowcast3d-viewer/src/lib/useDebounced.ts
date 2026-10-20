import { useEffect, useRef, useState } from "react";
export function useDebounced<T>(value: T, delay = 180) {
  const source = useRef(value),
    key = JSON.stringify(value);
  source.current = value;
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setCurrent(source.current), delay);
    return () => clearTimeout(timeout);
  }, [key, delay]);
  return current;
}
