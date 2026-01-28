/**
 * @file DomainConfigPanel.tsx
 * @description Domain configuration panel with tabs for different settings
 */

import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { ColorPicker } from 'primereact/colorpicker';
import { Slider } from 'primereact/slider';
import { Divider } from 'primereact/divider';
import { useDomainStore } from '../../stores/domainStore';
import type { DomainShape, BoundaryType, BoxDomain } from '../../types/domain.types';

const DomainConfigPanel: React.FC = () => {
  const {
    domain,
    presets,
    applyPreset,
    validateDomain,
    exportDomain,
    reset,
  } = useDomainStore();

  const [activeIndex, setActiveIndex] = useState(0);

  if (!domain) {
    return (
      <Card title="No Domain Configured">
        <div className="flex flex-column gap-3">
          <p>Select a preset to start configuring your domain:</p>
          <Dropdown
            options={presets}
            optionLabel="name"
            optionValue="id"
            placeholder="Choose a preset..."
            onChange={(e) => applyPreset(e.value)}
            className="w-full"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Domain Configuration" className="h-full">
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header="Shape">
          <ShapeConfiguration />
        </TabPanel>
        <TabPanel header="Boundaries">
          <BoundaryConfiguration />
        </TabPanel>
        <TabPanel header="Mesh">
          <MeshConfiguration />
        </TabPanel>
        <TabPanel header="Display">
          <DisplayConfiguration />
        </TabPanel>
        <TabPanel header="Validation">
          <ValidationPanel />
        </TabPanel>
      </TabView>

      <Divider />

      <div className="flex justify-content-between">
        <Button
          label="Reset"
          icon="pi pi-refresh"
          severity="warning"
          onClick={reset}
          size="small"
        />
        <div className="flex gap-2">
          <Button
            label="Validate"
            icon="pi pi-check"
            severity="info"
            onClick={validateDomain}
            size="small"
          />
          <Button
            label="Export"
            icon="pi pi-download"
            severity="success"
            onClick={() => {
              const data = exportDomain();
              console.log('Exported domain:', data);
            }}
            size="small"
          />
        </div>
      </div>
    </Card>
  );
};

const ShapeConfiguration: React.FC = () => {
  const { domain, updateDimensions, applyPreset, presets } = useDomainStore();

  if (!domain) return null;

  const shapeOptions: { label: string; value: DomainShape }[] = [
    { label: 'Box', value: 'box' },
    { label: 'Cylinder', value: 'cylinder' },
    { label: 'Sphere', value: 'sphere' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="flex flex-column gap-3">
      <div className="field">
        <label htmlFor="shape">Domain Shape</label>
        <Dropdown
          id="shape"
          value={domain.shape}
          options={shapeOptions}
          className="w-full"
          disabled
        />
      </div>

      <div className="field">
        <label htmlFor="preset">Apply Preset</label>
        <Dropdown
          id="preset"
          options={presets}
          optionLabel="name"
          optionValue="id"
          placeholder="Choose a preset..."
          onChange={(e) => applyPreset(e.value)}
          className="w-full"
        />
      </div>

      <Divider />

      {domain.shape === 'box' && 'dimensions' in domain && (
        <>
          <h4>Box Dimensions</h4>
          <div className="grid">
            <div className="col-4">
              <label htmlFor="width">Width (X)</label>
              <InputNumber
                id="width"
                value={domain.dimensions.width}
                onValueChange={(e) => updateDimensions({ width: e.value })}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={3}
                suffix=" m"
                className="w-full"
              />
            </div>
            <div className="col-4">
              <label htmlFor="height">Height (Y)</label>
              <InputNumber
                id="height"
                value={domain.dimensions.height}
                onValueChange={(e) => updateDimensions({ height: e.value })}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={3}
                suffix=" m"
                className="w-full"
              />
            </div>
            <div className="col-4">
              <label htmlFor="depth">Depth (Z)</label>
              <InputNumber
                id="depth"
                value={domain.dimensions.depth}
                onValueChange={(e) => updateDimensions({ depth: e.value })}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={3}
                suffix=" m"
                className="w-full"
              />
            </div>
          </div>
        </>
      )}

      {domain.shape === 'cylinder' && 'dimensions' in domain && (
        <>
          <h4>Cylinder Dimensions</h4>
          <div className="grid">
            <div className="col-6">
              <label htmlFor="radius">Radius</label>
              <InputNumber
                id="radius"
                value={domain.dimensions.radius}
                onValueChange={(e) => updateDimensions({ radius: e.value })}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={3}
                suffix=" m"
                className="w-full"
              />
            </div>
            <div className="col-6">
              <label htmlFor="height">Height</label>
              <InputNumber
                id="height"
                value={domain.dimensions.height}
                onValueChange={(e) => updateDimensions({ height: e.value })}
                mode="decimal"
                minFractionDigits={1}
                maxFractionDigits={3}
                suffix=" m"
                className="w-full"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const BoundaryConfiguration: React.FC = () => {
  const { domain, setBoundaryCondition } = useDomainStore();
  const [selectedFace, setSelectedFace] = useState<string | null>(null);

  if (!domain || domain.shape !== 'box') return null;

  const boxDomain = domain as BoxDomain;

  const boundaryTypes: { label: string; value: BoundaryType }[] = [
    { label: 'Wall', value: 'wall' },
    { label: 'Inlet', value: 'inlet' },
    { label: 'Outlet', value: 'outlet' },
    { label: 'Symmetry', value: 'symmetry' },
    { label: 'Periodic', value: 'periodic' },
    { label: 'Slip', value: 'slip' },
    { label: 'Atmosphere', value: 'atmosphere' },
  ];

  const faceOptions = Object.entries(boxDomain.boundaries).map(([face, boundary]) => ({
    label: boundary.name,
    value: face,
  }));

  const selectedBoundaryConfig = selectedFace ? boxDomain.boundaries[selectedFace as keyof typeof boxDomain.boundaries] : null;

  return (
    <div className="flex flex-column gap-3">
      <div className="field">
        <label htmlFor="face-select">Select Face</label>
        <Dropdown
          id="face-select"
          value={selectedFace}
          options={faceOptions}
          onChange={(e) => setSelectedFace(e.value)}
          placeholder="Choose a face..."
          className="w-full"
        />
      </div>

      {selectedBoundaryConfig && selectedFace && (
        <>
          <Divider />
          <h4>Boundary Settings for {selectedBoundaryConfig.name}</h4>

          <div className="field">
            <label htmlFor="boundary-type">Boundary Type</label>
            <Dropdown
              id="boundary-type"
              value={selectedBoundaryConfig.type}
              options={boundaryTypes}
              onChange={(e) => {
                setBoundaryCondition(selectedFace, {
                  ...selectedBoundaryConfig,
                  type: e.value,
                });
              }}
              className="w-full"
            />
          </div>

          {selectedBoundaryConfig.type === 'inlet' && (
            <div className="field">
              <label>Inlet Velocity (m/s)</label>
              <div className="grid">
                <div className="col-4">
                  <InputNumber
                    placeholder="X"
                    value={selectedBoundaryConfig.velocity?.value?.[0] || 0}
                    onValueChange={(e) => {
                      const newVelocity = [...(selectedBoundaryConfig.velocity?.value || [0, 0, 0])];
                      newVelocity[0] = e.value || 0;
                      setBoundaryCondition(selectedFace, {
                        ...selectedBoundaryConfig,
                        velocity: {
                          ...selectedBoundaryConfig.velocity,
                          type: 'fixedValue',
                          value: newVelocity as [number, number, number],
                        },
                      });
                    }}
                    mode="decimal"
                    className="w-full"
                  />
                </div>
                <div className="col-4">
                  <InputNumber
                    placeholder="Y"
                    value={selectedBoundaryConfig.velocity?.value?.[1] || 0}
                    onValueChange={(e) => {
                      const newVelocity = [...(selectedBoundaryConfig.velocity?.value || [0, 0, 0])];
                      newVelocity[1] = e.value || 0;
                      setBoundaryCondition(selectedFace, {
                        ...selectedBoundaryConfig,
                        velocity: {
                          ...selectedBoundaryConfig.velocity,
                          type: 'fixedValue',
                          value: newVelocity as [number, number, number],
                        },
                      });
                    }}
                    mode="decimal"
                    className="w-full"
                  />
                </div>
                <div className="col-4">
                  <InputNumber
                    placeholder="Z"
                    value={selectedBoundaryConfig.velocity?.value?.[2] || 0}
                    onValueChange={(e) => {
                      const newVelocity = [...(selectedBoundaryConfig.velocity?.value || [0, 0, 0])];
                      newVelocity[2] = e.value || 0;
                      setBoundaryCondition(selectedFace, {
                        ...selectedBoundaryConfig,
                        velocity: {
                          ...selectedBoundaryConfig.velocity,
                          type: 'fixedValue',
                          value: newVelocity as [number, number, number],
                        },
                      });
                    }}
                    mode="decimal"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedBoundaryConfig.type === 'outlet' && (
            <div className="field">
              <label htmlFor="outlet-pressure">Outlet Pressure (Pa)</label>
              <InputNumber
                id="outlet-pressure"
                value={selectedBoundaryConfig.pressure?.value || 0}
                onValueChange={(e) => {
                  setBoundaryCondition(selectedFace, {
                    ...selectedBoundaryConfig,
                    pressure: {
                      ...selectedBoundaryConfig.pressure,
                      type: 'fixedValue',
                      value: e.value || 0,
                    },
                  });
                }}
                mode="decimal"
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const MeshConfiguration: React.FC = () => {
  const { domain, updateMeshConfig } = useDomainStore();

  if (!domain) return null;

  return (
    <div className="flex flex-column gap-3">
      <div className="field">
        <label htmlFor="cell-size">Base Cell Size (m)</label>
        <InputNumber
          id="cell-size"
          value={domain.mesh.cellSize}
          onValueChange={(e) => updateMeshConfig({ cellSize: e.value || 0.01 })}
          mode="decimal"
          minFractionDigits={3}
          maxFractionDigits={4}
          min={0.0001}
          max={1}
          className="w-full"
        />
      </div>

      {domain.mesh.divisions && (
        <>
          <h4>Mesh Divisions</h4>
          <div className="grid">
            <div className="col-4">
              <label htmlFor="div-x">X Divisions</label>
              <InputNumber
                id="div-x"
                value={domain.mesh.divisions.x}
                onValueChange={(e) =>
                  updateMeshConfig({
                    divisions: domain.mesh.divisions
                      ? { ...domain.mesh.divisions, x: e.value || 1 }
                      : { x: e.value || 1, y: 1, z: 1 },
                  })
                }
                min={1}
                max={500}
                className="w-full"
              />
            </div>
            <div className="col-4">
              <label htmlFor="div-y">Y Divisions</label>
              <InputNumber
                id="div-y"
                value={domain.mesh.divisions.y}
                onValueChange={(e) =>
                  updateMeshConfig({
                    divisions: domain.mesh.divisions
                      ? { ...domain.mesh.divisions, y: e.value || 1 }
                      : { x: 1, y: e.value || 1, z: 1 },
                  })
                }
                min={1}
                max={500}
                className="w-full"
              />
            </div>
            <div className="col-4">
              <label htmlFor="div-z">Z Divisions</label>
              <InputNumber
                id="div-z"
                value={domain.mesh.divisions.z}
                onValueChange={(e) =>
                  updateMeshConfig({
                    divisions: domain.mesh.divisions
                      ? { ...domain.mesh.divisions, z: e.value || 1 }
                      : { x: 1, y: 1, z: e.value || 1 },
                  })
                }
                min={1}
                max={500}
                className="w-full"
              />
            </div>
          </div>
          <div className="text-sm text-color-secondary">
            Total cells: {domain.mesh.divisions.x * domain.mesh.divisions.y * domain.mesh.divisions.z}
          </div>
        </>
      )}

      <Divider />

      <h4>Refinement Levels</h4>
      <div className="field">
        <label htmlFor="surface-refinement">Surface Refinement Level</label>
        <Slider
          id="surface-refinement"
          value={domain.mesh.surfaceRefinementLevel}
          onChange={(e) => updateMeshConfig({ surfaceRefinementLevel: e.value as number })}
          min={0}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="text-sm text-color-secondary">Level: {domain.mesh.surfaceRefinementLevel}</div>
      </div>

      <div className="field">
        <label htmlFor="feature-refinement">Feature Edge Refinement Level</label>
        <Slider
          id="feature-refinement"
          value={domain.mesh.featureRefinementLevel}
          onChange={(e) => updateMeshConfig({ featureRefinementLevel: e.value as number })}
          min={0}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="text-sm text-color-secondary">Level: {domain.mesh.featureRefinementLevel}</div>
      </div>
    </div>
  );
};

const DisplayConfiguration: React.FC = () => {
  const { domain, updateDomain } = useDomainStore();

  if (!domain) return null;

  return (
    <div className="flex flex-column gap-3">
      <div className="field-checkbox">
        <Checkbox
          inputId="show-domain"
          checked={domain.display.visible}
          onChange={(e) =>
            updateDomain({
              display: { ...domain.display, visible: e.checked || false },
            })
          }
        />
        <label htmlFor="show-domain">Show Domain</label>
      </div>

      <div className="field-checkbox">
        <Checkbox
          inputId="wireframe"
          checked={domain.display.wireframe}
          onChange={(e) =>
            updateDomain({
              display: { ...domain.display, wireframe: e.checked || false },
            })
          }
        />
        <label htmlFor="wireframe">Wireframe Mode</label>
      </div>

      <div className="field-checkbox">
        <Checkbox
          inputId="show-boundaries"
          checked={domain.display.showBoundaries}
          onChange={(e) =>
            updateDomain({
              display: { ...domain.display, showBoundaries: e.checked || false },
            })
          }
        />
        <label htmlFor="show-boundaries">Show Boundaries</label>
      </div>

      <div className="field-checkbox">
        <Checkbox
          inputId="show-refinement"
          checked={domain.display.showRefinementRegions}
          onChange={(e) =>
            updateDomain({
              display: { ...domain.display, showRefinementRegions: e.checked || false },
            })
          }
        />
        <label htmlFor="show-refinement">Show Refinement Regions</label>
      </div>

      <Divider />

      <div className="field">
        <label htmlFor="domain-color">Domain Color</label>
        <div className="flex align-items-center gap-3">
          <ColorPicker
            id="domain-color"
            value={domain.display.color.replace('#', '')}
            onChange={(e) =>
              updateDomain({
                display: { ...domain.display, color: `#${e.value}` },
              })
            }
          />
          <span>{domain.display.color}</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="domain-opacity">Opacity</label>
        <Slider
          id="domain-opacity"
          value={domain.display.opacity}
          onChange={(e) =>
            updateDomain({
              display: { ...domain.display, opacity: e.value as number },
            })
          }
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <div className="text-sm text-color-secondary">{(domain.display.opacity * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
};

const ValidationPanel: React.FC = () => {
  const { validation, validateDomain } = useDomainStore();

  return (
    <div className="flex flex-column gap-3">
      <Button
        label="Run Validation"
        icon="pi pi-play"
        onClick={validateDomain}
        severity="info"
        className="w-full"
      />

      {validation && (
        <>
          <Divider />

          <div className={`alert ${validation.valid ? 'alert-success' : 'alert-danger'}`}>
            <h4>{validation.valid ? 'Domain Valid' : 'Domain Invalid'}</h4>
          </div>

          {validation.errors.length > 0 && (
            <>
              <h5>Errors</h5>
              <ul className="text-red-500">
                {validation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </>
          )}

          {validation.warnings.length > 0 && (
            <>
              <h5>Warnings</h5>
              <ul className="text-orange-500">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </>
          )}

          {validation.info && (
            <>
              <h5>Information</h5>
              <div className="text-sm">
                {validation.info.cellCount && (
                  <div>Cell Count: {validation.info.cellCount.toLocaleString()}</div>
                )}
                {validation.info.minCellSize && (
                  <div>Min Cell Size: {validation.info.minCellSize.toFixed(4)} m</div>
                )}
                {validation.info.maxCellSize && (
                  <div>Max Cell Size: {validation.info.maxCellSize.toFixed(4)} m</div>
                )}
                {validation.info.meshQuality && (
                  <div>
                    Mesh Quality:{' '}
                    <span
                      className={`font-bold ${
                        validation.info.meshQuality === 'excellent'
                          ? 'text-green-500'
                          : validation.info.meshQuality === 'good'
                          ? 'text-blue-500'
                          : validation.info.meshQuality === 'acceptable'
                          ? 'text-orange-500'
                          : 'text-red-500'
                      }`}
                    >
                      {validation.info.meshQuality.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DomainConfigPanel;