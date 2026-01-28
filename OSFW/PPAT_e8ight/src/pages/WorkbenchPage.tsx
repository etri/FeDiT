import { useCallback, useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import ViewerCanvas from '../components/viewer3d/ViewerCanvas';
import { useViewerStore } from '../components/viewer3d/hooks/useViewerStore';
import SettingsPanel from '../components/workbench/SettingsPanel';
import ProjectPanel from '../components/workbench/ProjectPanel';
import ProjectSideMenu, { type FormSection } from '../components/workbench/ProjectSideMenu';
import STLImportDialog from '../components/import/STLImportDialog';
import type { DisplaySettings } from '../components/workbench/SettingsPanel';
import useProjectStore from '../stores/projectStore';

function WorkbenchPage() {
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);
  const [projectPanelVisible, setProjectPanelVisible] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [activeSection, setActiveSection] = useState<string | undefined>(undefined);
  const dragCounterRef = useRef(0);
  const toast = useRef<Toast>(null);

  // STL Import Dialog state
  const [stlImportDialogVisible, setStlImportDialogVisible] = useState<boolean>(false);
  const [pendingSTLFile, setPendingSTLFile] = useState<File | null>(null);

  // Subscribe to project store changes
  const simulationType = useProjectStore(state => state.simulationType);

  // Subscribe to viewer store for transform mode and simulation
  const transformMode = useViewerStore(state => state.transformMode);
  const currentSimulation = useViewerStore(state => state.currentSimulation);
  const solverType = useProjectStore(state => state.solverType);
  const formData = useProjectStore(state => state.formData);

  // Watch for project changes and render visualization if applicable
  useEffect(() => {
    const loadVisualization = async () => {
      const isConcentrationDiffusion = simulationType === 'concentration_diffusion';
      const tankSolverType = solverType?.toLowerCase();
      const store = useViewerStore.getState();

      if (isConcentrationDiffusion && tankSolverType === 'lbm') {
        // Concentration Diffusion: No 3D visualization (no STL models)
        store.setSimulation(null);
        store.setTankType(null);
        console.log(`[Drei] Concentration Diffusion: LBM - No 3D visualization`);
      } else {
        // Clear simulation
        store.setSimulation(null);
        store.setDomainDimensions(null);
        store.setWaterColumnConfig(null);
        store.setTankType(null);
      }
    };

    loadVisualization();
  }, [simulationType, solverType, formData]);

  // Listen for water height changes from form
  useEffect(() => {
    const handleWaterHeightChange = (event: CustomEvent) => {
      const { waterHeight } = event.detail;

      // Update drei viewer store
      const store = useViewerStore.getState();
      store.setWaterHeight(waterHeight);
      console.log(`[Drei] Water height changed: ${waterHeight}m`);
    };

    window.addEventListener('tankWaterHeightChanged', handleWaterHeightChange as EventListener);

    return () => {
      window.removeEventListener('tankWaterHeightChanged', handleWaterHeightChange as EventListener);
    };
  }, [simulationType, solverType]);

  // Listen for tank opacity changes from form
  useEffect(() => {
    const handleTankOpacityChange = (event: CustomEvent) => {
      const { opacity } = event.detail;

      // Update drei viewer store
      const store = useViewerStore.getState();
      store.setTankOpacity(opacity);
      console.log(`[Drei] Tank opacity changed: ${opacity}`);
    };

    window.addEventListener('tankOpacityChanged', handleTankOpacityChange as EventListener);

    return () => {
      window.removeEventListener('tankOpacityChanged', handleTankOpacityChange as EventListener);
    };
  }, [simulationType]);

  // formSections가 로드되면 첫 번째 섹션을 자동으로 선택
  useEffect(() => {
    if (formSections.length > 0 && !activeSection) {
      // activeSection이 없을 때만 첫 번째 섹션으로 설정
      setActiveSection(formSections[0].key);
    }
  }, [formSections, activeSection]);

  const handleSettingsClick = () => {
    const newVisible = !sidebarVisible;
    setSidebarVisible(newVisible);
    useViewerStore.getState().setSidebarVisible(newVisible);
  };

  const handleSectionClick = (sectionKey: string) => {
    // Panel이 열려있고 같은 섹션을 클릭하면 토글 (닫기)
    if (projectPanelVisible && activeSection === sectionKey) {
      setProjectPanelVisible(false);
      // activeSection은 onHide 콜백에서 애니메이션 완료 후 제거
    }
    // Panel이 닫혀있거나 다른 섹션을 클릭하면
    else {
      // Panel이 닫혀있으면 열기
      if (!projectPanelVisible) {
        setProjectPanelVisible(true);
      }
      // 섹션 변경
      setActiveSection(sectionKey);
    }
  };

  const handleSettingsChange = (settings: DisplaySettings) => {
    const store = useViewerStore.getState();

    // Display settings
    store.setBackgroundColor(settings.backgroundColor);
    store.setShowGrid(settings.showGrid);
    store.setShowAxes(settings.showAxesHelper);
    store.setShowTriangleVectors(settings.showTriangleVectors);
    store.setVectorSettings(settings.vectorSize, settings.vectorColor);
    store.setEnableHover(settings.enableHover);
    store.setEnableSelection(settings.enableSelection);
    store.setEnableAntialiasing(settings.enableAntialiasing);

    // Edge settings
    store.setShowEdges(settings.showEdges);
    store.setShowFeatureEdges(settings.showFeatureEdges);
    store.setEdgeColor(settings.edgeColor);
    store.setEdgeThreshold(settings.edgeThreshold);

    // Render mode
    store.setRenderMode(settings.renderMode);

    // Shadow settings
    store.setShadowConfig({
      enabled: settings.shadowsEnabled,
      opacity: settings.shadowOpacity,
      scale: settings.shadowScale,
      lightPosition: [settings.shadowLightX, settings.shadowLightY, settings.shadowLightZ],
    });

    // Material settings
    store.setMaterialConfig({
      type: settings.materialType,
      transmission: settings.materialTransmission,
      thickness: settings.materialThickness,
      roughness: settings.materialRoughness,
      ior: settings.materialIor,
      chromaticAberration: settings.materialChromaticAberration,
    });

    // Lighting settings
    store.setAmbientIntensity(settings.ambientLightIntensity);
    store.setDirectionalIntensity(settings.directionalLightIntensity);
    store.setDirectionalColor(settings.directionalLightColor);
    store.setDirectionalPosition([settings.directionalLightX, settings.directionalLightY, settings.directionalLightZ]);
    store.setHemisphereIntensity(settings.hemisphereLightIntensity);
    store.setHemisphereColors(settings.hemisphereSkyColor, settings.hemisphereGroundColor);

    console.log('Settings applied to ViewerStore:', settings);
  };

  // Model import functionality (not supported in Drei viewer yet)
  const handleModelImport = useCallback(async () => {
    toast.current?.show({
      severity: 'info',
      summary: 'Not Supported',
      detail: 'Model import is not yet supported in the new viewer'
    });
  }, []);

  // File upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const store = useViewerStore.getState();
    let successCount = 0;
    let failCount = 0;

    for (const file of fileArray) {
      const fileName = file.name.toLowerCase();
      let fileType: 'stl' | 'obj' | 'gltf' | 'ply' | null = null;

      // Check file type
      if (fileName.endsWith('.stl')) {
        fileType = 'stl';
      } else if (fileName.endsWith('.obj')) {
        fileType = 'obj';
      } else if (fileName.endsWith('.gltf') || fileName.endsWith('.glb')) {
        fileType = 'gltf';
      } else if (fileName.endsWith('.ply')) {
        fileType = 'ply';
      }

      if (!fileType) {
        console.warn(`Unsupported file type: ${fileName}`);
        failCount++;
        continue;
      }

      // STL files: Open import dialog for editing
      if (fileType === 'stl') {
        setPendingSTLFile(file);
        setStlImportDialogVisible(true);
        console.log(`[Upload] STL file detected, opening import dialog: ${file.name}`);
        continue; // Don't add directly, dialog will handle it
      }

      // Other file types: Add directly
      try {
        const url = URL.createObjectURL(file);
        store.addModel({
          id: `model-${Date.now()}-${Math.random()}`,
          url: url,
          name: file.name,
          type: fileType,
          visible: true,
          color: fileType === 'gltf' ? undefined : '#cccccc',
          transparent: false,
          opacity: 1.0,
        });
        successCount++;
        console.log(`[Upload] Loaded: ${file.name}`);
      } catch (error) {
        console.error(`Failed to load ${file.name}:`, error);
        failCount++;
      }
    }

    // Show result toast (only for non-STL files)
    if (successCount > 0 && failCount === 0) {
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `${successCount} model(s) loaded successfully`,
        life: 3000
      });
    } else if (successCount > 0 && failCount > 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Partial Success',
        detail: `${successCount} succeeded, ${failCount} failed`,
        life: 4000
      });
    } else if (failCount > 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: `Failed to load ${failCount} file(s)`,
        life: 4000
      });
    }

    // Fit camera to loaded models after a short delay
    if (successCount > 0) {
      setTimeout(() => {
        const fitToBox = (window as any).dreiViewerFitToBox;
        if (fitToBox) {
          fitToBox();
          console.log('[Upload] Fit to box executed after model load');
        }
      }, 500); // 500ms delay to ensure models are fully loaded
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Drag and drop functionality
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'No Files',
        detail: 'No files were dropped'
      });
      return;
    }

    const store = useViewerStore.getState();
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      let fileType: 'stl' | 'obj' | 'gltf' | 'ply' | null = null;

      // Check file type
      if (fileName.endsWith('.stl')) {
        fileType = 'stl';
      } else if (fileName.endsWith('.obj')) {
        fileType = 'obj';
      } else if (fileName.endsWith('.gltf') || fileName.endsWith('.glb')) {
        fileType = 'gltf';
      } else if (fileName.endsWith('.ply')) {
        fileType = 'ply';
      }

      if (!fileType) {
        console.warn(`Unsupported file type: ${fileName}`);
        failCount++;
        continue;
      }

      // STL files: Open import dialog for editing
      if (fileType === 'stl') {
        setPendingSTLFile(file);
        setStlImportDialogVisible(true);
        console.log(`[Drag&Drop] STL file detected, opening import dialog: ${file.name}`);
        continue; // Don't add directly, dialog will handle it
      }

      // Other file types: Add directly
      try {
        // Create object URL for the file
        const url = URL.createObjectURL(file);

        // Add model to viewer store
        // Note: For GLTF/GLB, don't set color to preserve original textures and materials
        store.addModel({
          id: `model-${Date.now()}-${Math.random()}`,
          url: url,
          name: file.name,
          type: fileType,
          visible: true,
          color: fileType === 'gltf' ? undefined : '#cccccc', // Preserve GLTF/GLB materials, use gray for others
          transparent: false,
          opacity: 1.0,
        });

        successCount++;
        console.log(`[Drag&Drop] Loaded: ${file.name}`);
      } catch (error) {
        console.error(`Failed to load ${file.name}:`, error);
        failCount++;
      }
    }

    // Show result toast (only for non-STL files)
    if (successCount > 0 && failCount === 0) {
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `${successCount} model${successCount > 1 ? 's' : ''} loaded successfully`
      });
    } else if (successCount > 0 && failCount > 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Partial Success',
        detail: `${successCount} loaded, ${failCount} failed`
      });
    } else if (failCount > 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: 'Failed to load model files. Supported formats: STL, OBJ, GLTF, GLB, PLY'
      });
    }

    // Fit camera to loaded models after a short delay
    if (successCount > 0) {
      setTimeout(() => {
        const fitToBox = (window as any).dreiViewerFitToBox;
        if (fitToBox) {
          fitToBox();
          console.log('[Drag&Drop] Fit to box executed after model load');
        }
      }, 500); // 500ms delay to ensure models are fully loaded
    }
  }, []);

  // STL Export 핸들러
  const handleSTLExport = useCallback(async () => {
    // Use drei viewer export function
    const dreiExport = (window as any).dreiViewerExportSTL;
    if (!dreiExport) {
      toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Export function not ready' });
      return;
    }

    try {
      dreiExport();
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'STL files exported successfully'
      });
    } catch (error) {
      console.error('STL export failed:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export STL files'
      });
    }
  }, []);

  // fitToBox 핸들러
  const handleFitToBox = useCallback((_mesh?: any, _duration?: number) => {
    const dreiFitToBox = (window as any).dreiViewerFitToBox;
    if (!dreiFitToBox) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Fit-to-box function not ready'
      });
      return;
    }

    try {
      dreiFitToBox();
      toast.current?.show({
        severity: 'success',
        summary: 'Camera',
        detail: 'Camera fitted to objects'
      });
    } catch (error) {
      console.error('Fit-to-box failed:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fit camera'
      });
    }
  }, []);

  // Expose functions for Navigation component and SettingsPanel
  useEffect(() => {
    (window as any).handleModelImport = handleModelImport;
    (window as any).handleSTLExport = handleSTLExport;
    (window as any).handleFitToBox = handleFitToBox;
  }, [handleModelImport, handleSTLExport, handleFitToBox]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 3rem)",
        marginTop: "8px",
        backgroundColor: "#a8a8a8",
        overflow: "hidden",
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drei-based 3D viewer */}
      <ViewerCanvas />

      {/* Project Side Menu */}
      <ProjectSideMenu
        formSections={formSections}
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
      />

      {/* Settings Button - Hidden for Concentration Diffusion */}
      {(
        <Button
          icon={sidebarVisible ? "pi pi-angle-right" : "pi pi-cog"}
          rounded
          text
          severity="secondary"
          size="large"
          aria-label="Settings"
          onClick={handleSettingsClick}
          style={{
            position: "absolute",
            top: "1rem",
            right: sidebarVisible ? "calc(350px + 0.5rem)" : "0.5rem",
            zIndex: 1000,
            width: "3.0rem",
            height: "3.0rem",
            fontSize: "1.5rem",
            transition: "right 0.3s ease-in-out",
          }}
          tooltip={sidebarVisible ? "Close Settings" : "Settings"}
          tooltipOptions={{ position: "left" }}
        />
      )}

      {/* Upload Model Button - Hidden when simulation is selected */}
      {!currentSimulation && (
        <Button
          icon="pi pi-upload"
          rounded
          text
          severity="info"
          size="large"
          aria-label="Upload Model"
          onClick={handleUploadClick}
          style={{
            position: "absolute",
            top: "5rem",
            right: sidebarVisible ? "calc(350px + 0.5rem)" : "0.5rem",
            zIndex: 1000,
            width: "3.0rem",
            height: "3.0rem",
            fontSize: "1.5rem",
            transition: "right 0.3s ease-in-out",
          }}
          tooltip="Upload Model (STL, OBJ, GLTF, PLY)"
          tooltipOptions={{ position: "left" }}
        />
      )}

      {/* Transform Controls Toggle Button - Hidden when simulation is selected */}
      {!currentSimulation && (
        <Button
          icon="pi pi-arrows-alt"
          rounded
          text
          severity={transformMode ? "success" : "secondary"}
          size="large"
          aria-label="Transform Controls"
          onClick={() => {
            const store = useViewerStore.getState();
            const models = store.models;
            if (models.length > 0) {
              // Select first model if none selected
              if (!store.selectedModelId) {
                store.setSelectedModelId(models[0].id);
              }
              // Toggle transform mode - use current store value
              const currentTransformMode = store.transformMode;
              store.setTransformMode(currentTransformMode ? null : 'translate');
              console.log('[WorkbenchPage] Transform button clicked:', {
                before: currentTransformMode,
                after: currentTransformMode ? null : 'translate'
              });
            }
          }}
          style={{
            position: "absolute",
            top: "7rem",
            right: sidebarVisible ? "calc(350px + 0.5rem)" : "0.5rem",
            zIndex: 1000,
            width: "3.0rem",
            height: "3.0rem",
            fontSize: "1.5rem",
            transition: "right 0.3s ease-in-out",
          }}
          tooltip="Transform Model"
          tooltipOptions={{ position: "left" }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj,.gltf,.glb,.ply"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Project Panel */}
      <ProjectPanel
        visible={projectPanelVisible}
        onHide={() => {
          setProjectPanelVisible(false);
          setActiveSection(undefined); // 애니메이션 완료 후 cleanup
        }}
        activeSection={activeSection}
        onFormSectionsChange={setFormSections}
      />

      {/* Settings Panel - Hidden for Concentration Diffusion */}
      {(
        <SettingsPanel
          visible={sidebarVisible}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            border: "3px dashed #007bff",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 123, 255, 0.9)",
              color: "white",
              padding: "2rem",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            <i
              className="pi pi-cloud-upload"
              style={{
                fontSize: "3rem",
                display: "block",
                marginBottom: "1rem",
              }}
            ></i>
            Drop 3D model file here
            <div
              style={{
                fontSize: "0.9rem",
                marginTop: "0.5rem",
                opacity: 0.8,
              }}
            >
              Supports: .gltf, .glb, .obj, .stl, .ply
            </div>
          </div>
        </div>
      )}

      {/* Toast for notifications */}
      <Toast ref={toast} />

      {/* STL Import Dialog */}
      <STLImportDialog
        visible={stlImportDialogVisible}
        onHide={() => {
          setStlImportDialogVisible(false);
          setPendingSTLFile(null);
        }}
        file={pendingSTLFile}
      />
    </div>
  );
}

export default WorkbenchPage;
