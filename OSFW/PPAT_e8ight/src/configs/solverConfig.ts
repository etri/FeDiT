import type { SolverOption } from '../types/solverTypes';

export type SolverId = keyof typeof SOLVER_DEFINITIONS;

// Solver helper functions
export function getSolverById(id: SolverId): SolverOption | undefined {
  return SOLVER_DEFINITIONS[id];
}

export function getAllSolvers(): (SolverOption & { id: SolverId })[] {
  return Object.entries(SOLVER_DEFINITIONS).map(([key, value]) => ({
    ...value,
    id: key as SolverId
  }));
}

export function getSolverBadgeColor(solverId: SolverId): { backgroundColor: string; color: string } {
  switch (solverId) {
    case 'openfoam':
      return { backgroundColor: '#4CAF50', color: '#fff' };
    case 'lbm':
      return { backgroundColor: '#2196F3', color: '#fff' };
    case 'sph':
      return { backgroundColor: '#FF9800', color: '#fff' };
    default:
      return { backgroundColor: '#9E9E9E', color: '#fff' };
  }
}

export function getSolverBadgeStyle(badgeType: 'recommended' | 'experimental' | 'custom'): { backgroundColor: string; color: string } {
  switch (badgeType) {
    case 'recommended':
      return { backgroundColor: '#10b981', color: '#fff' };
    case 'experimental':
      return { backgroundColor: '#3b82f6', color: '#fff' };
    case 'custom':
      return { backgroundColor: '#f59e0b', color: '#fff' };
    default:
      return { backgroundColor: '#6b7280', color: '#fff' };
  }
}

// <------- Configure solver definitions below ------->

export const SOLVER_DEFINITIONS = {
  openfoam: {
    name: 'OpenFOAM',
    badge: 'Recommended',
    badgeType: 'recommended' as const,
    description: 'Industry-standard finite volume method CFD solver. Best for complex geometries, turbulent flows, and multiphase simulations. Includes various solvers like simpleFoam, pimpleFoam, and interFoam.',
    features: ['Finite Volume Method', 'Parallel Computing', 'Extensive Solver Library', 'Validated Results'],
    performance: 'High accuracy, moderate computational cost'
  },
  lbm: {
    name: 'Lattice Boltzmann Method (LBM)',
    badge: 'GPU Accelerated',
    badgeType: 'experimental' as const,
    description: 'Mesoscopic particle-based method. Excellent for porous media, microfluidics, and parallel computing. Naturally handles complex boundaries and phase transitions.',
    features: ['Mesoscopic Approach', 'GPU Acceleration', 'Complex Geometries', 'Porous Media'],
    performance: 'Very fast on GPU, excellent for complex boundaries'
  },
  sph: {
    name: 'Smoothed Particle Hydrodynamics (SPH)',
    badge: 'Meshless',
    badgeType: 'custom' as const,
    description: 'Meshless Lagrangian method ideal for free surface flows, fluid-structure interaction, and large deformations. Perfect for wave impact and sloshing simulations.',
    features: ['Meshless Method', 'Free Surface', 'Large Deformations', 'Fluid-Structure Interaction'],
    performance: 'Good for dynamic problems, higher computational cost'
  }
} as const satisfies Record<string, SolverOption>;

// <-------------------------------------------------------->