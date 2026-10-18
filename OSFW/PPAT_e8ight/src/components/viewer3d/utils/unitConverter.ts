/**
 * Unit conversion utilities for 3D models
 */

export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export interface UnitConversion {
  from: Unit;
  to: Unit;
  factor: number;
}

// Conversion factors to meters
const TO_METERS: Record<Unit, number> = {
  'mm': 0.001,
  'cm': 0.01,
  'm': 1.0,
  'in': 0.0254,
  'ft': 0.3048,
};

// Conversion factors from meters
const FROM_METERS: Record<Unit, number> = {
  'mm': 1000,
  'cm': 100,
  'm': 1.0,
  'in': 39.3701,
  'ft': 3.28084,
};

/**
 * Convert value from one unit to another
 */
export function convertUnit(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return value;

  // Convert to meters first, then to target unit
  const inMeters = value * TO_METERS[fromUnit];
  return inMeters * FROM_METERS[toUnit];
}

/**
 * Get conversion factor between units
 */
export function getConversionFactor(fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return 1.0;
  return TO_METERS[fromUnit] * FROM_METERS[toUnit];
}

/**
 * Format value with unit label
 */
export function formatWithUnit(value: number, unit: Unit, decimals: number = 2): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Detect unit based on model dimensions
 * This is a heuristic approach based on typical sizes
 */
export function detectUnit(maxDimension: number): Unit {
  // Typical car dimensions in different units:
  // mm: 3000-6000
  // cm: 300-600
  // m: 3-6
  // in: 118-236
  // ft: 10-20

  console.log('[Unit Detection] Max dimension:', maxDimension);

  if (maxDimension > 1000) {
    // Likely millimeters (>1000 units)
    console.log('[Unit Detection] Detected: mm (dimension > 1000)');
    return 'mm';
  } else if (maxDimension > 200) {
    // Likely centimeters (200-1000 units)
    // cm typically 300-600 for cars
    console.log('[Unit Detection] Detected: cm (dimension 200-1000)');
    return 'cm';
  } else if (maxDimension > 80) {
    // Likely inches (80-200 units)
    // Inches typically 118-236 for cars
    console.log('[Unit Detection] Detected: in (dimension 80-200)');
    return 'in';
  } else if (maxDimension > 8) {
    // Likely feet (8-80 units)
    // ft typically 10-20 for cars
    console.log('[Unit Detection] Detected: ft (dimension 8-80)');
    return 'ft';
  } else {
    // Likely meters (0-8 units)
    // m typically 3-6 for cars
    console.log('[Unit Detection] Detected: m (dimension 0-8)');
    return 'm';
  }
}

/**
 * Get typical vehicle dimensions for validation
 */
export function getTypicalVehicleDimensions(unit: Unit): {
  minLength: number;
  maxLength: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
} {
  // Base dimensions in meters
  const base = {
    minLength: 3.0,  // Small car
    maxLength: 6.0,  // Large SUV/truck
    minWidth: 1.5,   // Small car
    maxWidth: 2.2,   // Large SUV
    minHeight: 1.0,  // Sports car
    maxHeight: 2.5,  // Large SUV/van
  };

  // Convert to requested unit
  const factor = FROM_METERS[unit];
  return {
    minLength: base.minLength * factor,
    maxLength: base.maxLength * factor,
    minWidth: base.minWidth * factor,
    maxWidth: base.maxWidth * factor,
    minHeight: base.minHeight * factor,
    maxHeight: base.maxHeight * factor,
  };
}

/**
 * Validate if dimensions are reasonable for a vehicle
 */
export function validateVehicleDimensions(
  length: number,
  width: number,
  height: number,
  unit: Unit
): { valid: boolean; warnings: string[] } {
  const typical = getTypicalVehicleDimensions(unit);
  const warnings: string[] = [];

  // Check length
  if (length < typical.minLength || length > typical.maxLength) {
    warnings.push(
      `Vehicle length (${formatWithUnit(length, unit)}) is outside typical range ` +
      `(${formatWithUnit(typical.minLength, unit)} - ${formatWithUnit(typical.maxLength, unit)})`
    );
  }

  // Check width
  if (width < typical.minWidth || width > typical.maxWidth) {
    warnings.push(
      `Vehicle width (${formatWithUnit(width, unit)}) is outside typical range ` +
      `(${formatWithUnit(typical.minWidth, unit)} - ${formatWithUnit(typical.maxWidth, unit)})`
    );
  }

  // Check height
  if (height < typical.minHeight || height > typical.maxHeight) {
    warnings.push(
      `Vehicle height (${formatWithUnit(height, unit)}) is outside typical range ` +
      `(${formatWithUnit(typical.minHeight, unit)} - ${formatWithUnit(typical.maxHeight, unit)})`
    );
  }

  // Check proportions
  const lengthToWidth = length / width;
  if (lengthToWidth < 1.5 || lengthToWidth > 4.0) {
    warnings.push(
      `Vehicle length/width ratio (${lengthToWidth.toFixed(2)}) is unusual ` +
      `(typical range: 1.5 - 4.0)`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}