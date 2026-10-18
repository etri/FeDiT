import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { InputNumber } from 'primereact/inputnumber';
import { useViewerStore } from '../../hooks/useViewerStore';
import { useState, useRef, useEffect } from 'react';
import './TransformPanel.css';

export function TransformPanel() {
  const {
    selectedModelId,
    models,
    transformMode,
    transformSpace,
    isTransforming,
    currentSimulation,
    setTransformMode,
    setTransformSpace,
    updateModel,
  } = useViewerStore();

  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle mouse move - MUST be before any early returns
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Get panel dimensions
      if (panelRef.current) {
        const panel = panelRef.current;
        const panelRect = panel.getBoundingClientRect();
        const maxX = window.innerWidth - panelRect.width;
        const maxY = window.innerHeight - panelRect.height;

        // Constrain to window bounds
        setPanelPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, panelPosition.x, panelPosition.y]);

  // All hooks must be called before early returns
  console.log('[TransformPanel] Rendering:', {
    selectedModelId,
    transformMode,
    hasSelectedModel: !!selectedModel,
    currentSimulation
  });

  // Hide transform panel when a simulation is selected
  if (currentSimulation) {
    console.log('[TransformPanel] Simulation selected, hiding transform panel');
    return null;
  }

  if (!selectedModel) {
    console.log('[TransformPanel] No selected model, returning null');
    return null;
  }

  if (!transformMode) {
    console.log('[TransformPanel] No transform mode, returning null');
    return null;
  }

  // Handle mouse down on header
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on the close button
    if ((e.target as HTMLElement).closest('.p-button')) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y
    });
  };

  const modeOptions = [
    { label: 'Move', value: 'translate', icon: 'pi pi-arrows-alt' },
    { label: 'Rotate', value: 'rotate', icon: 'pi pi-sync' },
    { label: 'Scale', value: 'scale', icon: 'pi pi-arrows-h' },
  ];

  const spaceOptions = [
    { label: 'World', value: 'world' },
    { label: 'Local', value: 'local' },
  ];

  const position = selectedModel.position || [0, 0, 0];
  const rotation = selectedModel.rotation || [0, 0, 0];
  const scale = selectedModel.scale || [1, 1, 1];

  // Convert radians to degrees for display
  const rotationDeg = rotation.map((r) => (r * 180) / Math.PI);

  const handlePositionChange = (axis: number, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newPosition: [number, number, number] = [...position];
    newPosition[axis] = value;
    updateModel(selectedModel.id, { position: newPosition });
  };

  const handleRotationChange = (axis: number, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newRotation: [number, number, number] = [...rotation];
    newRotation[axis] = (value * Math.PI) / 180; // Convert degrees to radians
    updateModel(selectedModel.id, { rotation: newRotation });
  };

  const handleScaleChange = (axis: number, value: number | null | undefined) => {
    if (value === null || value === undefined) return;
    const newScale: [number, number, number] = [...scale];
    newScale[axis] = value;
    updateModel(selectedModel.id, { scale: newScale });
  };

  const handleResetTransform = () => {
    updateModel(selectedModel.id, {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
  };

  return (
    <div
      ref={panelRef}
      className={`transform-panel ${isTransforming ? 'transforming' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: panelPosition.x === 0 && panelPosition.y === 0
          ? 'translateX(-50%)'
          : 'none',
        left: panelPosition.x === 0 && panelPosition.y === 0
          ? '50%'
          : `${panelPosition.x}px`,
        top: panelPosition.x === 0 && panelPosition.y === 0
          ? '5rem'
          : `${panelPosition.y}px`
      }}
    >
      <div
        className="transform-panel-header"
        onMouseDown={handleMouseDown}
      >
        <h3>Transform: {selectedModel.name}</h3>
        <Button
          icon="pi pi-times"
          className="p-button-text p-button-sm"
          onClick={() => setTransformMode(null)}
          tooltip="Close"
        />
      </div>

      <div className="transform-panel-section">
        <label>Mode</label>
        <SelectButton
          value={transformMode}
          options={modeOptions}
          onChange={(e) => {
            // Toggle: if clicking the same mode, close the panel
            if (e.value === transformMode) {
              setTransformMode(null);
            } else {
              setTransformMode(e.value);
            }
          }}
          optionLabel="label"
          optionValue="value"
          className="transform-mode-selector"
        />
      </div>

      <div className="transform-panel-section">
        <label>Space</label>
        <SelectButton
          value={transformSpace}
          options={spaceOptions}
          onChange={(e) => setTransformSpace(e.value)}
          optionLabel="label"
          optionValue="value"
        />
      </div>

      <div className="transform-panel-section">
        <label>Position</label>
        <div className="transform-input-group">
          <div className="transform-input-item">
            <span>X</span>
            <InputNumber
              value={position[0]}
              onValueChange={(e) => handlePositionChange(0, e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              step={0.1}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
          <div className="transform-input-item">
            <span>Y</span>
            <InputNumber
              value={position[1]}
              onValueChange={(e) => handlePositionChange(1, e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              step={0.1}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
          <div className="transform-input-item">
            <span>Z</span>
            <InputNumber
              value={position[2]}
              onValueChange={(e) => handlePositionChange(2, e.value)}
              mode="decimal"
              minFractionDigits={3}
              maxFractionDigits={3}
              step={0.1}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
        </div>
      </div>

      <div className="transform-panel-section">
        <label>Rotation (degrees)</label>
        <div className="transform-input-group">
          <div className="transform-input-item">
            <span>X</span>
            <InputNumber
              value={rotationDeg[0]}
              onValueChange={(e) => handleRotationChange(0, e.value)}
              mode="decimal"
              minFractionDigits={1}
              maxFractionDigits={1}
              step={15}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
          <div className="transform-input-item">
            <span>Y</span>
            <InputNumber
              value={rotationDeg[1]}
              onValueChange={(e) => handleRotationChange(1, e.value)}
              mode="decimal"
              minFractionDigits={1}
              maxFractionDigits={1}
              step={15}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
          <div className="transform-input-item">
            <span>Z</span>
            <InputNumber
              value={rotationDeg[2]}
              onValueChange={(e) => handleRotationChange(2, e.value)}
              mode="decimal"
              minFractionDigits={1}
              maxFractionDigits={1}
              step={15}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
        </div>
      </div>

      <div className="transform-panel-section">
        <label>Scale</label>
        <div className="transform-input-group">
          <div className="transform-input-item">
            <span>X</span>
            <InputNumber
              value={scale[0]}
              onValueChange={(e) => handleScaleChange(0, e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              step={0.1}
              min={0.01}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
          <div className="transform-input-item">
            <span>Y</span>
            <InputNumber
              value={scale[1]}
              onValueChange={(e) => handleScaleChange(1, e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              step={0.1}
              min={0.01}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
          <div className="transform-input-item">
            <span>Z</span>
            <InputNumber
              value={scale[2]}
              onValueChange={(e) => handleScaleChange(2, e.value)}
              mode="decimal"
              minFractionDigits={2}
              maxFractionDigits={2}
              step={0.1}
              min={0.01}
              showButtons
              buttonLayout="horizontal"
              size={6}
            />
          </div>
        </div>
      </div>

      <div className="transform-panel-actions">
        <Button
          label="Reset Transform"
          icon="pi pi-refresh"
          className="p-button-secondary"
          onClick={handleResetTransform}
        />
      </div>
    </div>
  );
}
