import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// Solver Type Definitions and Schema Configuration
// ============================================================================

// Currently only LBM solver is supported for concentration_diffusion
type SolverType = 'LBM';

type SchemaConfig = {
  readonly [K in SolverType]: object;
};

// Placeholder schema for concentration_diffusion LBM
// TODO: Add actual JSON schema when available
const concentrationDiffusionLBMSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "simulation": { "type": "object" },
    "region": { "type": "object" },
    "materials": { "type": "object" },
    "calculation": { "type": "object" }
  }
};

// Schema mapping configuration
const SCHEMA_CONFIG: SchemaConfig = {
  'LBM': concentrationDiffusionLBMSchema,
} as const;

// Default schema when no solver type is specified
const DEFAULT_SOLVER_TYPE: SolverType = 'LBM';

// ============================================================================
// Type Definitions
// ============================================================================

interface WasmModule {
    cwrap: (name: string, returnType: string, argTypes: string[]) => (...args: any[]) => any;
}

interface ValidationResult {
    isValid: boolean;
    errors?: string;
    parseError?: string;
    loadError?: string;
    timestamp?: number;
}

interface JSONValidatorProps {
    schema: string | object;
    jsonData: string | object;
    onValidationComplete: (result: ValidationResult) => void;
    onLoadingStateChange?: (isLoading: boolean) => void;
    autoValidate?: boolean;
    debounceMs?: number;
    disabled?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): T & { cancel?: () => void } {
    let timeout: number | null = null;

    const debounced = ((...args: any[]) => {
        if (timeout) clearTimeout(timeout);
        timeout = window.setTimeout(() => func(...args), wait);
    }) as T & { cancel?: () => void };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
}

function normalizeInput(input: string | object): string {
    if (!input) return '';

    if (typeof input === 'string') {
        return input.trim();
    }

    try {
        return JSON.stringify(input);
    } catch (error) {
        throw new Error(`Cannot serialize input to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ============================================================================
// WASM Module Singleton Manager
// ============================================================================

class WasmValidatorManager {
    private static instance: WasmModule | null = null;
    private static loadingPromise: Promise<WasmModule> | null = null;
    private static loadError: string | null = null;

    static async getModule(): Promise<WasmModule> {
        // If already loaded, return immediately
        if (this.instance) return this.instance;

        // If currently loading, wait for that promise
        if (this.loadingPromise) return this.loadingPromise;

        // If previous load failed, reset error and try again
        if (this.loadError) {
            this.loadError = null;
        }

        // Start loading
        this.loadingPromise = this.loadWasmModule();

        try {
            this.instance = await this.loadingPromise;
            return this.instance;
        } catch (error) {
            this.loadError = error instanceof Error ? error.message : 'Unknown WASM loading error';
            this.loadingPromise = null;
            throw error;
        }
    }

    private static async loadWasmModule(): Promise<WasmModule> {
        return new Promise<WasmModule>((resolve, reject) => {
            // Load WASM module from public folder using dynamic script loading
            const script = document.createElement('script');
            script.src = 'src/utils/json/validator/valijson.js';

            script.onload = () => {
                // The WASM module factory should be available as a global
                const createValidatorModule = (window as any).createValidatorModule;
                if (createValidatorModule) {
                    createValidatorModule().then(resolve).catch(reject);
                } else {
                    reject(new Error('createValidatorModule not found'));
                }
            };

            script.onerror = () => reject(new Error('Failed to load WASM script'));
            document.head.appendChild(script);
        });
    }

    static reset(): void {
        this.instance = null;
        this.loadingPromise = null;
        this.loadError = null;
    }
}

// ============================================================================
// Core Validation Logic
// ============================================================================

async function validateJsonWithSchema(
    schema: string | object,
    jsonData: string | object
): Promise<ValidationResult> {
    try {
        // Normalize inputs to strings
        const schemaStr = normalizeInput(schema);
        const dataStr = normalizeInput(jsonData);

        // Check for empty inputs
        if (!schemaStr || !dataStr) {
            return {
                isValid: false,
                parseError: 'Schema and JSON data are required',
                timestamp: Date.now()
            };
        }

        // Get WASM module
        const wasmModule = await WasmValidatorManager.getModule();

        // Create wrapper functions
        const validateJSON = wasmModule.cwrap('validateJSON', 'number', ['string', 'string']);
        const getValidationErrors = wasmModule.cwrap('getValidationErrors', 'string', ['string', 'string']);
        const isValidSchema = wasmModule.cwrap('isValidSchema', 'number', ['string']);
        const isValidJSON = wasmModule.cwrap('isValidJSON', 'number', ['string']);
        const getJSONParseError = wasmModule.cwrap('getJSONParseError', 'string', ['string']);

        // Validate schema format
        if (!isValidSchema(schemaStr)) {
            const schemaError = getJSONParseError(schemaStr);
            return {
                isValid: false,
                parseError: `Invalid schema: ${schemaError}`,
                timestamp: Date.now()
            };
        }

        // Validate JSON data format
        if (!isValidJSON(dataStr)) {
            const jsonError = getJSONParseError(dataStr);
            return {
                isValid: false,
                parseError: `Invalid JSON data: ${jsonError}`,
                timestamp: Date.now()
            };
        }

        // Perform validation (jsonData first, schema second per C++ function signature)
        const isValid = validateJSON(dataStr, schemaStr) === 1;

        if (isValid) {
            return {
                isValid: true,
                timestamp: Date.now()
            };
        } else {
            const errors = getValidationErrors(dataStr, schemaStr);
            return {
                isValid: false,
                errors,
                timestamp: Date.now()
            };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
        return {
            isValid: false,
            loadError: `Validation error: ${errorMessage}`,
            timestamp: Date.now()
        };
    }
}

// ============================================================================
// Schema Selection and Enhanced Validation
// ============================================================================

/**
 * Gets the appropriate schema for the specified solver type
 * @param solverType - The solver type to get schema for
 * @returns The schema object and resolved type for validation
 */
function getSchemaForSolver(solverType?: string): { schema: object; resolvedType: SolverType } {
  // Normalize and validate solver type
  const normalizedType = solverType?.toUpperCase().trim() as SolverType;

  // Check if the solver type is valid
  if (normalizedType && normalizedType in SCHEMA_CONFIG) {
    console.log(`Using schema for solver type: ${normalizedType}`);
    return {
      schema: SCHEMA_CONFIG[normalizedType],
      resolvedType: normalizedType
    };
  }

  // Fallback to default
  if (solverType) {
    console.warn(`⚠️ Unknown solver type '${solverType}', falling back to default: ${DEFAULT_SOLVER_TYPE}`);
  } else {
    console.log(`📋 No solver type specified, using default: ${DEFAULT_SOLVER_TYPE}`);
  }

  return {
    schema: SCHEMA_CONFIG[DEFAULT_SOLVER_TYPE],
    resolvedType: DEFAULT_SOLVER_TYPE
  };
}

// Enhanced validation result with solver type information and UI-ready messages
interface EnhancedValidationResult extends ValidationResult {
  resolvedSolverType: SolverType;
  schemaUsed?: string;
  // UI-ready fields for direct display
  errorMessage?: string;    // User-facing error summary
  errorDetail?: string;     // Detailed error information
  severity?: 'error' | 'warn' | 'info';
}

/**
 * Generates UI-ready error messages based on validation result
 * @param validationResult - Raw validation result
 * @param resolvedType - The solver type used for validation
 * @returns Object with error message, detail, and severity for UI display
 */
function generateErrorMessage(validationResult: ValidationResult, resolvedType: SolverType): {
  errorMessage: string;
  errorDetail: string;
  severity: 'error' | 'warn' | 'info';
} {
  if (validationResult.parseError) {
    console.error('❌ JSON Parse Error:', validationResult.parseError);
    console.error(`📋 Schema used: ${resolvedType}`);
    return {
      errorMessage: 'JSON 파싱 오류',
      errorDetail: validationResult.parseError,
      severity: 'error'
    };
  }

  if (validationResult.loadError) {
    console.error('❌ WASM Load Error:', validationResult.loadError);
    return {
      errorMessage: 'WASM 모듈 로딩 오류',
      errorDetail: validationResult.loadError,
      severity: 'error'
    };
  }

  if (validationResult.errors) {
    console.error('❌ Schema Validation Error:', validationResult.errors);
    console.error(`📋 Schema used: ${resolvedType}`);
    return {
      errorMessage: 'JSON 스키마 검증 실패',
      errorDetail: `스키마: ${resolvedType}\n오류: ${validationResult.errors}`,
      severity: 'error'
    };
  }

  // Generic validation failure fallback
  console.error('❌ Unknown validation error');
  console.error(`📋 Schema used: ${resolvedType}`);
  return {
    errorMessage: 'JSON 검증 실패',
    errorDetail: `스키마 타입: ${resolvedType}`,
    severity: 'error'
  };
}

/**
 * Validates JSON data with automatic schema selection based on solver type
 * @param solverType - The solver type (optional, defaults to DELBM)
 * @param jsonData - The JSON data to validate (object or string)
 * @returns Enhanced validation result with solver type information and UI-ready messages
 */
async function validateWithSolverType(
  solverType: string | undefined,
  jsonData: string | object
): Promise<EnhancedValidationResult> {
  try {

    // Get appropriate schema for solver type
    const { schema: selectedSchema, resolvedType } = getSchemaForSolver(solverType);

      console.log('Starting validation with solver type:', resolvedType);

    // Perform validation using the selected schema
    const validationResult = await validateJsonWithSchema(selectedSchema, jsonData);

    // If validation succeeded, return success result
    if (validationResult.isValid) {
      return {
        ...validationResult,
        resolvedSolverType: resolvedType,
        schemaUsed: resolvedType
      };
    }

    // If validation failed, generate UI-ready error messages
    const { errorMessage, errorDetail, severity } = generateErrorMessage(validationResult, resolvedType);

    return {
      ...validationResult,
      resolvedSolverType: resolvedType,
      schemaUsed: resolvedType,
      errorMessage,
      errorDetail,
      severity
    };

  } catch (error) {
    console.error('❌ Validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

    return {
      isValid: false,
      loadError: `Validation error: ${errorMessage}`,
      timestamp: Date.now(),
      resolvedSolverType: DEFAULT_SOLVER_TYPE,
      schemaUsed: 'ERROR_FALLBACK',
      errorMessage: 'WASM 모듈 로딩 오류',
      errorDetail: `Validation error: ${errorMessage}`,
      severity: 'error'
    };
  }
}

// ============================================================================
// React Component
// ============================================================================

function JSONValidator({
    schema,
    jsonData,
    onValidationComplete,
    onLoadingStateChange,
    autoValidate = true,
    debounceMs = 300,
    disabled = false
}: JSONValidatorProps) {
    const [, setIsLoading] = useState(false);

    // Debounced validation function
    const debouncedValidate = useCallback(
        debounce(async (schemaVal: string | object, dataVal: string | object) => {
            if (!schemaVal || !dataVal || disabled) return;

            setIsLoading(true);
            onLoadingStateChange?.(true);

            try {
                const result = await validateJsonWithSchema(schemaVal, dataVal);
                onValidationComplete(result);
            } finally {
                setIsLoading(false);
                onLoadingStateChange?.(false);
            }
        }, debounceMs),
        [onValidationComplete, onLoadingStateChange, debounceMs, disabled]
    );

    // Auto-validate when props change
    useEffect(() => {
        if (autoValidate && schema && jsonData && !disabled) {
            debouncedValidate(schema, jsonData);
        }
    }, [schema, jsonData, autoValidate, disabled, debouncedValidate]);

    // Cleanup debounced function on unmount
    useEffect(() => {
        return () => {
            debouncedValidate.cancel?.();
        };
    }, [debouncedValidate]);

    // This component doesn't render anything - it's purely functional
    return null;
}

// ============================================================================
// Exports
// ============================================================================

export { validateJsonWithSchema, validateWithSolverType, getSchemaForSolver, WasmValidatorManager };
export type { ValidationResult, EnhancedValidationResult, JSONValidatorProps, SolverType };
export default JSONValidator;