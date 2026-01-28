/**
 * @file common.types.ts
 * @description Common type definitions shared across viewer components
 */

// 3D vector tuple
export type Vector3Tuple = [number, number, number];

// 2D vector tuple
export type Vector2Tuple = [number, number];

// Color representation
export type Color = string | number | [number, number, number];

// Quaternion for rotations
export type Quaternion = [number, number, number, number];

// Transform data
export interface Transform {
  position: Vector3Tuple;
  rotation: Vector3Tuple; // Euler angles in radians
  scale: Vector3Tuple;
}

// Bounding box
export interface BoundingBox {
  min: Vector3Tuple;
  max: Vector3Tuple;
  center: Vector3Tuple;
  size: Vector3Tuple;
}

// Material properties
export interface MaterialProperties {
  color: Color;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  roughness?: number;
  metalness?: number;
  emissive?: Color;
  emissiveIntensity?: number;
}

// Common selection state
export interface SelectionState {
  selected: boolean;
  hovered: boolean;
  highlighted: boolean;
  visible: boolean;
}

// Coordinate system
export type CoordinateSystem = 'cartesian' | 'cylindrical' | 'spherical';

// Axis
export type Axis = 'x' | 'y' | 'z';

// Plane
export type Plane = 'xy' | 'xz' | 'yz';

// Units
export type LengthUnit = 'meters' | 'millimeters' | 'centimeters' | 'inches' | 'feet';
export type TimeUnit = 'seconds' | 'milliseconds' | 'minutes' | 'hours';
export type MassUnit = 'kilograms' | 'grams' | 'pounds';
export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin';

// Physical properties
export interface FluidProperties {
  density: number;           // kg/m³
  viscosity: number;         // Pa·s (dynamic viscosity)
  kinematicViscosity?: number; // m²/s
  temperature?: number;      // K
  specificHeat?: number;     // J/(kg·K)
  thermalConductivity?: number; // W/(m·K)
}

// Flow conditions
export interface FlowConditions {
  velocity: Vector3Tuple;    // m/s
  pressure: number;          // Pa
  temperature?: number;      // K
  turbulenceIntensity?: number; // %
  turbulentLengthScale?: number; // m
}

// Simulation time settings
export interface TimeSettings {
  startTime: number;
  endTime: number;
  deltaT: number;
  writeInterval: number;
  adjustTimeStep: boolean;
  maxCo?: number; // Maximum Courant number
  maxDeltaT?: number;
}