import type { SimulationOption } from '../types/simulationTypes';
import type { SolverId } from './solverConfig';

export type SimulationId = keyof typeof SIMULATION_DEFINITIONS;

// Simulation helper functions
export function getSimulationById(id: SimulationId): SimulationOption | undefined {
  return SIMULATION_DEFINITIONS[id];
}

export function getSupportedSolvers(simulationId: SimulationId): SolverId[] {
  return SIMULATION_DEFINITIONS[simulationId]?.supportedSolvers || [];
}

export function getAllSimulations(): (SimulationOption & { id: SimulationId })[] {
  return Object.entries(SIMULATION_DEFINITIONS).map(([key, value]) => ({
    ...value,
    id: key as SimulationId
  }));
}

// <------- Configure simulation definitions below ------->

export const SIMULATION_DEFINITIONS = {
  concentration_diffusion: {
    name: 'Concentration Diffusion',
    description: 'Concentration diffusion simulation using LBM solver',
    icon: '💧',
    supportedSolvers: ['lbm'] as const,
    features: ['Diffusion coefficient modeling', 'Concentration distribution', 'Time evolution', 'Mass transfer analysis']
  },
} as const satisfies Record<string, SimulationOption>;

// <-------------------------------------------------------->
