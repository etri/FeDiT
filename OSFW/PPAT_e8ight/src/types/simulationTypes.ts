// Type definitions for simulations
// Config-First pattern: SimulationId is derived from simulationConfig

import type { SolverId } from '../configs/solverConfig';

export interface SimulationOption {
  name: string;
  description: string;
  icon: string;
  supportedSolvers: SolverId[];
  features: string[];
  comingSoon?: boolean;
}