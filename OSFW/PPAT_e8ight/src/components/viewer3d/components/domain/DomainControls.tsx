import React, { useState, useRef, useEffect } from 'react';
import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import type { InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import type { ToggleButtonChangeEvent } from 'primereact/togglebutton';
import { Dropdown } from 'primereact/dropdown';
import type { DropdownChangeEvent } from 'primereact/dropdown';
import { useAutoDomainStore } from '../../stores/autoDomainStore';
import type { Unit } from '../../utils/unitConverter';
import { formatWithUnit } from '../../utils/unitConverter';
import { useViewerStore } from '../../hooks/useViewerStore';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import './DomainControls.css';

export const DomainControls: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    settings,
    updateSettings,
    resetToDefaults,
    isVisible,
    toggleVisibility,
    autoGenerate,
    toggleAutoGenerate,
    showWireframe,
    toggleWireframe,
    showPlanes,
    togglePlanes,
    setUnit,
    flipFlowDirection
  } = useAutoDomainStore();

  const models = useViewerStore((state) => state.models);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current && (e.target as HTMLElement).closest('.p-panel-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const unitOptions: { label: string; value: Unit }[] = [
    { label: 'Millimeters (mm)', value: 'mm' },
    { label: 'Centimeters (cm)', value: 'cm' },
    { label: 'Meters (m)', value: 'm' },
    { label: 'Inches (in)', value: 'in' },
    { label: 'Feet (ft)', value: 'ft' },
  ];

  const handleSliderChange = (field: string, value: number | null) => {
    if (value !== null) {
      updateSettings({ [field]: value });

      // Trigger shadow regeneration when extension changes
      if (['frontExtension', 'rearExtension', 'sideRatio', 'heightRatio'].includes(field)) {
        const event = new CustomEvent('domainUpdated', {
          detail: {
            field: field,
            value: value,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
        console.log(`[DomainControls] Extension changed (${field}), triggering shadow regeneration`);
      }
    }
  };

  const handleInputChange = (field: string, e: InputNumberValueChangeEvent | any) => {
    // Handle InputNumberValueChangeEvent
    if (e && 'value' in e && e.value !== null && e.value !== undefined) {
      updateSettings({ [field]: e.value });

      // Trigger shadow regeneration when extension changes
      if (['frontExtension', 'rearExtension', 'sideRatio', 'heightRatio'].includes(field)) {
        const event = new CustomEvent('domainUpdated', {
          detail: {
            field: field,
            value: e.value,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
        console.log(`[DomainControls] Extension changed (${field}), triggering shadow regeneration`);
      }
    }
    // Handle direct values (string, boolean, etc.)
    else if (e !== null && e !== undefined) {
      updateSettings({ [field]: e });
    }
  };

  const handleVisibilityChange = (e: ToggleButtonChangeEvent) => {
    toggleVisibility(e.value);
  };

  const handleAutoGenerateChange = (e: ToggleButtonChangeEvent) => {
    toggleAutoGenerate(e.value);
  };

  const handleUnitChange = (e: DropdownChangeEvent) => {
    setUnit(e.value as Unit);
  };

  const handleExportSTL = async () => {
    if (models.length === 0) {
      alert('Please load a 3D model first');
      return;
    }

    try {
      const model = models[0];

      if (!model.object) {
        alert('Model is still loading. Please wait and try again.');
        return;
      }

      const exporter = new STLExporter();
      let stlString = '';

      // Check if object has children (Scene/Group structure)
      const hasChildren = (model.object as any)?.children && (model.object as any).children.length > 0;
      const isSceneOrGroup = model.object?.type === 'Scene' || model.object?.type === 'Group';

      if (model.type === 'gltf' || hasChildren || isSceneOrGroup) {
        // For GLTF/GLB and scene graphs
        const meshGroup = new THREE.Group();

        model.object.traverse((child: any) => {
          if (child.isMesh) {
            const meshClone = child.clone();
            meshClone.applyMatrix4(child.matrixWorld);
            meshGroup.add(meshClone);
          }
        });

        if (meshGroup.children.length === 0) {
          alert('No meshes found in the model. The model may not contain any 3D geometry.');
          return;
        }

        const exportResult = exporter.parse(meshGroup, { binary: false });
        stlString = typeof exportResult === 'string' ? exportResult : '';
      } else {
        // For direct mesh objects
        const exportResult = exporter.parse(model.object, { binary: false });
        stlString = typeof exportResult === 'string' ? exportResult : '';
      }

      if (!stlString || stlString.length < 100) {
        alert('STL export failed. Check console for details.');
        return;
      }

      // Download the STL file
      const blob = new Blob([stlString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${model.name.replace(/\.[^/.]+$/, '')}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`✅ STL exported: ${link.download}`);
    } catch (error) {
      console.error('❌ STL export error:', error);
      alert('Error exporting STL: ' + error);
    }
  };


  // Convert dimensions for display
  const getDisplayDimension = (value: number | null): number | null => {
    if (value === null || settings.scaleFactor === 1.0) return value;
    return value * settings.scaleFactor;
  };

  // Calculate Reynolds number (assuming typical automotive conditions)
  const calculateReynolds = (length: number | null, velocity: number = 30) => {
    // velocity in m/s (default 30 m/s = 108 km/h = 67 mph)
    // kinematic viscosity of air at 20°C = 1.5e-5 m²/s
    if (!length) return null;
    const kinematicViscosity = 1.5e-5;
    return (velocity * length) / kinematicViscosity;
  };

  const reynoldsNumber = settings.referenceLength
    ? calculateReynolds(getDisplayDimension(settings.referenceLength))
    : null;

  // Calculate actual extension sizes
  const frontExtensionSize = settings.vehicleLength
    ? getDisplayDimension(settings.vehicleLength * settings.frontExtension) || 0
    : 0;

  const rearExtensionSize = settings.vehicleLength
    ? getDisplayDimension(settings.vehicleLength * settings.rearExtension) || 0
    : 0;

  const sideExtensionSize = settings.vehicleWidth
    ? getDisplayDimension(settings.vehicleWidth * (settings.sideRatio - 1) / 2) || 0
    : 0;

  const totalSideWidth = settings.vehicleWidth
    ? getDisplayDimension(settings.vehicleWidth * settings.sideRatio) || 0
    : 0;

  const heightExtensionSize = settings.vehicleHeight
    ? getDisplayDimension(settings.vehicleHeight * (settings.heightRatio - 1)) || 0
    : 0;

  const totalHeight = settings.vehicleHeight
    ? getDisplayDimension(settings.vehicleHeight * settings.heightRatio) || 0
    : 0;

  return (
    <div
      ref={panelRef}
      className="domain-controls"
      style={{
        position: 'fixed',
        top: position.y || 20,
        right: position.x ? `calc(100vw - ${position.x}px - 320px)` : 20,
        width: '320px',
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <Panel
        header={
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
            <i className="pi pi-bars" style={{ marginRight: '0.5rem' }}></i>
            <span>Domain Settings</span>
          </div>
        }
        toggleable
        collapsed={false}
      >
        <div className="control-section">
          <h4>Unit Settings</h4>
          <div className="control-row">
            <label>Display Unit:</label>
            <Dropdown
              value={settings.displayUnit}
              options={unitOptions}
              onChange={handleUnitChange}
              placeholder="Select Unit"
              className="w-full"
            />
          </div>
          {settings.detectedUnit && settings.detectedUnit !== settings.displayUnit && (
            <div className="info-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
              <span>Detected unit: {settings.detectedUnit}</span>
            </div>
          )}
        </div>

        <div className="control-section">
          <h4>Flow Direction</h4>

          {/* Visual Flow Indicators */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '6px'
          }}>
            <div style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '4px',
              border: '2px solid #0088ff',
              backgroundColor: 'rgba(0,136,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <i className="pi pi-arrow-right" style={{ color: '#0088ff' }} />
                <span style={{ fontWeight: 'bold', color: '#0088ff', fontSize: '0.9em' }}>INLET</span>
              </div>
              <div style={{ fontSize: '0.75em', color: '#666' }}>
                {settings.frontExtension < settings.rearExtension ? 'Front' : 'Rear'} side
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 0.5rem',
              color: '#666'
            }}>
              →
            </div>

            <div style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '4px',
              border: '2px solid #ff4444',
              backgroundColor: 'rgba(255,68,68,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <i className="pi pi-arrow-right" style={{ color: '#ff4444' }} />
                <span style={{ fontWeight: 'bold', color: '#ff4444', fontSize: '0.9em' }}>OUTLET</span>
              </div>
              <div style={{ fontSize: '0.75em', color: '#666' }}>
                {settings.frontExtension < settings.rearExtension ? 'Rear' : 'Front'} side
              </div>
            </div>
          </div>

          <div className="control-row">
            <Button
              label="Flip Flow Direction"
              icon="pi pi-sync"
              onClick={flipFlowDirection}
              className="w-full"
              severity="warning"
              tooltip="Swap inlet and outlet positions"
              tooltipOptions={{ position: 'bottom' }}
            />
          </div>

          <div className="info-row" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
            <i className="pi pi-info-circle" style={{ marginRight: '0.25rem' }} />
            Blue arrows = Inlet flow, Red arrows = Outlet flow
          </div>
        </div>

        <div className="control-section">
          <div className="control-row">
            <ToggleButton
              checked={isVisible}
              onChange={handleVisibilityChange}
              onLabel="Domain Visible"
              offLabel="Domain Hidden"
              className="w-full"
            />
          </div>

          <div className="control-row">
            <ToggleButton
              checked={autoGenerate}
              onChange={handleAutoGenerateChange}
              onLabel="Auto Generate"
              offLabel="Manual Mode"
              className="w-full"
            />
          </div>

          <div className="control-row" style={{ marginTop: '0.5rem' }}>
            <Button
              label="Show Wireframe"
              icon={showWireframe ? "pi pi-eye" : "pi pi-eye-slash"}
              onClick={() => toggleWireframe()}
              className="w-full"
              severity={showWireframe ? "info" : "secondary"}
              outlined
            />
          </div>

          <div className="control-row">
            <Button
              label="Show Boundaries"
              icon={showPlanes ? "pi pi-eye" : "pi pi-eye-slash"}
              onClick={() => togglePlanes()}
              className="w-full"
              severity={showPlanes ? "info" : "secondary"}
              outlined
            />
          </div>
        </div>

        <div className="control-section">
          <h4>
            Front Extension
            <span style={{
              color: settings.frontExtension < settings.rearExtension ? '#0088ff' : '#ff4444',
              fontSize: '0.9em',
              marginLeft: '0.5rem'
            }}>
              ({settings.frontExtension < settings.rearExtension ? 'Inlet' : 'Outlet'})
            </span>
          </h4>
          <div className="control-row">
            <label>
              Front: {settings.frontExtension}x
              {frontExtensionSize > 0 && (
                <span style={{ color: '#00bfa5', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  ({formatWithUnit(frontExtensionSize, settings.displayUnit, 2)})
                </span>
              )}
            </label>
            <InputNumber
              value={settings.frontExtension}
              onValueChange={(e) => handleInputChange('frontExtension', e)}
              min={1}
              max={10}
              step={0.5}
              className="input-number-small"
            />
          </div>
          <div className="control-row" style={{ marginTop: '0.5rem' }}>
            <Slider
              value={settings.frontExtension}
              onChange={(e) => handleSliderChange('frontExtension', e.value as number)}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        <div className="control-section">
          <h4>
            Rear Extension
            <span style={{
              color: settings.frontExtension < settings.rearExtension ? '#ff4444' : '#0088ff',
              fontSize: '0.9em',
              marginLeft: '0.5rem'
            }}>
              ({settings.frontExtension < settings.rearExtension ? 'Outlet' : 'Inlet'})
            </span>
          </h4>
          <div className="control-row">
            <label>
              Rear: {settings.rearExtension}x
              {rearExtensionSize > 0 && (
                <span style={{ color: '#00bfa5', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  ({formatWithUnit(rearExtensionSize, settings.displayUnit, 2)})
                </span>
              )}
            </label>
            <InputNumber
              value={settings.rearExtension}
              onValueChange={(e) => handleInputChange('rearExtension', e)}
              min={1}
              max={15}
              step={0.5}
              className="input-number-small"
            />
          </div>
          <div className="control-row" style={{ marginTop: '0.5rem' }}>
            <Slider
              value={settings.rearExtension}
              onChange={(e) => handleSliderChange('rearExtension', e.value as number)}
              min={1}
              max={15}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        <div className="control-section">
          <h4>Side Extensions</h4>
          <div className="control-row">
            <label>
              Side Ratio: {settings.sideRatio}x
              {sideExtensionSize > 0 && (
                <span style={{ color: '#00bfa5', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  (±{formatWithUnit(sideExtensionSize, settings.displayUnit, 2)}, Total: {formatWithUnit(totalSideWidth, settings.displayUnit, 2)})
                </span>
              )}
            </label>
            <InputNumber
              value={settings.sideRatio}
              onValueChange={(e) => handleInputChange('sideRatio', e)}
              min={1}
              max={10}
              step={0.5}
              className="input-number-small"
            />
          </div>
          <div className="control-row" style={{ marginTop: '0.5rem' }}>
            <Slider
              value={settings.sideRatio}
              onChange={(e) => handleSliderChange('sideRatio', e.value as number)}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        <div className="control-section">
          <h4>Height Extension</h4>
          <div className="control-row">
            <label>
              Height: {settings.heightRatio}x
              {heightExtensionSize > 0 && (
                <span style={{ color: '#00bfa5', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  (+{formatWithUnit(heightExtensionSize, settings.displayUnit, 2)}, Total: {formatWithUnit(totalHeight, settings.displayUnit, 2)})
                </span>
              )}
            </label>
            <InputNumber
              value={settings.heightRatio}
              onValueChange={(e) => handleInputChange('heightRatio', e)}
              min={1}
              max={10}
              step={0.5}
              className="input-number-small"
            />
          </div>
          <div className="control-row" style={{ marginTop: '0.5rem' }}>
            <Slider
              value={settings.heightRatio}
              onChange={(e) => handleSliderChange('heightRatio', e.value as number)}
              min={1}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        <div className="control-section">
          <h4>Vehicle Info</h4>
          <div className="info-row">
            <span>Detected Orientation: </span>
            <strong>{settings.vehicleOrientation || 'Not detected'}</strong>
          </div>
          <div className="info-row">
            <span>Vehicle Length: </span>
            <strong>
              {settings.vehicleLength
                ? formatWithUnit(getDisplayDimension(settings.vehicleLength) || 0, settings.displayUnit, 3)
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row">
            <span>Vehicle Width: </span>
            <strong>
              {settings.vehicleWidth
                ? formatWithUnit(getDisplayDimension(settings.vehicleWidth) || 0, settings.displayUnit, 3)
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row">
            <span>Vehicle Height: </span>
            <strong>
              {settings.vehicleHeight
                ? formatWithUnit(getDisplayDimension(settings.vehicleHeight) || 0, settings.displayUnit, 3)
                : 'N/A'}
            </strong>
          </div>
        </div>

        <div className="control-section">
          <h4>CFD Reference Values</h4>
          <div className="info-row">
            <span>Reference Length (L): </span>
            <strong style={{ color: '#2196f3' }}>
              {settings.referenceLength
                ? formatWithUnit(getDisplayDimension(settings.referenceLength) || 0, settings.displayUnit, 3)
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row">
            <span>Frontal Area (A): </span>
            <strong style={{ color: '#2196f3' }}>
              {settings.frontalArea
                ? `${((getDisplayDimension(Math.sqrt(settings.frontalArea)) || 0) ** 2).toFixed(3)} ${settings.displayUnit}²`
                : 'N/A'}
            </strong>
          </div>
          {settings.referenceLength && (
            <div className="info-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
              <i className="pi pi-info-circle" style={{ marginRight: '0.25rem' }}></i>
              <span>Auto-calculated from model dimensions</span>
            </div>
          )}
        </div>

        <div className="control-section">
          <h4>CFD Analysis Parameters</h4>
          <div className="info-row">
            <span>Reynolds Number: </span>
            <strong style={{ color: '#4caf50' }}>
              {reynoldsNumber
                ? `Re = ${reynoldsNumber.toExponential(2)}`
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row" style={{ fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
            <span>@ 30 m/s (108 km/h)</span>
          </div>
          <div className="info-row" style={{ marginTop: '0.5rem' }}>
            <span>Flow Regime: </span>
            <strong style={{ color: '#ff9800' }}>
              {reynoldsNumber && reynoldsNumber > 5e5 ? 'Turbulent' : reynoldsNumber ? 'Transitional' : 'N/A'}
            </strong>
          </div>
          <div className="info-row" style={{ marginTop: '0.5rem' }}>
            <span>Domain Volume: </span>
            <strong>
              {settings.vehicleLength && settings.vehicleWidth && settings.vehicleHeight
                ? `${(
                    (getDisplayDimension(settings.vehicleLength * (1 + settings.frontExtension + settings.rearExtension)) || 0) *
                    (getDisplayDimension(settings.vehicleWidth * settings.sideRatio) || 0) *
                    (getDisplayDimension(settings.vehicleHeight * settings.heightRatio) || 0)
                  ).toFixed(2)} ${settings.displayUnit}³`
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-color-secondary)' }}>
              <i className="pi pi-chart-line" style={{ marginRight: '0.25rem' }}></i>
              Use these values for CFD setup
            </span>
          </div>
        </div>

        <div className="control-section">
          <h4>Domain Dimensions</h4>
          <div className="info-row">
            <span>Total Length: </span>
            <strong style={{ color: '#1e88e5' }}>
              {settings.vehicleLength
                ? formatWithUnit(
                    getDisplayDimension(settings.vehicleLength * (1 + settings.frontExtension + settings.rearExtension)) || 0,
                    settings.displayUnit,
                    2
                  )
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row">
            <span>Total Width: </span>
            <strong style={{ color: '#1e88e5' }}>
              {settings.vehicleWidth
                ? formatWithUnit(
                    getDisplayDimension(settings.vehicleWidth * settings.sideRatio) || 0,
                    settings.displayUnit,
                    2
                  )
                : 'N/A'}
            </strong>
          </div>
          <div className="info-row">
            <span>Total Height: </span>
            <strong style={{ color: '#1e88e5' }}>
              {settings.vehicleHeight
                ? formatWithUnit(
                    getDisplayDimension(settings.vehicleHeight * settings.heightRatio) || 0,
                    settings.displayUnit,
                    2
                  )
                : 'N/A'}
            </strong>
          </div>
        </div>

        <div className="control-section">
          <Button
            label="Export Model as STL"
            icon="pi pi-file-export"
            onClick={handleExportSTL}
            className="w-full mb-2"
            severity="info"
            disabled={models.length === 0}
            tooltip={models.length === 0 ? "Load a 3D model first" : "Export loaded model as STL file"}
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            label="Reset to Defaults"
            icon="pi pi-refresh"
            onClick={resetToDefaults}
            className="w-full"
            severity="secondary"
          />
        </div>
      </Panel>
    </div>
  );
};