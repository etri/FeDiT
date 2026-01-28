/**
 * @file CropControlPanel.tsx
 * @description Control panel for numerical input of crop bounds
 */

import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { useCropStore } from '../hooks/useCropStore';
import './CropControlPanel.css';

interface CropControlPanelProps {
  onApply: () => void;
  onExport: () => void;
}

export default function CropControlPanel({ onApply, onExport }: CropControlPanelProps) {
  const { cropMin, cropMax, originalMin, originalMax, setCropBounds, resetToOriginal } = useCropStore();

  const handleMinChange = (axis: 0 | 1 | 2, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newMin: [number, number, number] = [...cropMin];
    newMin[axis] = value;
    setCropBounds(newMin, cropMax);
  };

  const handleMaxChange = (axis: 0 | 1 | 2, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newMax: [number, number, number] = [...cropMax];
    newMax[axis] = value;
    setCropBounds(cropMin, newMax);
  };

  const cropSize: [number, number, number] = [
    cropMax[0] - cropMin[0],
    cropMax[1] - cropMin[1],
    cropMax[2] - cropMin[2],
  ];

  const originalSize: [number, number, number] = [
    originalMax[0] - originalMin[0],
    originalMax[1] - originalMin[1],
    originalMax[2] - originalMin[2],
  ];

  const relativeSize = [
    (cropSize[0] / originalSize[0]) * 100,
    (cropSize[1] / originalSize[1]) * 100,
    (cropSize[2] / originalSize[2]) * 100,
  ];

  return (
    <div className="crop-control-panel">
      <div className="crop-inputs">
        <h4>크롭 영역 설정</h4>
        
        <div className="crop-axis-group">
          <label>X축</label>
          <div className="crop-input-row">
            <div className="crop-input-item">
              <label>Min</label>
              <InputNumber
                value={cropMin[0]}
                onValueChange={(e) => handleMinChange(0, e.value ?? undefined)}
                min={originalMin[0]}
                max={originalMax[0]}
                step={0.01}
                showButtons
              />
            </div>
            <div className="crop-input-item">
              <label>Max</label>
              <InputNumber
                value={cropMax[0]}
                onValueChange={(e) => handleMaxChange(0, e.value ?? undefined)}
                min={originalMin[0]}
                max={originalMax[0]}
                step={0.01}
                showButtons
              />
            </div>
          </div>
        </div>

        <div className="crop-axis-group">
          <label>Y축</label>
          <div className="crop-input-row">
            <div className="crop-input-item">
              <label>Min</label>
              <InputNumber
                value={cropMin[1]}
                onValueChange={(e) => handleMinChange(1, e.value ?? undefined)}
                min={originalMin[1]}
                max={originalMax[1]}
                step={0.01}
                showButtons
              />
            </div>
            <div className="crop-input-item">
              <label>Max</label>
              <InputNumber
                value={cropMax[1]}
                onValueChange={(e) => handleMaxChange(1, e.value ?? undefined)}
                min={originalMin[1]}
                max={originalMax[1]}
                step={0.01}
                showButtons
              />
            </div>
          </div>
        </div>

        <div className="crop-axis-group">
          <label>Z축</label>
          <div className="crop-input-row">
            <div className="crop-input-item">
              <label>Min</label>
              <InputNumber
                value={cropMin[2]}
                onValueChange={(e) => handleMinChange(2, e.value ?? undefined)}
                min={originalMin[2]}
                max={originalMax[2]}
                step={0.01}
                showButtons
              />
            </div>
            <div className="crop-input-item">
              <label>Max</label>
              <InputNumber
                value={cropMax[2]}
                onValueChange={(e) => handleMaxChange(2, e.value ?? undefined)}
                min={originalMin[2]}
                max={originalMax[2]}
                step={0.01}
                showButtons
              />
            </div>
          </div>
        </div>

        <div className="crop-info">
          <div className="crop-info-item">
            <span>크롭 크기:</span>
            <span>
              {cropSize[0].toFixed(3)} × {cropSize[1].toFixed(3)} × {cropSize[2].toFixed(3)}
            </span>
          </div>
          <div className="crop-info-item">
            <span>상대 크기:</span>
            <span>
              {relativeSize[0].toFixed(1)}% × {relativeSize[1].toFixed(1)}% × {relativeSize[2].toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="crop-actions">
        <Button
          label="원본으로 리셋"
          icon="pi pi-refresh"
          onClick={resetToOriginal}
          severity="secondary"
          className="w-full"
        />
        <Button
          label="적용"
          icon="pi pi-check"
          onClick={onApply}
          severity="success"
          className="w-full"
        />
        <Button
          label="STL 내보내기"
          icon="pi pi-download"
          onClick={onExport}
          severity="info"
          className="w-full"
        />
      </div>
    </div>
  );
}
