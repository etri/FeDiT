import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import "./SceneExportMenu.css";

type ExportFormat = "png" | "gif" | "mp4";

interface Props {
  disabled: boolean;
  animated: boolean;
  busy?: { format: ExportFormat; progress: number };
  error?: string;
  onExport: (format: ExportFormat) => void;
  onCancel: () => void;
}

const formats: { format: ExportFormat; title: string; detail: string }[] = [
  { format: "png", title: "PNG 이미지", detail: "현재 장면" },
  { format: "gif", title: "GIF 애니메이션", detail: "전체 예측 구간" },
  { format: "mp4", title: "MP4 동영상", detail: "전체 예측 구간" },
];

export function SceneExportMenu({
  disabled,
  animated,
  busy,
  error,
  onExport,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const descriptionId = useId();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const isBusy = Boolean(busy);
  const shown = open && !disabled && !isBusy;

  const dismiss = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus)
      root.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };

  // 메뉴 바깥 클릭과 키보드 탐색을 처리함
  useEffect(() => {
    if (!shown) return;
    menu.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    const outside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, [shown]);

  // 저장 중에는 장면 조작과 배경 포커스 이동을 차단함
  useEffect(() => {
    if (!isBusy) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusCancel = () =>
      dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const retainFocus = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !dialog.current?.contains(event.target)
      )
        focusCancel();
    };
    document.body.style.overflow = "hidden";
    focusCancel();
    document.addEventListener("focusin", retainFocus);
    return () => {
      document.removeEventListener("focusin", retainFocus);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [isBusy]);

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    const choices = Array.from(
      menu.current?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ) ?? [],
    );
    const index = choices.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % choices.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + choices.length) % choices.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = choices.length - 1;
        break;
      case "Escape":
        event.preventDefault();
        dismiss();
        return;
      case "Tab":
        dismiss(false);
        return;
      default:
        return;
    }
    event.preventDefault();
    choices[next]?.focus();
  };
  const progress =
    busy && Number.isFinite(busy.progress)
      ? Math.max(0, Math.min(100, Math.round(busy.progress)))
      : 0;
  const busyTitle = formats.find((item) => item.format === busy?.format)?.title;

  return (
    <div className="scene-export" ref={root}>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="장면 다운로드"
        title="장면 다운로드"
        aria-haspopup="menu"
        aria-expanded={shown}
        aria-controls={shown ? menuId : undefined}
        disabled={disabled || isBusy}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Download size={17} />
      </Button>
      {(shown || (error && !isBusy)) && (
        <div className="scene-export-panel">
          {shown && (
            <>
              <p id={descriptionId} className="scene-export-description">
                현재 시점을 유지하고 도시 주변 여백을 줄여 저장합니다
              </p>
              <div
                ref={menu}
                id={menuId}
                role="menu"
                aria-label="다운로드 형식"
                aria-orientation="horizontal"
                aria-describedby={descriptionId}
                onKeyDown={navigate}
              >
                {formats.map(({ format, title, detail }) => (
                  <button
                    key={format}
                    type="button"
                    role="menuitem"
                    className="scene-export-option"
                    aria-label={`${title} ${detail}`}
                    title={`${title}: ${detail}`}
                    disabled={format !== "png" && !animated}
                    onClick={() => {
                      dismiss();
                      onExport(format);
                    }}
                  >
                    <strong aria-hidden="true">{format.toUpperCase()}</strong>
                  </button>
                ))}
              </div>
              {!animated && (
                <p className="scene-export-description">
                  애니메이션은 예측 결과의 재생 준비 후 저장할 수 있습니다
                </p>
              )}
            </>
          )}
          {error && (
            <p role="alert" className="scene-export-error">
              {error}
            </p>
          )}
        </div>
      )}
      {busy &&
        createPortal(
          <div
            className="scene-export-backdrop"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
              }
              if (event.key === "Tab") {
                event.preventDefault();
                dialog.current
                  ?.querySelector<HTMLButtonElement>("button")
                  ?.focus();
              }
            }}
          >
            <div
              ref={dialog}
              className="scene-export-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              aria-describedby={dialogDescriptionId}
            >
              <h2 id={dialogTitleId}>{busyTitle} 저장 중</h2>
              <p id={dialogDescriptionId}>
                현재 시점으로 장면을 저장하고 있습니다
              </p>
              <div className="scene-export-progress">
                <progress
                  aria-label="다운로드 준비 진행률"
                  max={100}
                  value={progress}
                />
                <span>{progress}%</span>
              </div>
              <Button type="button" variant="secondary" onClick={onCancel}>
                취소
              </Button>
            </div>
          </div>,
          document.fullscreenElement ?? document.body,
        )}
    </div>
  );
}
