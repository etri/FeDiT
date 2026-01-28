import { ColorPicker } from 'primereact/colorpicker';
import { InputSwitch } from 'primereact/inputswitch';
import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { FloatLabel } from 'primereact/floatlabel';
import { Dropdown } from 'primereact/dropdown';
import { useState, useEffect, useRef } from 'react';
import '../../styles/settings-panel.css';
import type { RenderMode } from '../viewer3d/types/viewer.types';

interface SettingsPanelProps {
  visible: boolean;
  onSettingsChange: (settings: DisplaySettings) => void;
}

export interface DisplaySettings {
  backgroundColor: string;
  showGrid: boolean;
  showAxesHelper: boolean;
  showTriangleVectors: boolean;
  vectorSize: number;
  vectorColor: string;
  // 인터랙션 설정
  enableHover: boolean;
  enableSelection: boolean;
  // 렌더링 설정
  enableAntialiasing: boolean;
  // Edge 설정
  showEdges: boolean;
  showFeatureEdges: boolean;
  edgeColor: string;
  edgeThreshold: number;
  renderMode: RenderMode;
  // Shadow 설정
  shadowsEnabled: boolean;
  shadowOpacity: number;
  shadowScale: number;
  shadowLightX: number;
  shadowLightY: number;
  shadowLightZ: number;
  // Material 설정 (물 전용)
  materialType: 'standard' | 'transmission';
  materialTransmission: number;
  materialThickness: number;
  materialRoughness: number;
  materialIor: number;
  materialChromaticAberration: number;
  // 조명 설정
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  directionalLightColor: string;
  directionalLightX: number;
  directionalLightY: number;
  directionalLightZ: number;
  hemisphereLightIntensity: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  visible,
  onSettingsChange
}) => {
  const [backgroundColor, setBackgroundColor] = useState<string>('a8a8a8');
  const [showGrid, setShowGrid] = useState<boolean>(false);  // Grid 기본값 OFF
  const [showAxesHelper, setShowAxesHelper] = useState<boolean>(false);
  const [showTriangleVectors, setShowTriangleVectors] = useState<boolean>(false);
  const [vectorSize, setVectorSize] = useState<number>(1.0);
  const [vectorColor, setVectorColor] = useState<string>('00ff00');

  // 인터랙션 관련 상태
  const [enableHover, setEnableHover] = useState<boolean>(false);  // Hover 기본값 OFF
  const [enableSelection, setEnableSelection] = useState<boolean>(false);  // Selection 기본값 OFF

  // 렌더링 관련 상태
  const [enableAntialiasing, setEnableAntialiasing] = useState<boolean>(true);  // Antialiasing 기본값 ON

  // Edge 관련 상태
  const [showEdges, setShowEdges] = useState<boolean>(false);  // Edges 기본값 OFF
  const [showFeatureEdges, setShowFeatureEdges] = useState<boolean>(false);  // Feature Edges 기본값 OFF
  const [edgeColor, setEdgeColor] = useState<string>('000000');
  const [edgeThreshold, setEdgeThreshold] = useState<number>(30);  // degrees

  // Render mode 상태
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');

  // Shadow 관련 상태
  const [shadowsEnabled, setShadowsEnabled] = useState<boolean>(true);  // Shadows 기본값 ON
  const [shadowOpacity, setShadowOpacity] = useState<number>(1.0);
  const [shadowScale, setShadowScale] = useState<number>(10);
  const [shadowLightX, setShadowLightX] = useState<number>(5);
  const [shadowLightY, setShadowLightY] = useState<number>(5);
  const [shadowLightZ, setShadowLightZ] = useState<number>(-10);

  // Material 관련 상태 (물 전용)
  const [materialType, setMaterialType] = useState<'standard' | 'transmission'>('transmission');
  const [materialTransmission, setMaterialTransmission] = useState<number>(1.0);
  const [materialThickness, setMaterialThickness] = useState<number>(0.5);
  const [materialRoughness, setMaterialRoughness] = useState<number>(0.0); // Smooth water
  const [materialIor, setMaterialIor] = useState<number>(1.33); // Water IOR
  const [materialChromaticAberration, setMaterialChromaticAberration] = useState<number>(0.03);

  // Render mode options
  const renderModeOptions = [
    { label: 'Solid', value: 'solid' },
    { label: 'Wireframe', value: 'wireframe' },
    { label: 'Points', value: 'points' },
    { label: 'Solid + Edges', value: 'solid+edges' },
    { label: 'Solid + Wireframe', value: 'solid+wireframe' },
    { label: 'Hidden Edges', value: 'hidden-edges' }
  ];

  // 조명 관련 상태
  const [ambientLightIntensity, setAmbientLightIntensity] = useState<number>(1.0);
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState<number>(1.0);
  const [directionalLightColor, setDirectionalLightColor] = useState<string>('ffffff');
  const [directionalLightX, setDirectionalLightX] = useState<number>(100);
  const [directionalLightY, setDirectionalLightY] = useState<number>(100);
  const [directionalLightZ, setDirectionalLightZ] = useState<number>(50);
  const [hemisphereLightIntensity, setHemisphereLightIntensity] = useState<number>(0.3);
  const [hemisphereSkyColor, setHemisphereSkyColor] = useState<string>('ffffff');
  const [hemisphereGroundColor, setHemisphereGroundColor] = useState<string>('444444');

  // 카메라 컨트롤 관련 상태
  const [cameraPositionX, setCameraPositionX] = useState<number>(0.1);
  const [cameraPositionY, setCameraPositionY] = useState<number>(0.15);
  const [cameraPositionZ, setCameraPositionZ] = useState<number>(-0.1);
  const [cameraTargetX, setCameraTargetX] = useState<number>(0);
  const [cameraTargetY, setCameraTargetY] = useState<number>(0.03);
  const [cameraTargetZ, setCameraTargetZ] = useState<number>(0);

  // Toast ref
  const toast = useRef<Toast>(null);

  // Accordion 활성 인덱스 관리 (초기에는 접힌 상태)
  const [activeIndex, setActiveIndex] = useState<number | number[] | null>(null);

  // 초기 설정을 뷰어에 적용
  useEffect(() => {
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  }, []); // 컴포넌트 마운트 시에만 실행

  const handleBackgroundColorChange = (e: any) => {
    const color = e.value as string;
    setBackgroundColor(color);
    onSettingsChange({
      backgroundColor: `#${color}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleGridChange = (value: boolean) => {
    setShowGrid(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid: value,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleAxesHelperChange = (value: boolean) => {
    setShowAxesHelper(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper: value,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleTriangleVectorsChange = (value: boolean) => {
    setShowTriangleVectors(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors: value,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleVectorSizeChange = (value: number) => {
    setVectorSize(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize: value,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleVectorColorChange = (e: any) => {
    const color = e.value as string;
    setVectorColor(color);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${color}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleEnableHoverChange = (value: boolean) => {
    setEnableHover(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover: value,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleEnableSelectionChange = (value: boolean) => {
    setEnableSelection(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection: value,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleEnableAntialiasingChange = (value: boolean) => {
    setEnableAntialiasing(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing: value,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  // Edge 관련 핸들러들
  const handleShowEdgesChange = (value: boolean) => {
    setShowEdges(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges: value,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleShowFeatureEdgesChange = (value: boolean) => {
    setShowFeatureEdges(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges: value,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleEdgeColorChange = (e: any) => {
    const color = e.value as string;
    setEdgeColor(color);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${color}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleEdgeThresholdChange = (value: number) => {
    setEdgeThreshold(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold: value,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleRenderModeChange = (value: RenderMode) => {
    setRenderMode(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode: value,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  // 조명 관련 핸들러들
  const handleAmbientLightIntensityChange = (value: number) => {
    setAmbientLightIntensity(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity: value,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleDirectionalLightIntensityChange = (value: number) => {
    setDirectionalLightIntensity(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity: value,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleDirectionalLightColorChange = (e: any) => {
    const color = e.value as string;
    setDirectionalLightColor(color);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${color}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleDirectionalLightXChange = (value: number) => {
    setDirectionalLightX(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX: value,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleDirectionalLightYChange = (value: number) => {
    setDirectionalLightY(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY: value,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleDirectionalLightZChange = (value: number) => {
    setDirectionalLightZ(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ: value,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleHemisphereLightIntensityChange = (value: number) => {
    setHemisphereLightIntensity(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity: value,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleHemisphereSkyColorChange = (e: any) => {
    const color = e.value as string;
    setHemisphereSkyColor(color);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${color}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleHemisphereGroundColorChange = (e: any) => {
    const color = e.value as string;
    setHemisphereGroundColor(color);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${color}`
    });
  };

  // Shadow 관련 핸들러들
  const handleShadowsEnabledChange = (value: boolean) => {
    setShadowsEnabled(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled: value,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleShadowOpacityChange = (value: number) => {
    setShadowOpacity(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity: value,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleShadowScaleChange = (value: number) => {
    setShadowScale(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale: value,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleShadowLightXChange = (value: number) => {
    setShadowLightX(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX: value,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleShadowLightYChange = (value: number) => {
    setShadowLightY(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY: value,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleShadowLightZChange = (value: number) => {
    setShadowLightZ(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ: value,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  // Material 관련 핸들러들 (물 전용)
  const handleMaterialTypeChange = (value: 'standard' | 'transmission') => {
    setMaterialType(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType: value,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleMaterialTransmissionChange = (value: number) => {
    setMaterialTransmission(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission: value,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleMaterialThicknessChange = (value: number) => {
    setMaterialThickness(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness: value,
      materialRoughness,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleMaterialRoughnessChange = (value: number) => {
    setMaterialRoughness(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness: value,
      materialIor,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleMaterialIorChange = (value: number) => {
    setMaterialIor(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor: value,
      materialChromaticAberration,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  const handleMaterialChromaticAberrationChange = (value: number) => {
    setMaterialChromaticAberration(value);
    onSettingsChange({
      backgroundColor: `#${backgroundColor}`,
      showGrid,
      showAxesHelper,
      showTriangleVectors,
      vectorSize,
      vectorColor: `#${vectorColor}`,
      enableHover,
      enableSelection,
      enableAntialiasing,
      showEdges,
      showFeatureEdges,
      edgeColor: `#${edgeColor}`,
      edgeThreshold,
      renderMode,
      shadowsEnabled,
      shadowOpacity,
      shadowScale,
      shadowLightX,
      shadowLightY,
      shadowLightZ,
      materialType,
      materialTransmission,
      materialThickness,
      materialRoughness,
      materialIor,
      materialChromaticAberration: value,
      ambientLightIntensity,
      directionalLightIntensity,
      directionalLightColor: `#${directionalLightColor}`,
      directionalLightX,
      directionalLightY,
      directionalLightZ,
      hemisphereLightIntensity,
      hemisphereSkyColor: `#${hemisphereSkyColor}`,
      hemisphereGroundColor: `#${hemisphereGroundColor}`
    });
  };

  // 카메라 컨트롤 핸들러들
  const handleFitToBox = () => {
    const fitToBoxFn = (window as any).handleFitToBox;
    if (fitToBoxFn) {
      fitToBoxFn();
    } else {
      toast.current?.show({
        severity: 'warn',
        summary: '경고',
        detail: 'Viewer가 준비되지 않았습니다.',
        life: 3000
      });
    }
  };

  const handleMoveTo = () => {
    // Move camera to specified position
    const viewer = (window as any).viewer;
    if (viewer) {
      viewer._camera.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
      viewer.controls.update();
      viewer.render();
      toast.current?.show({
        severity: 'success',
        summary: '카메라',
        detail: '카메라를 지정된 위치로 이동했습니다.',
        life: 2000
      });
    } else {
      toast.current?.show({
        severity: 'warn',
        summary: '경고',
        detail: 'Viewer가 준비되지 않았습니다.',
        life: 3000
      });
    }
  };

  const handleSetPosition = () => {
    // Set camera position instantly
    const viewer = (window as any).viewer;
    if (viewer) {
      // Get current camera position
      const pos = viewer._camera.position;
      setCameraPositionX(Number(pos.x.toFixed(3)));
      setCameraPositionY(Number(pos.y.toFixed(3)));
      setCameraPositionZ(Number(pos.z.toFixed(3)));
      toast.current?.show({
        severity: 'info',
        summary: '카메라',
        detail: '현재 카메라 위치를 저장했습니다.',
        life: 2000
      });
    } else {
      toast.current?.show({
        severity: 'warn',
        summary: '경고',
        detail: 'Viewer가 준비되지 않았습니다.',
        life: 3000
      });
    }
  };

  const handleSetTarget = () => {
    // Set camera target from current controls target
    const viewer = (window as any).viewer;
    if (viewer) {
      const target = viewer.controls.target;
      setCameraTargetX(Number(target.x.toFixed(3)));
      setCameraTargetY(Number(target.y.toFixed(3)));
      setCameraTargetZ(Number(target.z.toFixed(3)));
      toast.current?.show({
        severity: 'info',
        summary: '카메라',
        detail: '현재 카메라 타겟을 저장했습니다.',
        life: 2000
      });
    } else {
      toast.current?.show({
        severity: 'warn',
        summary: '경고',
        detail: 'Viewer가 준비되지 않았습니다.',
        life: 3000
      });
    }
  };

  const handleSetLookAt = () => {
    // Apply camera target
    const viewer = (window as any).viewer;
    if (viewer) {
      viewer.controls.target.set(cameraTargetX, cameraTargetY, cameraTargetZ);
      viewer._camera.lookAt(viewer.controls.target);
      viewer.controls.update();
      viewer.render();
      toast.current?.show({
        severity: 'success',
        summary: '카메라',
        detail: '카메라 타겟을 적용했습니다.',
        life: 2000
      });
    } else {
      toast.current?.show({
        severity: 'warn',
        summary: '경고',
        detail: 'Viewer가 준비되지 않았습니다.',
        life: 3000
      });
    }
  };



  return (
    <div className={`settings-panel ${visible ? 'visible' : ''}`}>
      <div className="settings-panel-header">
        <h3>Settings</h3>
      </div>

      <div className="settings-panel-content">
        <Accordion
          multiple={true}
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          {/* Display Settings */}
          <AccordionTab
            header={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-palette"></i>
                <span>Display Settings</span>
              </div>
            }
          >
            <div className="accordion-content">
              {/* Background Color */}
              <div className="settings-item horizontal">
                <label className="settings-label">Background Color</label>
                <ColorPicker
                  value={backgroundColor}
                  onChange={handleBackgroundColorChange}
                  format="hex"
                />
              </div>

              {/* Grid */}
              <div className="settings-item horizontal">
                <label className="settings-label">Grid</label>
                <InputSwitch
                  checked={showGrid}
                  onChange={(e) => handleGridChange(e.value ?? false)}
                />
              </div>

              {/* Grid Configuration - shown only when grid is enabled */}
              {showGrid && (
                <div className="grid-config mt-2 p-2" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', marginBottom: '8px', color: '#999' }}>Grid Configuration</div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', display: 'block' }}>Cell Size (m)</label>
                      <InputNumber
                        value={0.01}
                        min={0.001}
                        max={1}
                        step={0.001}
                        showButtons={false}
                        disabled
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', display: 'block' }}>Section Size (m)</label>
                      <InputNumber
                        value={0.1}
                        min={0.01}
                        max={10}
                        step={0.01}
                        showButtons={false}
                        disabled
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
                    1cm cells, 10cm sections - optimized for CFD
                  </div>
                </div>
              )}

              {/* Axes Helper */}
              <div className="settings-item horizontal">
                <label className="settings-label">Axes Helper</label>
                <InputSwitch
                  checked={showAxesHelper}
                  onChange={(e) => handleAxesHelperChange(e.value ?? false)}
                />
              </div>

              {/* Model Hover */}
              <div className="settings-item horizontal">
                <label className="settings-label">Model Hover</label>
                <InputSwitch
                  checked={enableHover}
                  onChange={(e) => handleEnableHoverChange(e.value ?? false)}
                />
              </div>

              {/* Model Selection */}
              <div className="settings-item horizontal">
                <label className="settings-label">Model Selection</label>
                <InputSwitch
                  checked={enableSelection}
                  onChange={(e) => handleEnableSelectionChange(e.value ?? false)}
                />
              </div>

              {/* Antialiasing */}
              <div className="settings-item horizontal">
                <label className="settings-label">Antialiasing</label>
                <InputSwitch
                  checked={enableAntialiasing}
                  onChange={(e) => handleEnableAntialiasingChange(e.value ?? false)}
                />
              </div>

              {/* Render Mode */}
              <div className="settings-item vertical" style={{ marginTop: '1rem' }}>
                <label className="settings-label">Render Mode</label>
                <Dropdown
                  value={renderMode}
                  options={renderModeOptions}
                  onChange={(e) => handleRenderModeChange(e.value)}
                  placeholder="Select Render Mode"
                  className="w-full"
                />
              </div>

              {/* Show Edges */}
              <div className="settings-item horizontal">
                <label className="settings-label">Show Edges</label>
                <InputSwitch
                  checked={showEdges}
                  onChange={(e) => handleShowEdgesChange(e.value ?? false)}
                />
              </div>

              {/* Show Feature Edges */}
              <div className="settings-item horizontal">
                <label className="settings-label">Show Feature Edges</label>
                <InputSwitch
                  checked={showFeatureEdges}
                  onChange={(e) => handleShowFeatureEdgesChange(e.value ?? false)}
                />
              </div>

              {/* Edge controls - only show when edges are enabled */}
              {(showEdges || showFeatureEdges) && (
                <div className="edge-controls mt-3">
                  <div className="control-item">
                    <label className="settings-label">Edge Color</label>
                    <ColorPicker
                      value={edgeColor}
                      onChange={handleEdgeColorChange}
                      format="hex"
                    />
                  </div>
                  {showFeatureEdges && (
                    <div className="control-item mt-2">
                      <label className="settings-label">Feature Angle (degrees)</label>
                      <InputNumber
                        value={edgeThreshold}
                        onValueChange={(e) => handleEdgeThresholdChange(e.value ?? 30)}
                        min={0}
                        max={180}
                        step={5}
                        showButtons={false}
                        style={{ width: '60px', marginBottom: '8px' }}
                      />
                      <Slider
                        value={edgeThreshold}
                        onChange={(e) => handleEdgeThresholdChange(e.value as number)}
                        min={0}
                        max={180}
                        step={5}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Shadows */}
              <div className="settings-item horizontal">
                <label className="settings-label">Shadows</label>
                <InputSwitch
                  checked={shadowsEnabled}
                  onChange={(e) => handleShadowsEnabledChange(e.value ?? false)}
                />
              </div>

              {/* Shadow controls - only show when shadows are enabled */}
              {shadowsEnabled && (
                <div className="shadow-controls mt-3">
                  <div className="control-item">
                    <label className="settings-label">Shadow Opacity</label>
                    <InputNumber
                      value={shadowOpacity}
                      onValueChange={(e) => handleShadowOpacityChange(e.value ?? 1.0)}
                      min={0.0}
                      max={1.0}
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      step={0.1}
                      showButtons={false}
                      style={{ width: '60px', marginBottom: '8px' }}
                    />
                    <Slider
                      value={shadowOpacity}
                      onChange={(e) => handleShadowOpacityChange(e.value as number)}
                      min={0.0}
                      max={1.0}
                      step={0.1}
                    />
                  </div>
                  <div className="control-item mt-2">
                    <label className="settings-label">Shadow Scale</label>
                    <InputNumber
                      value={shadowScale}
                      onValueChange={(e) => handleShadowScaleChange(e.value ?? 10)}
                      min={1}
                      max={50}
                      step={1}
                      showButtons={false}
                      style={{ width: '60px', marginBottom: '8px' }}
                    />
                    <Slider
                      value={shadowScale}
                      onChange={(e) => handleShadowScaleChange(e.value as number)}
                      min={1}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div className="control-item mt-2">
                    <label className="settings-label">Light Position X</label>
                    <InputNumber
                      value={shadowLightX}
                      onValueChange={(e) => handleShadowLightXChange(e.value ?? 5)}
                      min={-20}
                      max={20}
                      step={0.5}
                      showButtons={false}
                      style={{ width: '60px', marginBottom: '8px' }}
                    />
                    <Slider
                      value={shadowLightX}
                      onChange={(e) => handleShadowLightXChange(e.value as number)}
                      min={-20}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <div className="control-item mt-2">
                    <label className="settings-label">Light Position Y</label>
                    <InputNumber
                      value={shadowLightY}
                      onValueChange={(e) => handleShadowLightYChange(e.value ?? 5)}
                      min={0}
                      max={20}
                      step={0.5}
                      showButtons={false}
                      style={{ width: '60px', marginBottom: '8px' }}
                    />
                    <Slider
                      value={shadowLightY}
                      onChange={(e) => handleShadowLightYChange(e.value as number)}
                      min={0}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <div className="control-item mt-2">
                    <label className="settings-label">Light Position Z</label>
                    <InputNumber
                      value={shadowLightZ}
                      onValueChange={(e) => handleShadowLightZChange(e.value ?? -10)}
                      min={-20}
                      max={20}
                      step={0.5}
                      showButtons={false}
                      style={{ width: '60px', marginBottom: '8px' }}
                    />
                    <Slider
                      value={shadowLightZ}
                      onChange={(e) => handleShadowLightZChange(e.value as number)}
                      min={-20}
                      max={20}
                      step={0.5}
                    />
                  </div>
                </div>
              )}

              {/* Material Settings - Water Only */}
              <div className="settings-sub-group" style={{ marginTop: '1rem' }}>
                <h5 className="settings-sub-title">Water Material</h5>

                <div className="settings-item vertical">
                  <label className="settings-label">Material Type</label>
                  <Dropdown
                    value={materialType}
                    options={[
                      { label: 'Standard (Simple)', value: 'standard' },
                      { label: 'Transmission (Realistic)', value: 'transmission' }
                    ]}
                    onChange={(e) => handleMaterialTypeChange(e.value)}
                    className="w-full"
                  />
                </div>

                {materialType === 'transmission' && (
                  <div className="material-transmission-controls mt-3">
                    <div className="control-item">
                      <label className="settings-label">Transmission</label>
                      <InputNumber
                        value={materialTransmission}
                        onValueChange={(e) => handleMaterialTransmissionChange(e.value ?? 1.0)}
                        min={0.0}
                        max={1.0}
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        step={0.05}
                        showButtons={false}
                        style={{ width: '60px', marginBottom: '8px' }}
                      />
                      <Slider
                        value={materialTransmission}
                        onChange={(e) => handleMaterialTransmissionChange(e.value as number)}
                        min={0.0}
                        max={1.0}
                        step={0.05}
                      />
                    </div>

                    <div className="control-item mt-2">
                      <label className="settings-label">Thickness</label>
                      <InputNumber
                        value={materialThickness}
                        onValueChange={(e) => handleMaterialThicknessChange(e.value ?? 0.5)}
                        min={0.0}
                        max={5.0}
                        minFractionDigits={1}
                        maxFractionDigits={1}
                        step={0.1}
                        showButtons={false}
                        style={{ width: '60px', marginBottom: '8px' }}
                      />
                      <Slider
                        value={materialThickness}
                        onChange={(e) => handleMaterialThicknessChange(e.value as number)}
                        min={0.0}
                        max={5.0}
                        step={0.1}
                      />
                    </div>

                    <div className="control-item mt-2">
                      <label className="settings-label">Roughness</label>
                      <InputNumber
                        value={materialRoughness}
                        onValueChange={(e) => handleMaterialRoughnessChange(e.value ?? 0.5)}
                        min={0.0}
                        max={1.0}
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        step={0.05}
                        showButtons={false}
                        style={{ width: '60px', marginBottom: '8px' }}
                      />
                      <Slider
                        value={materialRoughness}
                        onChange={(e) => handleMaterialRoughnessChange(e.value as number)}
                        min={0.0}
                        max={1.0}
                        step={0.05}
                      />
                    </div>

                    <div className="control-item mt-2">
                      <label className="settings-label">IOR (Refraction)</label>
                      <InputNumber
                        value={materialIor}
                        onValueChange={(e) => handleMaterialIorChange(e.value ?? 1.33)}
                        min={1.0}
                        max={2.5}
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        step={0.01}
                        showButtons={false}
                        style={{ width: '60px', marginBottom: '8px' }}
                      />
                      <Slider
                        value={materialIor}
                        onChange={(e) => handleMaterialIorChange(e.value as number)}
                        min={1.0}
                        max={2.5}
                        step={0.01}
                      />
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                        Water: 1.33, Glass: 1.5, Diamond: 2.4
                      </div>
                    </div>

                    <div className="control-item mt-2">
                      <label className="settings-label">Chromatic Aberration</label>
                      <InputNumber
                        value={materialChromaticAberration}
                        onValueChange={(e) => handleMaterialChromaticAberrationChange(e.value ?? 0.03)}
                        min={0.0}
                        max={0.5}
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        step={0.01}
                        showButtons={false}
                        style={{ width: '60px', marginBottom: '8px' }}
                      />
                      <Slider
                        value={materialChromaticAberration}
                        onChange={(e) => handleMaterialChromaticAberrationChange(e.value as number)}
                        min={0.0}
                        max={0.5}
                        step={0.01}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Triangle Vectors */}
              <div className="settings-item horizontal">
                <label className="settings-label">Triangle Vectors</label>
                <InputSwitch
                  checked={showTriangleVectors}
                  onChange={(e) => handleTriangleVectorsChange(e.value ?? false)}
                />
              </div>

              {/* Vector Size - only show when vectors are enabled */}
              {showTriangleVectors && (
                <div className="vector-controls mt-3">
                  <div className="control-item">
                    <label className="settings-label">Vector Size</label>
                    <InputNumber
                      value={vectorSize}
                      onValueChange={(e) => handleVectorSizeChange(e.value ?? 1.0)}
                      min={0.1}
                      max={5.0}
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      step={0.1}
                      showButtons={false}
                      style={{ width: '60px', marginBottom: '8px' }}
                    />
                    <Slider
                      value={vectorSize}
                      onChange={(e) => handleVectorSizeChange(e.value as number)}
                      min={0.1}
                      max={5.0}
                      step={0.1}
                    />
                  </div>
                  <div className="control-item mt-2">
                    <label className="settings-label">Vector Color</label>
                    <ColorPicker
                      value={vectorColor}
                      onChange={handleVectorColorChange}
                      format="hex"
                    />
                  </div>
                </div>
              )}
            </div>
          </AccordionTab>

          {/* Lighting Settings */}
          <AccordionTab
            header={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-sun"></i>
                <span>Lighting Settings</span>
              </div>
            }
          >
            <div className="accordion-content">
              {/* Ambient Light */}
              <div className="settings-sub-group">
                <h5 className="settings-sub-title">Ambient Light</h5>
                <div className="control-item">
                  <label className="settings-label">Intensity</label>
                  <InputNumber
                    value={ambientLightIntensity}
                    onValueChange={(e) => handleAmbientLightIntensityChange(e.value ?? 1.0)}
                    min={0.0}
                    max={2.0}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    step={0.1}
                    showButtons={false}
                    style={{ width: '60px', marginBottom: '8px' }}
                  />
                  <Slider
                    value={ambientLightIntensity}
                    onChange={(e) => handleAmbientLightIntensityChange(e.value as number)}
                    min={0.0}
                    max={2.0}
                    step={0.1}
                  />
                </div>
              </div>

              {/* Directional Light */}
              <div className="settings-sub-group">
                <h5 className="settings-sub-title">Directional Light</h5>
                <div className="control-item">
                  <label className="settings-label">Intensity</label>
                  <InputNumber
                    value={directionalLightIntensity}
                    onValueChange={(e) => handleDirectionalLightIntensityChange(e.value ?? 1.0)}
                    min={0.0}
                    max={2.0}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    step={0.1}
                    showButtons={false}
                    style={{ width: '60px', marginBottom: '8px' }}
                  />
                  <Slider
                    value={directionalLightIntensity}
                    onChange={(e) => handleDirectionalLightIntensityChange(e.value as number)}
                    min={0.0}
                    max={2.0}
                    step={0.1}
                  />
                </div>
                <div className="control-item mt-2">
                  <label className="settings-label">Color</label>
                  <ColorPicker
                    value={directionalLightColor}
                    onChange={handleDirectionalLightColorChange}
                    format="hex"
                  />
                </div>
                <div className="control-item mt-3">
                  <label className="settings-label">Position X</label>
                  <InputNumber
                    value={directionalLightX}
                    onValueChange={(e) => handleDirectionalLightXChange(e.value ?? 100)}
                    min={-200}
                    max={200}
                    step={10}
                    showButtons={false}
                    style={{ width: '60px', marginBottom: '8px' }}
                  />
                  <Slider
                    value={directionalLightX}
                    onChange={(e) => handleDirectionalLightXChange(e.value as number)}
                    min={-200}
                    max={200}
                    step={10}
                  />
                </div>
                <div className="control-item mt-2">
                  <label className="settings-label">Position Y</label>
                  <InputNumber
                    value={directionalLightY}
                    onValueChange={(e) => handleDirectionalLightYChange(e.value ?? 100)}
                    min={-200}
                    max={200}
                    step={10}
                    showButtons={false}
                    style={{ width: '60px', marginBottom: '8px' }}
                  />
                  <Slider
                    value={directionalLightY}
                    onChange={(e) => handleDirectionalLightYChange(e.value as number)}
                    min={-200}
                    max={200}
                    step={10}
                  />
                </div>
                <div className="control-item mt-2">
                  <label className="settings-label">Position Z</label>
                  <InputNumber
                    value={directionalLightZ}
                    onValueChange={(e) => handleDirectionalLightZChange(e.value ?? 50)}
                    min={-200}
                    max={200}
                    step={10}
                    showButtons={false}
                    style={{ width: '60px', marginBottom: '8px' }}
                  />
                  <Slider
                    value={directionalLightZ}
                    onChange={(e) => handleDirectionalLightZChange(e.value as number)}
                    min={-200}
                    max={200}
                    step={10}
                  />
                </div>
              </div>

              {/* Hemisphere Light */}
              <div className="settings-sub-group">
                <h5 className="settings-sub-title">Hemisphere Light</h5>
                <div className="control-item">
                  <label className="settings-label">Intensity</label>
                  <InputNumber
                    value={hemisphereLightIntensity}
                    onValueChange={(e) => handleHemisphereLightIntensityChange(e.value ?? 0.3)}
                    min={0.0}
                    max={1.0}
                    minFractionDigits={1}
                    maxFractionDigits={1}
                    step={0.1}
                    showButtons={false}
                    style={{ width: '60px', marginBottom: '8px' }}
                  />
                  <Slider
                    value={hemisphereLightIntensity}
                    onChange={(e) => handleHemisphereLightIntensityChange(e.value as number)}
                    min={0.0}
                    max={1.0}
                    step={0.1}
                  />
                </div>
                <div className="control-item mt-2">
                  <label className="settings-label">Sky Color</label>
                  <ColorPicker
                    value={hemisphereSkyColor}
                    onChange={handleHemisphereSkyColorChange}
                    format="hex"
                  />
                </div>
                <div className="control-item mt-2">
                  <label className="settings-label">Ground Color</label>
                  <ColorPicker
                    value={hemisphereGroundColor}
                    onChange={handleHemisphereGroundColorChange}
                    format="hex"
                  />
                </div>
              </div>
            </div>
          </AccordionTab>

          {/* Camera Control */}
          <AccordionTab
            header={
              <div className="flex align-items-center gap-2">
                <i className="pi pi-video"></i>
                <span>Camera Control</span>
              </div>
            }
          >
            <div className="accordion-content">
              {/* Fit to Box Button */}
              <div className="settings-item">
                <Button
                  icon="pi pi-eye"
                  label="Fit to Box"
                  onClick={handleFitToBox}
                  className="w-full"
                  severity="secondary"
                  size="small"
                />
              </div>

              {/* Camera Position */}
              <div className="settings-sub-group">
                <h5 className="settings-sub-title">Camera Position</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FloatLabel>
                      <InputNumber
                        id="camera-pos-x"
                        value={cameraPositionX}
                        onValueChange={(e) => setCameraPositionX(e.value ?? 0)}
                        minFractionDigits={3}
                        maxFractionDigits={3}
                        step={0.001}
                        showButtons={false}
                        style={{ width: '100%' }}
                      />
                      <label htmlFor="camera-pos-x">X</label>
                    </FloatLabel>
                  </div>
                  <div>
                    <FloatLabel>
                      <InputNumber
                        id="camera-pos-y"
                        value={cameraPositionY}
                        onValueChange={(e) => setCameraPositionY(e.value ?? 0)}
                        minFractionDigits={3}
                        maxFractionDigits={3}
                        step={0.001}
                        showButtons={false}
                        style={{ width: '100%' }}
                      />
                      <label htmlFor="camera-pos-y">Y</label>
                    </FloatLabel>
                  </div>
                  <div>
                    <FloatLabel>
                      <InputNumber
                        id="camera-pos-z"
                        value={cameraPositionZ}
                        onValueChange={(e) => setCameraPositionZ(e.value ?? 0)}
                        minFractionDigits={3}
                        maxFractionDigits={3}
                        step={0.001}
                        showButtons={false}
                        style={{ width: '100%' }}
                      />
                      <label htmlFor="camera-pos-z">Z</label>
                    </FloatLabel>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    icon="pi pi-save"
                    label="Set Pos"
                    onClick={handleSetPosition}
                    size="small"
                    severity="secondary"
                    className="flex-1"
                    style={{ fontSize: '0.7rem' }}
                  />
                  <Button
                    icon="pi pi-send"
                    label="Move To"
                    onClick={handleMoveTo}
                    size="small"
                    className="flex-1"
                    style={{ fontSize: '0.7rem' }}
                  />
                </div>
              </div>


              {/* Camera Target */}
              <div className="settings-sub-group">
                <h5 className="settings-sub-title">Camera Target</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FloatLabel>
                      <InputNumber
                        id="camera-target-x"
                        value={cameraTargetX}
                        onValueChange={(e) => setCameraTargetX(e.value ?? 0)}
                        minFractionDigits={3}
                        maxFractionDigits={3}
                        step={0.001}
                        showButtons={false}
                        style={{ width: '100%' }}
                      />
                      <label htmlFor="camera-target-x">X</label>
                    </FloatLabel>
                  </div>
                  <div>
                    <FloatLabel>
                      <InputNumber
                        id="camera-target-y"
                        value={cameraTargetY}
                        onValueChange={(e) => setCameraTargetY(e.value ?? 0)}
                        minFractionDigits={3}
                        maxFractionDigits={3}
                        step={0.001}
                        showButtons={false}
                        style={{ width: '100%' }}
                      />
                      <label htmlFor="camera-target-y">Y</label>
                    </FloatLabel>
                  </div>
                  <div>
                    <FloatLabel>
                      <InputNumber
                        id="camera-target-z"
                        value={cameraTargetZ}
                        onValueChange={(e) => setCameraTargetZ(e.value ?? 0)}
                        minFractionDigits={3}
                        maxFractionDigits={3}
                        step={0.001}
                        showButtons={false}
                        style={{ width: '100%' }}
                      />
                      <label htmlFor="camera-target-z">Z</label>
                    </FloatLabel>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    icon="pi pi-save"
                    label="Set Target"
                    onClick={handleSetTarget}
                    size="small"
                    severity="secondary"
                    className="flex-1"
                    style={{ fontSize: '0.7rem' }}
                  />
                  <Button
                    icon="pi pi-eye"
                    label="Look At"
                    onClick={handleSetLookAt}
                    size="small"
                    className="flex-1"
                    style={{ fontSize: '0.7rem' }}
                  />
                </div>
              </div>
            </div>
          </AccordionTab>
        </Accordion>
      </div>

      {/* Toast for notifications */}
      <Toast ref={toast} />
    </div>
  );
};

export default SettingsPanel;