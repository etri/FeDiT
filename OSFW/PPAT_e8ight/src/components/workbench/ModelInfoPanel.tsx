/**
 * @file ModelInfoPanel.tsx
 * @description Panel displaying loaded 3D model information including bounding boxes
 */

import { Card } from 'primereact/card';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { useState, useEffect, useCallback } from 'react';
import { useViewerStore } from '../viewer3d/hooks/useViewerStore';
import CropModal from '../crop/CropModal';
import type { ModelData } from '../viewer3d/types/viewer.types';

function ModelInfoPanel() {
  const models = useViewerStore((state) => state.models);
  const setDomainDimensions = useViewerStore((state) => state.setDomainDimensions);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [selectedModelForCrop, setSelectedModelForCrop] = useState<ModelData | null>(null);

  // Domain settings per model (using model ID as key)
  const [domainSettings, setDomainSettings] = useState<Record<string, {
    upstream: number;
    downstream: number;
    lateralRatio: number;
  }>>({});

  // Get domain settings for a specific model (with defaults)
  const getDomainSettings = (modelId: string) => {
    return domainSettings[modelId] || {
      upstream: 5,
      downstream: 15,
      lateralRatio: 1.5
    };
  };

  // Update domain settings for a specific model
  const updateDomainSettings = (
    modelId: string,
    field: 'upstream' | 'downstream' | 'lateralRatio',
    value: number | null | undefined
  ) => {
    setDomainSettings((prev) => ({
      ...prev,
      [modelId]: {
        ...getDomainSettings(modelId),
        [field]: value ?? 0,
      },
    }));
  };

  // Core domain calculation logic (extracted for reuse)
  const calculateDomain = useCallback((model: ModelData, settings: { upstream: number; downstream: number; lateralRatio: number }) => {
    if (!model.boundingBox) return null;

    const bbox = model.boundingBox;

    // Get model dimensions (X, Y, Z)
    const sizeX = bbox.size.x;
    const sizeY = bbox.size.y;
    const sizeZ = bbox.size.z;

    // Find longest, middle, and shortest dimensions
    const dimensions = [
      { axis: 'X', size: sizeX },
      { axis: 'Y', size: sizeY },
      { axis: 'Z', size: sizeZ },
    ].sort((a, b) => b.size - a.size); // Sort descending

    // Auto-detect vehicle orientation
    const modelLength = dimensions[0].size;  // Longest = front-back (length)
    const modelWidth = dimensions[1].size;   // Middle = left-right (width)
    const modelHeight = dimensions[2].size;  // Shortest = up-down (height)

    console.log('[ModelInfoPanel] Auto-detected vehicle orientation:', {
      length: `${dimensions[0].axis}-axis (${modelLength.toFixed(4)}m)`,
      width: `${dimensions[1].axis}-axis (${modelWidth.toFixed(4)}m)`,
      height: `${dimensions[2].axis}-axis (${modelHeight.toFixed(4)}m)`,
    });

    // Calculate domain dimensions based on vehicle orientation
    // The domain will be aligned with the original axes, but sized based on detected orientation
    // Total length along longest axis: upstream + model length + downstream
    const totalLength = modelLength * settings.upstream + modelLength + modelLength * settings.downstream;

    // Map back to X, Y, Z based on which axis is longest
    let width, height, depth;

    if (dimensions[0].axis === 'X') {
      // X is longest (front-back)
      width = totalLength;  // X = length direction
      depth = modelWidth * settings.lateralRatio;   // Z = width direction
      height = modelHeight * settings.lateralRatio; // Y = height direction
    } else if (dimensions[0].axis === 'Y') {
      // Y is longest (front-back)
      width = modelWidth * settings.lateralRatio;   // X = width direction
      height = totalLength;  // Y = length direction
      depth = modelHeight * settings.lateralRatio;  // Z = height direction
    } else {
      // Z is longest (front-back) - traditional case
      width = modelWidth * settings.lateralRatio;   // X = width direction
      height = modelHeight * settings.lateralRatio; // Y = height direction
      depth = totalLength;  // Z = length direction
    }

    // Calculate center position - always centered on model
    const centerX = (bbox.min[0] + bbox.max[0]) / 2;
    const centerY = (bbox.min[1] + bbox.max[1]) / 2;
    const centerZ = (bbox.min[2] + bbox.max[2]) / 2;

    // Set domain dimensions
    setDomainDimensions({
      width,
      height,
      depth,
      centerX,
      centerY,
      centerZ,
    });

    return {
      width,
      height,
      depth,
      centerX,
      centerY,
      centerZ,
      detectedOrientation: {
        lengthAxis: dimensions[0].axis,
        widthAxis: dimensions[1].axis,
        heightAxis: dimensions[2].axis,
      },
      modelDimensions: {
        length: modelLength,
        width: modelWidth,
        height: modelHeight,
      },
    };
  }, []);

  // Handler to create domain from model bounding box with custom settings
  const handleSetDomain = useCallback((model: ModelData) => {
    if (!model.boundingBox) return;

    const settings = getDomainSettings(model.id);
    const result = calculateDomain(model, settings);

    if (!result) return;

    // Set domain dimensions
    setDomainDimensions({
      width: result.width,
      height: result.height,
      depth: result.depth,
      centerX: result.centerX,
      centerY: result.centerY,
      centerZ: result.centerZ,
    });

    console.log('[ModelInfoPanel] Domain set from model:', model.name, {
      detectedOrientation: {
        lengthAxis: `${result.detectedOrientation.lengthAxis} (${result.modelDimensions.length.toFixed(4)}m)`,
        widthAxis: `${result.detectedOrientation.widthAxis} (${result.modelDimensions.width.toFixed(4)}m)`,
        heightAxis: `${result.detectedOrientation.heightAxis} (${result.modelDimensions.height.toFixed(4)}m)`,
      },
      modelDimensions: {
        length: result.modelDimensions.length.toFixed(4),
        width: result.modelDimensions.width.toFixed(4),
        height: result.modelDimensions.height.toFixed(4),
      },
      domainDimensions: {
        width: result.width.toFixed(4),
        height: result.height.toFixed(4),
        depth: result.depth.toFixed(4),
      },
      center: [result.centerX.toFixed(4), result.centerY.toFixed(4), result.centerZ.toFixed(4)],
      settings: {
        upstream: `${settings.upstream}L`,
        downstream: `${settings.downstream}L`,
        lateralRatio: `${settings.lateralRatio}x`,
      },
    });
  }, [calculateDomain, setDomainDimensions, domainSettings]);

  // Auto-generate domain when model is loaded
  useEffect(() => {
    // Find models with bounding box but no domain set yet
    const modelsWithBounds = models.filter((model) => model.boundingBox);

    if (modelsWithBounds.length > 0) {
      // Auto-generate domain for the first model with bounding box
      const firstModel = modelsWithBounds[0];

      // Auto-generate domain
      const settings = getDomainSettings(firstModel.id);
      const result = calculateDomain(firstModel, settings);

      if (result) {
        setDomainDimensions({
          width: result.width,
          height: result.height,
          depth: result.depth,
          centerX: result.centerX,
          centerY: result.centerY,
          centerZ: result.centerZ,
        });

        console.log('[ModelInfoPanel] Auto-generated domain for:', firstModel.name);
      }
    }
  }, [models, calculateDomain, setDomainDimensions, domainSettings]);

  // Filter models that have bounding box data
  const modelsWithBounds = models.filter((model) => model.boundingBox);

  if (modelsWithBounds.length === 0) {
    return (
      <Card
        title="Model Information"
        className="mb-3"
        style={{ fontSize: '0.9rem' }}
      >
        <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
          No models loaded
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Model Information"
      className="mb-3"
      style={{ fontSize: '0.9rem' }}
    >
      <Accordion>
        {modelsWithBounds.map((model) => (
          <AccordionTab
            key={model.id}
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i
                  className="pi pi-box"
                  style={{
                    color: model.visible ? '#2196f3' : '#999',
                    fontSize: '0.9rem',
                  }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {model.name}
                </span>
              </div>
            }
          >
            {model.boundingBox && (
              <div style={{ fontSize: '0.8rem' }}>
                <div className="mb-2">
                  <strong style={{ color: '#666' }}>Min (X, Y, Z):</strong>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      marginTop: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    ({model.boundingBox.min[0].toFixed(4)},{' '}
                    {model.boundingBox.min[1].toFixed(4)},{' '}
                    {model.boundingBox.min[2].toFixed(4)})
                  </div>
                </div>
                <div className="mb-2">
                  <strong style={{ color: '#666' }}>Max (X, Y, Z):</strong>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      marginTop: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    ({model.boundingBox.max[0].toFixed(4)},{' '}
                    {model.boundingBox.max[1].toFixed(4)},{' '}
                    {model.boundingBox.max[2].toFixed(4)})
                  </div>
                </div>
                <div className="mb-2">
                  <strong style={{ color: '#666' }}>Size (X, Y, Z):</strong>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      marginTop: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    ({model.boundingBox.size.x.toFixed(4)},{' '}
                    {model.boundingBox.size.y.toFixed(4)},{' '}
                    {model.boundingBox.size.z.toFixed(4)})
                  </div>
                  {/* Show detected longest axis */}
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#2196f3',
                      marginTop: '0.25rem',
                      fontStyle: 'italic',
                    }}
                  >
                    Longest: {
                      [
                        { axis: 'X', size: model.boundingBox.size.x },
                        { axis: 'Y', size: model.boundingBox.size.y },
                        { axis: 'Z', size: model.boundingBox.size.z },
                      ].sort((a, b) => b.size - a.size)[0].axis
                    }-axis → Front-Back direction
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#999' }}>Type:</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: 500 }}>
                      {model.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#999' }}>Visible:</span>
                    <span style={{ fontWeight: 500 }}>
                      {model.visible ? 'Yes' : 'No'}
                    </span>
                  </div>

                  {/* Domain Configuration */}
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#666', fontSize: '0.75rem' }}>
                        Domain Settings
                      </strong>
                    </div>

                    {/* Upstream (Front) */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label
                        htmlFor={`upstream-${model.id}`}
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: '#999',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Upstream (× Length):
                      </label>
                      <InputNumber
                        inputId={`upstream-${model.id}`}
                        value={getDomainSettings(model.id).upstream}
                        onValueChange={(e) => updateDomainSettings(model.id, 'upstream', e.value)}
                        min={1}
                        max={20}
                        step={0.5}
                        showButtons
                        buttonLayout="horizontal"
                        inputStyle={{ fontSize: '0.75rem', padding: '0.3rem' }}
                        className="w-full"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                      />
                    </div>

                    {/* Downstream (Rear) */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label
                        htmlFor={`downstream-${model.id}`}
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: '#999',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Downstream (× Length):
                      </label>
                      <InputNumber
                        inputId={`downstream-${model.id}`}
                        value={getDomainSettings(model.id).downstream}
                        onValueChange={(e) => updateDomainSettings(model.id, 'downstream', e.value)}
                        min={1}
                        max={30}
                        step={0.5}
                        showButtons
                        buttonLayout="horizontal"
                        inputStyle={{ fontSize: '0.75rem', padding: '0.3rem' }}
                        className="w-full"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                      />
                    </div>

                    {/* Lateral Ratio (Left-Right) */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label
                        htmlFor={`lateral-${model.id}`}
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: '#999',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Lateral Ratio (× Width):
                      </label>
                      <InputNumber
                        inputId={`lateral-${model.id}`}
                        value={getDomainSettings(model.id).lateralRatio}
                        onValueChange={(e) => updateDomainSettings(model.id, 'lateralRatio', e.value)}
                        min={1}
                        max={5}
                        step={0.1}
                        showButtons
                        buttonLayout="horizontal"
                        inputStyle={{ fontSize: '0.75rem', padding: '0.3rem' }}
                        className="w-full"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                      />
                    </div>

                    {/* Set Domain Button */}
                    <Button
                      label="Set Domain"
                      icon="pi pi-cube"
                      size="small"
                      severity="success"
                      onClick={() => handleSetDomain(model)}
                      style={{
                        width: '100%',
                        fontSize: '0.75rem',
                        padding: '0.4rem',
                        marginBottom: '0.5rem',
                      }}
                    />

                    {/* Crop Button */}
                    <Button
                      label="크롭"
                      icon="pi pi-crop"
                      size="small"
                      severity="info"
                      onClick={() => {
                        setSelectedModelForCrop(model);
                        setCropModalVisible(true);
                      }}
                      style={{
                        width: '100%',
                        fontSize: '0.75rem',
                        padding: '0.4rem',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </AccordionTab>
        ))}
      </Accordion>

      {/* Crop Modal */}
      <CropModal
        visible={cropModalVisible}
        onHide={() => {
          setCropModalVisible(false);
          setSelectedModelForCrop(null);
        }}
        modelData={selectedModelForCrop}
      />
    </Card>
  );
}

export default ModelInfoPanel;
