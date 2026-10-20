import { AlertCircle, LoaderCircle, Layers3 } from "lucide-react";
import type { ReactNode } from "react";
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Layers3 size={30} strokeWidth={1.3} />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Failure({ error }: { error: unknown }) {
  return (
    <div className="failure" role="alert">
      <AlertCircle size={16} />
      <span>{error instanceof Error ? error.message : "Request failed"}</span>
    </div>
  );
}
export function Loading({
  children = "불러오는 중",
}: {
  children?: ReactNode;
}) {
  return (
    <span className="loading" role="status">
      <LoaderCircle size={15} className="spin" />
      {children}
    </span>
  );
}
