import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Box, LoaderCircle, Pencil } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useRenameDataset } from "./api";
import { datasetName, validationMessages, type Dataset } from "./types";
import "./DatasetCard.css";

let thumbnailQueue: Promise<unknown> = Promise.resolve();

function retryDelay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

// 화면에 가까운 카드부터 미리보기를 순차 요청
function loadThumbnail(url: string, signal: AbortSignal) {
  const request = thumbnailQueue.then(async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      signal.throwIfAborted();
      const response = await fetch(url, {
        signal,
        credentials: "same-origin",
      });
      if (response.ok) return response.blob();
      if (![429, 503].includes(response.status) || attempt === 4)
        throw new Error("Preview unavailable.");
      const seconds = Number(response.headers.get("Retry-After") ?? "2");
      await retryDelay(
        Number.isFinite(seconds)
          ? Math.min(5, Math.max(0.25, seconds)) * 1000
          : 2000,
        signal,
      );
    }
    throw new Error("Preview unavailable.");
  });
  thumbnailQueue = request.catch(() => undefined);
  return request;
}

function DatasetThumbnail({ dataset }: { dataset: Dataset }) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  const [image, setImage] = useState("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = datasetName(dataset);
  const thumbnailUrl = dataset.thumbnailUrl;
  useEffect(() => {
    if (visible || !element.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || !thumbnailUrl) return;
    const controller = new AbortController();
    let imageUrl = "";
    void loadThumbnail(thumbnailUrl, controller.signal).then(
      (blob) => {
        if (controller.signal.aborted) return;
        imageUrl = URL.createObjectURL(blob);
        setImage(imageUrl);
      },
      () => {
        if (!controller.signal.aborted) setFailed(true);
      },
    );
    return () => {
      controller.abort();
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [visible, thumbnailUrl]);

  return (
    <div className="dataset-visual dataset-preview" ref={element}>
      {image && !failed && (
        <img
          src={image}
          alt={`${name} 3D 공간 미리보기`}
          loading="lazy"
          decoding="async"
          className={ready ? "is-ready" : ""}
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {(!ready || failed) && (
        <div className="dataset-preview-placeholder">
          {thumbnailUrl && !failed ? (
            <LoaderCircle size={24} className="spin" aria-hidden="true" />
          ) : (
            <Box size={38} strokeWidth={1} aria-hidden="true" />
          )}
          <small>
            {failed
              ? "Preview unavailable"
              : thumbnailUrl
                ? "미리보기 준비 중"
                : "3D 미리보기"}
          </small>
        </div>
      )}
    </div>
  );
}

export function DatasetCard({
  dataset,
  onOpen,
}: {
  dataset: Dataset;
  onOpen: () => void;
}) {
  const name = datasetName(dataset);
  const rename = useRenameDataset(dataset.id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(name);
  const titleInput = useRef<HTMLInputElement>(null);
  const activeEditing = useRef(false);
  const saving = useRef(false);
  const titleId = useId();
  const errorId = useId();
  const errors = validationMessages(dataset, "error");
  const validTitle =
    Boolean(title.trim()) &&
    title.trim().length <= 120 &&
    !Array.from(title).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    });
  const titleError = !title.trim()
    ? "Title cannot be empty."
    : title.trim().length > 120
      ? "Title exceeds 120 characters."
      : !validTitle
        ? "Title contains invalid characters."
        : rename.error?.message;
  const cancel = () => {
    if (rename.isPending || saving.current) return;
    activeEditing.current = false;
    setEditing(false);
    rename.reset();
  };
  const save = () => {
    if (!activeEditing.current || saving.current || !validTitle) return;
    const next = title.trim();
    if (next === name.trim()) {
      activeEditing.current = false;
      setEditing(false);
      rename.reset();
      return;
    }
    saving.current = true;
    rename.mutate(next, {
      onSuccess: () => {
        activeEditing.current = false;
        setEditing(false);
      },
      onError: () => titleInput.current?.focus(),
      onSettled: () => {
        saving.current = false;
      },
    });
  };

  return (
    <article className="dataset-card" aria-label={name}>
      <button
        type="button"
        className="dataset-card-select"
        aria-label={`${name} 선택`}
        aria-describedby={errors.length ? errorId : undefined}
        disabled={Boolean(errors.length) || editing}
        onClick={onOpen}
      />
      <DatasetThumbnail
        key={JSON.stringify([
          dataset.spaceId ?? dataset.id,
          dataset.version,
          dataset.thumbnailUrl,
        ])}
        dataset={dataset}
      />
      <div className="dataset-card-body">
        <div className="title-row dataset-title-row">
          <div className="dataset-title" aria-busy={rename.isPending}>
            {editing ? (
              <input
                ref={titleInput}
                id={titleId}
                className="dataset-title-input"
                aria-label="데이터셋 제목"
                value={title}
                maxLength={120}
                autoFocus
                readOnly={rename.isPending}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (rename.error) rename.reset();
                }}
                onClick={(event) => event.stopPropagation()}
                onBlur={save}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.nativeEvent.isComposing || event.keyCode === 229)
                    return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    save();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    cancel();
                  }
                }}
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? `${titleId}-error` : undefined}
              />
            ) : (
              <h2>{name}</h2>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="dataset-title-edit"
              aria-label={`${name} 제목 편집`}
              title="제목 편집"
              disabled={editing}
              onKeyDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                activeEditing.current = true;
                setTitle(name);
                rename.reset();
                setEditing(true);
              }}
            >
              {rename.isPending ? (
                <LoaderCircle size={13} className="spin" aria-hidden="true" />
              ) : (
                <Pencil size={13} />
              )}
            </Button>
          </div>
        </div>
        {editing && titleError && (
          <p
            id={`${titleId}-error`}
            className="error-text dataset-title-error"
            role="alert"
          >
            {titleError}
          </p>
        )}
        {errors.length > 0 && (
          <p id={errorId} className="error-text" role="alert">
            <AlertCircle size={13} aria-hidden="true" />
            {errors[0]}
          </p>
        )}
      </div>
    </article>
  );
}
