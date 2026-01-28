/**
 * @file domainStore.ts
 * @description Zustand store for managing domain configuration
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Domain,
  DomainState,
  DomainPreset,
  DomainValidation,
  BoundaryConfig,
  MeshConfig,
  BoxDomain,
} from '../types/domain.types';

// Default boundary configurations
const DEFAULT_WALL_BOUNDARY: BoundaryConfig = {
  type: 'wall',
  name: 'wall',
  velocity: {
    type: 'noSlip',
  },
  pressure: {
    type: 'zeroGradient',
  },
};

const DEFAULT_INLET_BOUNDARY: BoundaryConfig = {
  type: 'inlet',
  name: 'inlet',
  velocity: {
    type: 'fixedValue',
    value: [1, 0, 0], // 1 m/s in X direction
  },
  pressure: {
    type: 'zeroGradient',
  },
};

const DEFAULT_OUTLET_BOUNDARY: BoundaryConfig = {
  type: 'outlet',
  name: 'outlet',
  velocity: {
    type: 'zeroGradient',
  },
  pressure: {
    type: 'fixedValue',
    value: 0, // Atmospheric pressure (gauge)
  },
};

// Default mesh configuration
const DEFAULT_MESH_CONFIG: MeshConfig = {
  cellSize: 0.01, // 1 cm default
  divisions: {
    x: 50,
    y: 20,
    z: 20,
  },
  refinementRegions: [],
  surfaceRefinementLevel: 2,
  featureRefinementLevel: 3,
  quality: {
    maxNonOrthogonality: 65,
    maxSkewness: 4,
    maxAspectRatio: 100,
    minDeterminant: 0.01,
    minFaceArea: 1e-10,
    minCellVolume: 1e-13,
  },
};

// Default box domain
const DEFAULT_BOX_DOMAIN: BoxDomain = {
  id: 'default-box',
  name: 'Default Box Domain',
  shape: 'box',
  units: 'meters',
  origin: [0, 0, 0],
  dimensions: {
    width: 1.0,  // X
    height: 0.5, // Y
    depth: 0.5,  // Z
  },
  mesh: DEFAULT_MESH_CONFIG,
  boundaries: {
    xMin: { ...DEFAULT_INLET_BOUNDARY, name: 'inlet' },
    xMax: { ...DEFAULT_OUTLET_BOUNDARY, name: 'outlet' },
    yMin: { ...DEFAULT_WALL_BOUNDARY, name: 'bottom' },
    yMax: { ...DEFAULT_WALL_BOUNDARY, name: 'top' },
    zMin: { ...DEFAULT_WALL_BOUNDARY, name: 'back' },
    zMax: { ...DEFAULT_WALL_BOUNDARY, name: 'front' },
  },
  display: {
    visible: true,
    color: '#00ffff',
    opacity: 0.3,
    wireframe: true,
    showBoundaries: true,
    showRefinementRegions: false,
  },
};

// Domain presets
const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: 'wind-tunnel',
    name: 'Wind Tunnel',
    description: 'External flow around objects',
    category: 'external-flow',
    domain: {
      shape: 'box',
      dimensions: {
        width: 4.0,  // X - flow direction
        height: 2.0, // Y - vertical
        depth: 2.0,  // Z - lateral
      },
      boundaries: {
        xMin: { ...DEFAULT_INLET_BOUNDARY, name: 'velocity-inlet' },
        xMax: { ...DEFAULT_OUTLET_BOUNDARY, name: 'pressure-outlet' },
        yMin: { ...DEFAULT_WALL_BOUNDARY, name: 'ground' },
        yMax: { type: 'slip', name: 'top', velocity: { type: 'slip' } },
        zMin: { type: 'symmetry', name: 'side1' },
        zMax: { type: 'symmetry', name: 'side2' },
      },
    } as Partial<BoxDomain>,
  },
  {
    id: 'pipe-flow',
    name: 'Pipe Flow',
    description: 'Internal flow through pipes',
    category: 'internal-flow',
    domain: {
      shape: 'cylinder',
      dimensions: {
        radius: 0.05,
        height: 1.0,
        axis: 'x',
      },
    },
  },
  {
    id: 'stirred-tank',
    name: 'Stirred Tank',
    description: 'Mixing tank with rotating impeller',
    category: 'multiphase',
    domain: {
      shape: 'cylinder',
      dimensions: {
        radius: 0.5,
        height: 1.0,
        axis: 'y',
      },
    },
  },
  {
    id: 'heat-exchanger',
    name: 'Heat Exchanger',
    description: 'Heat transfer between fluids',
    category: 'heat-transfer',
    domain: {
      shape: 'box',
      dimensions: {
        width: 2.0,
        height: 0.3,
        depth: 0.3,
      },
    } as Partial<BoxDomain>,
  },
];

// Domain store
export const useDomainStore = create<DomainState>()(
  devtools(
    (set, get) => ({
      // Initial state
      domain: DEFAULT_BOX_DOMAIN,
      presets: DOMAIN_PRESETS,
      validation: null,
      selectedBoundary: null,
      selectedRefinementRegion: null,
      showMeshPreview: false,

      // Actions
      setDomain: (domain) => {
        set({ domain, validation: null });
      },

      updateDomain: (updates) => {
        const currentDomain = get().domain;
        if (currentDomain) {
          set({ domain: { ...currentDomain, ...updates } as Domain });
        }
      },

      updateDimensions: (dimensions) => {
        const currentDomain = get().domain;
        if (currentDomain && 'dimensions' in currentDomain) {
          set({
            domain: {
              ...currentDomain,
              dimensions: { ...currentDomain.dimensions, ...dimensions },
            } as Domain,
          });
        }
      },

      setBoundaryCondition: (face, config) => {
        const currentDomain = get().domain;
        if (currentDomain) {
          set({
            domain: {
              ...currentDomain,
              boundaries: {
                ...currentDomain.boundaries,
                [face]: config,
              },
            } as Domain,
          });
        }
      },

      addRefinementRegion: (region) => {
        const currentDomain = get().domain;
        if (currentDomain) {
          const updatedMesh = {
            ...currentDomain.mesh,
            refinementRegions: [...currentDomain.mesh.refinementRegions, region],
          };
          set({
            domain: {
              ...currentDomain,
              mesh: updatedMesh,
            } as Domain,
          });
        }
      },

      removeRefinementRegion: (id) => {
        const currentDomain = get().domain;
        if (currentDomain) {
          const updatedMesh = {
            ...currentDomain.mesh,
            refinementRegions: currentDomain.mesh.refinementRegions.filter(
              (r) => r.id !== id
            ),
          };
          set({
            domain: {
              ...currentDomain,
              mesh: updatedMesh,
            } as Domain,
          });
        }
      },

      updateRefinementRegion: (id, updates) => {
        const currentDomain = get().domain;
        if (currentDomain) {
          const updatedMesh = {
            ...currentDomain.mesh,
            refinementRegions: currentDomain.mesh.refinementRegions.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          };
          set({
            domain: {
              ...currentDomain,
              mesh: updatedMesh,
            } as Domain,
          });
        }
      },

      updateMeshConfig: (config) => {
        const currentDomain = get().domain;
        if (currentDomain) {
          set({
            domain: {
              ...currentDomain,
              mesh: { ...currentDomain.mesh, ...config },
            } as Domain,
          });
        }
      },

      applyPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (preset && preset.domain) {
          const newDomain = {
            ...DEFAULT_BOX_DOMAIN,
            ...preset.domain,
            id: `${presetId}-${Date.now()}`,
            name: preset.name,
          } as Domain;
          set({ domain: newDomain, validation: null });
        }
      },

      validateDomain: async () => {
        const domain = get().domain;
        if (!domain) {
          const validation: DomainValidation = {
            valid: false,
            errors: ['No domain configured'],
            warnings: [],
            info: {},
          };
          set({ validation });
          return validation;
        }

        const errors: string[] = [];
        const warnings: string[] = [];
        const info: DomainValidation['info'] = {};

        // Validate dimensions
        if ('dimensions' in domain) {
          const dims = domain.dimensions;
          if ('width' in dims && dims.width <= 0) {
            errors.push('Domain width must be positive');
          }
          if ('height' in dims && dims.height <= 0) {
            errors.push('Domain height must be positive');
          }
          if ('depth' in dims && dims.depth <= 0) {
            errors.push('Domain depth must be positive');
          }
        }

        // Validate mesh
        if (domain.mesh.cellSize <= 0) {
          errors.push('Cell size must be positive');
        }

        // Calculate mesh info
        if (domain.shape === 'box' && domain.mesh.divisions) {
          const { x, y, z } = domain.mesh.divisions;
          info.cellCount = x * y * z;
          info.minCellSize = domain.mesh.cellSize;
          info.maxCellSize = domain.mesh.cellSize * 2;

          // Check mesh quality
          if (info.cellCount > 1000000) {
            warnings.push('Mesh has over 1 million cells, simulation may be slow');
          }
          if (info.cellCount < 1000) {
            warnings.push('Mesh has less than 1000 cells, results may be inaccurate');
          }

          // Determine mesh quality
          if (errors.length === 0 && warnings.length === 0) {
            info.meshQuality = 'excellent';
          } else if (errors.length === 0 && warnings.length <= 1) {
            info.meshQuality = 'good';
          } else if (errors.length === 0) {
            info.meshQuality = 'acceptable';
          } else {
            info.meshQuality = 'poor';
          }
        }

        // Validate boundary conditions
        const boundaries = Object.entries(domain.boundaries);
        let hasInlet = false;
        let hasOutlet = false;

        for (const [, boundary] of boundaries) {
          if (boundary.type === 'inlet') hasInlet = true;
          if (boundary.type === 'outlet') hasOutlet = true;
        }

        if (!hasInlet) {
          warnings.push('No inlet boundary defined');
        }
        if (!hasOutlet) {
          warnings.push('No outlet boundary defined');
        }

        const validation: DomainValidation = {
          valid: errors.length === 0,
          errors,
          warnings,
          info,
        };

        set({ validation });
        return validation;
      },

      exportDomain: () => {
        const { domain } = get();
        if (!domain) return null;

        return {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          domain: domain,
        };
      },

      importDomain: (config) => {
        if (config && config.domain) {
          set({ domain: config.domain, validation: null });
        }
      },

      reset: () => {
        set({
          domain: DEFAULT_BOX_DOMAIN,
          validation: null,
          selectedBoundary: null,
          selectedRefinementRegion: null,
          showMeshPreview: false,
        });
      },
    }),
    {
      name: 'domain-store',
    }
  )
);