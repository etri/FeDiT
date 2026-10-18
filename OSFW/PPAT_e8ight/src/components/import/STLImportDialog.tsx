/**
 * @file STLImportDialog.tsx
 * @description Main dialog for STL model import with unit conversion and cropping
 */

import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useImportStore } from './hooks/useImportStore';
import { useViewerStore } from '../viewer3d/hooks/useViewerStore';
import { cropBufferGeometry, geometryToSTLBinary } from '../crop/utils/cropGeometry';
import ImportPreview from './components/ImportPreview';
import UnitSelector from './components/UnitSelector';
import GizmoModeSelector from './components/GizmoModeSelector';
import './STLImportDialog.css';

interface STLImportDialogProps {
  visible: boolean;
  onHide: () => void;
  file: File | null;
}

export default function STLImportDialog({ visible, onHide, file }: STLImportDialogProps) {
  const toast = useRef<Toast>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addModel } = useViewerStore();
  const {
    fileName,
    scaleFactor,
    cropEnabled,
    cropMin,
    cropMax,
    originalBounds,
    isLoading,
    showCropPreview,
    capCrossSection,
    setFileInfo,
    setCropEnabled,
    setCropBounds,
    resetCropToOriginal,
    setShowCropPreview,
    setCapCrossSection,
    reset,
    setDialogReady,
  } = useImportStore();

  // Handle dialog show event - set dialogReady after CSS animation completes
  const handleDialogShow = () => {
    // PrimeReact Dialog has CSS animation (default ~300ms)
    // Wait for animation to complete before setting dialogReady
    // This ensures Canvas getBoundingClientRect returns correct values
    setTimeout(() => {
      setDialogReady(true);
    }, 350); // Slightly longer than default PrimeReact animation
  };

  // Create blob URL when file changes
  useEffect(() => {
    if (file && visible) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileInfo(url, file.name);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFileUrl(null);
    }
  }, [file, visible, setFileInfo]);

  // Reset store when dialog closes
  useEffect(() => {
    if (!visible) {
      reset();
      setFileUrl(null);
    }
  }, [visible, reset]);

  // Handle crop bounds change from input
  const handleCropMinChange = (axis: 0 | 1 | 2, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newMin: [number, number, number] = [...cropMin];
    newMin[axis] = value;
    setCropBounds(newMin, cropMax);
  };

  const handleCropMaxChange = (axis: 0 | 1 | 2, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newMax: [number, number, number] = [...cropMax];
    newMax[axis] = value;
    setCropBounds(cropMin, newMax);
  };

  // Apply and add to main viewer
  const handleApply = async () => {
    if (!fileUrl || !file) {
      toast.current?.show({
        severity: 'error',
        summary: '오류',
        detail: '파일이 없습니다.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Load geometry
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        const loader = new STLLoader();
        loader.load(
          fileUrl,
          (geo) => resolve(geo),
          undefined,
          (error) => reject(error)
        );
      });

      let finalGeometry = geometry;

      // Apply cropping if enabled
      if (cropEnabled) {
        finalGeometry = cropBufferGeometry(geometry, cropMin, cropMax, capCrossSection);

        if (finalGeometry.attributes.position.count === 0) {
          toast.current?.show({
            severity: 'warn',
            summary: '경고',
            detail: '크롭된 영역에 삼각형이 없습니다. 크롭 영역을 조정해주세요.',
          });
          setIsProcessing(false);
          return;
        }
      }

      // Apply scale transformation using Matrix4 to ensure vertex data is transformed
      if (scaleFactor !== 1) {
        const scaleMatrix = new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor);
        finalGeometry.applyMatrix4(scaleMatrix);
        // Recompute bounding box and normals after transformation
        finalGeometry.computeBoundingBox();
        finalGeometry.computeVertexNormals();
      }

      // Convert to STL binary and create blob URL
      const stlBinary = geometryToSTLBinary(finalGeometry);
      const blob = new Blob([stlBinary], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      // Generate model name
      const baseName = file.name.replace(/\.stl$/i, '');
      const suffix = cropEnabled ? '_cropped' : '';
      const modelName = `${baseName}${suffix}`;

      // Add to main viewer
      addModel({
        id: `model-${Date.now()}-${Math.random()}`,
        url: blobUrl,
        name: modelName,
        type: 'stl',
        visible: true,
        color: '#cccccc',
        transparent: false,
        opacity: 1.0,
      });

      toast.current?.show({
        severity: 'success',
        summary: '성공',
        detail: '모델이 메인 뷰어에 추가되었습니다.',
      });

      // Fit camera to new model after a short delay
      setTimeout(() => {
        const fitToBox = (window as any).dreiViewerFitToBox;
        if (fitToBox) {
          fitToBox();
        }
      }, 500);

      // Close dialog
      onHide();
    } catch (error) {
      console.error('[STLImportDialog] Failed to apply:', error);
      toast.current?.show({
        severity: 'error',
        summary: '오류',
        detail: '모델 처리 중 오류가 발생했습니다.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel and close
  const handleCancel = () => {
    onHide();
  };

  // Dialog footer
  const footer = (
    <div className="stl-import-dialog-footer">
      <Button
        label="취소"
        icon="pi pi-times"
        severity="secondary"
        onClick={handleCancel}
        disabled={isProcessing}
      />
      <Button
        label="메인 뷰에 추가"
        icon="pi pi-check"
        severity="success"
        onClick={handleApply}
        disabled={isProcessing || isLoading}
        loading={isProcessing}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        onShow={handleDialogShow}
        header={`STL 모델 불러오기: ${file?.name || ''}`}
        modal
        className="stl-import-dialog"
        style={{ width: '90vw', maxWidth: '1200px' }}
        contentStyle={{ height: '70vh', padding: 0 }}
        footer={footer}
        closable={!isProcessing}
        closeOnEscape={!isProcessing}
      >
        <div className="stl-import-content">
          {/* 3D Preview */}
          <div className="stl-import-preview">
            {fileUrl ? (
              <ImportPreview fileUrl={fileUrl} />
            ) : (
              <div className="stl-import-loading">
                <ProgressSpinner />
                <span>로딩 중...</span>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="stl-import-controls">
            {/* Unit Settings */}
            <div className="stl-import-section">
              <h4>
                <i className="pi pi-ruler" style={{ marginRight: '0.5rem' }} />
                단위 설정
              </h4>
              <UnitSelector disabled={isLoading} />
            </div>

            {/* Crop Settings */}
            <div className="stl-import-section">
              <h4>
                <i className="pi pi-crop" style={{ marginRight: '0.5rem' }} />
                크롭 설정
              </h4>

              <div className="crop-enable-toggle">
                <Checkbox
                  inputId="cropEnabled"
                  checked={cropEnabled}
                  onChange={(e) => setCropEnabled(e.checked ?? false)}
                  disabled={isLoading}
                />
                <label htmlFor="cropEnabled" style={{ marginLeft: '0.5rem' }}>
                  크롭 활성화
                </label>
              </div>

              {cropEnabled && (
                <>
                  {/* Gizmo Mode Selector */}
                  <div style={{ marginTop: '1rem' }}>
                    <GizmoModeSelector disabled={isLoading} />
                  </div>

                  {/* Crop Bounds Input */}
                  <div className="crop-bounds-inputs" style={{ marginTop: '1rem' }}>
                    <div className="crop-axis-group">
                      <label>X축</label>
                      <div className="crop-input-row">
                        <div className="crop-input-item">
                          <span>Min</span>
                          <InputNumber
                            value={cropMin[0]}
                            onValueChange={(e) => handleCropMinChange(0, e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={4}
                            step={1}
                            showButtons
                            buttonLayout="horizontal"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="crop-input-item">
                          <span>Max</span>
                          <InputNumber
                            value={cropMax[0]}
                            onValueChange={(e) => handleCropMaxChange(0, e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={4}
                            step={1}
                            showButtons
                            buttonLayout="horizontal"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="crop-axis-group">
                      <label>Y축</label>
                      <div className="crop-input-row">
                        <div className="crop-input-item">
                          <span>Min</span>
                          <InputNumber
                            value={cropMin[1]}
                            onValueChange={(e) => handleCropMinChange(1, e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={4}
                            step={1}
                            showButtons
                            buttonLayout="horizontal"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="crop-input-item">
                          <span>Max</span>
                          <InputNumber
                            value={cropMax[1]}
                            onValueChange={(e) => handleCropMaxChange(1, e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={4}
                            step={1}
                            showButtons
                            buttonLayout="horizontal"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="crop-axis-group">
                      <label>Z축</label>
                      <div className="crop-input-row">
                        <div className="crop-input-item">
                          <span>Min</span>
                          <InputNumber
                            value={cropMin[2]}
                            onValueChange={(e) => handleCropMinChange(2, e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={4}
                            step={1}
                            showButtons
                            buttonLayout="horizontal"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="crop-input-item">
                          <span>Max</span>
                          <InputNumber
                            value={cropMax[2]}
                            onValueChange={(e) => handleCropMaxChange(2, e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={4}
                            step={1}
                            showButtons
                            buttonLayout="horizontal"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="cap-option" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Checkbox
                        inputId="capCrossSection"
                        checked={capCrossSection}
                        onChange={(e) => setCapCrossSection(e.checked ?? true)}
                        disabled={isLoading}
                      />
                      <label htmlFor="capCrossSection" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                        잘린 단면 메꾸기
                      </label>
                    </div>
                    <Button
                      label="원본으로 리셋"
                      icon="pi pi-refresh"
                      severity="secondary"
                      size="small"
                      onClick={resetCropToOriginal}
                      disabled={isLoading}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    />
                    <Button
                      label={showCropPreview ? "크롭 박스 보기" : "크롭 미리보기"}
                      icon={showCropPreview ? "pi pi-eye-slash" : "pi pi-eye"}
                      severity="info"
                      size="small"
                      onClick={() => setShowCropPreview(!showCropPreview)}
                      disabled={isLoading}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Model Info */}
            {originalBounds && (
              <div className="stl-import-section">
                <h4>
                  <i className="pi pi-info-circle" style={{ marginRight: '0.5rem' }} />
                  모델 정보
                </h4>
                <div className="model-info-grid">
                  <div className="model-info-item">
                    <span className="label">파일명:</span>
                    <span className="value">{fileName}</span>
                  </div>
                  <div className="model-info-item">
                    <span className="label">원본 크기:</span>
                    <span className="value">
                      {originalBounds.size.x.toFixed(2)} × {originalBounds.size.y.toFixed(2)} × {originalBounds.size.z.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
