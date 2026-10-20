import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useDirectUpload } from "../uploads/upload-context";
import { uploadFormats } from "../uploads/useUploader";
import "./UploadDatasetCard.css";

export function UploadDatasetCard() {
  const upload = useDirectUpload();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const feedback = upload.entries.length > 0 || Boolean(upload.error);
  return (
    <div
      className={`upload-dataset-card${dragging ? " is-dragging" : ""}${feedback ? " has-feedback" : ""}`}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = upload.ready ? "copy" : "none";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        void upload.addFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept={uploadFormats.join(",")}
        aria-label="업로드할 파일 선택"
        onChange={(event) => {
          void upload.addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className="upload-dataset-preview"
        aria-label="데이터 업로드"
        disabled={!upload.ready}
        onClick={() => input.current?.click()}
      >
        <span className="upload-dataset-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 2048 2048"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
            data-icon-name="Upload"
          >
            <path d="M1536 0v128H384V0h1152zm45 979l-90 90-467-470v1449H896V599l-467 470-90-90 621-626 621 626z" />
          </svg>
        </span>
        <strong>{dragging ? "여기에 파일 놓기" : "데이터 업로드"}</strong>
      </button>
      {feedback && (
        <div className="upload-dataset-results">
          {upload.error && (
            <p role="alert" className="upload-file-error">
              {upload.error}
            </p>
          )}
          <ul aria-label="업로드 상태">
            {upload.entries.map((entry) => (
              <li key={entry.id} className="upload-file">
                <div className="upload-file-heading">
                  <strong title={entry.name}>{entry.name}</strong>
                  {entry.status === "complete" && (
                    <Check size={15} aria-label="등록 완료" />
                  )}
                  {["registering", "preparing"].includes(entry.status) && (
                    <LoaderCircle
                      size={15}
                      className="spin"
                      aria-label="처리 중"
                    />
                  )}
                  {entry.status !== "registering" &&
                    entry.status !== "preparing" && (
                      <button
                        type="button"
                        className="upload-file-action"
                        aria-label={`${entry.name} ${entry.status === "uploading" ? "전송 취소" : "알림 닫기"}`}
                        onClick={() => upload.dismiss(entry.id)}
                      >
                        <X size={14} />
                      </button>
                    )}
                </div>
                <span className="upload-file-status" role="status">
                  {entry.status === "uploading"
                    ? `업로드 ${entry.progress}%`
                    : entry.status === "registering"
                      ? "등록 중"
                      : entry.status === "preparing"
                        ? "데이터 준비 중"
                        : entry.status === "complete"
                          ? "등록 완료"
                          : "확인 필요"}
                </span>
                {entry.status === "uploading" && (
                  <progress
                    value={entry.progress}
                    max={100}
                    aria-label={`${entry.name} 업로드 진행률`}
                  />
                )}
                {entry.error && (
                  <p className="upload-file-error" role="alert">
                    {entry.error}
                  </p>
                )}
                {entry.status === "error" && entry.retry && (
                  <button
                    type="button"
                    className="upload-file-retry"
                    onClick={() => void upload.retry(entry.id)}
                  >
                    <RotateCcw size={12} />
                    다시 시도
                  </button>
                )}
                {entry.status === "uncertain" && (
                  <Link to="/jobs" className="upload-file-retry">
                    작업 이력 확인
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
