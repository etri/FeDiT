/**
 * @file CropModal.tsx
 * @description Main modal component for STL model cropping
 */

import { useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import * as THREE from 'three';
import { useViewerStore } from '../viewer3d/hooks/useViewerStore';
import { useCropStore } from './hooks/useCropStore';
import { cropBufferGeometry, geometryToSTLBinary } from './utils/cropGeometry';
import CropViewer from './components/CropViewer';
import CropControlPanel from './components/CropControlPanel';
import type { ModelData } from '../viewer3d/types/viewer.types';
import './CropModal.css';

interface CropModalProps {
  visible: boolean;
  onHide: () => void;
  modelData: ModelData | null;
}

export default function CropModal({ visible, onHide, modelData }: CropModalProps) {
  const toast = useRef<Toast>(null);
  const { addModel } = useViewerStore();
  const { cropMin, cropMax, resetToOriginal } = useCropStore();

  // Reset crop bounds when modal opens or model changes
  useEffect(() => {
    if (visible && modelData) {
      resetToOriginal();
    }
  }, [visible, modelData, resetToOriginal]);

  const handleApply = async () => {
    if (!modelData) {
      toast.current?.show({
        severity: 'error',
        summary: '오류',
        detail: '모델 데이터가 없습니다.',
      });
      return;
    }

    try {
      // Load geometry
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        const loader = new (require('three/addons/loaders/STLLoader.js').STLLoader)();
        loader.load(
          modelData.url,
          (geo: THREE.BufferGeometry) => resolve(geo),
          undefined,
          (error: unknown) => reject(error)
        );
      });

      // Crop geometry
      const croppedGeometry = cropBufferGeometry(geometry, cropMin, cropMax);

      if (croppedGeometry.attributes.position.count === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: '경고',
          detail: '크롭된 영역에 삼각형이 없습니다. 크롭 영역을 조정해주세요.',
        });
        return;
      }

      // Convert to STL binary
      const stlBinary = geometryToSTLBinary(croppedGeometry);

      // Create Blob URL
      const blob = new Blob([stlBinary], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      // Add to main viewer
      addModel({
        id: `cropped-${Date.now()}`,
        url: blobUrl,
        name: `${modelData.name}_cropped`,
        type: 'stl',
        visible: true,
        color: modelData.color,
        transparent: modelData.transparent,
        opacity: modelData.opacity,
      });

      toast.current?.show({
        severity: 'success',
        summary: '성공',
        detail: '크롭된 모델이 메인 뷰어에 추가되었습니다.',
      });

      // Close modal
      onHide();
    } catch (error) {
      console.error('[CropModal] Failed to apply crop:', error);
      toast.current?.show({
        severity: 'error',
        summary: '오류',
        detail: '크롭 적용 중 오류가 발생했습니다.',
      });
    }
  };

  const handleExport = async () => {
    if (!modelData) {
      toast.current?.show({
        severity: 'error',
        summary: '오류',
        detail: '모델 데이터가 없습니다.',
      });
      return;
    }

    try {
      // Load geometry
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        const loader = new (require('three/addons/loaders/STLLoader.js').STLLoader)();
        loader.load(
          modelData.url,
          (geo: THREE.BufferGeometry) => resolve(geo),
          undefined,
          (error: unknown) => reject(error)
        );
      });

      // Crop geometry
      const croppedGeometry = cropBufferGeometry(geometry, cropMin, cropMax);

      if (croppedGeometry.attributes.position.count === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: '경고',
          detail: '크롭된 영역에 삼각형이 없습니다. 크롭 영역을 조정해주세요.',
        });
        return;
      }

      // Convert to STL binary
      const stlBinary = geometryToSTLBinary(croppedGeometry);

      // Download STL file
      const blob = new Blob([stlBinary], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${modelData.name}_cropped.stl`;
      link.click();
      URL.revokeObjectURL(url);

      toast.current?.show({
        severity: 'success',
        summary: '성공',
        detail: 'STL 파일이 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('[CropModal] Failed to export crop:', error);
      toast.current?.show({
        severity: 'error',
        summary: '오류',
        detail: 'STL 내보내기 중 오류가 발생했습니다.',
      });
    }
  };

  if (!modelData) {
    return null;
  }

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="STL 모델 크롭"
        modal
        className="crop-modal"
        style={{ width: '90vw', height: '90vh' }}
        contentStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        <div className="crop-modal-content">
          <div className="crop-viewer-container">
            <CropViewer modelData={modelData} />
          </div>
          <div className="crop-panel-container">
            <CropControlPanel onApply={handleApply} onExport={handleExport} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
