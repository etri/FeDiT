import type { FormId } from './formConfig';
import type { SimulationId } from './simulationConfig';
import type { SolverId } from './solverConfig';

// Depth-based mapping structure: simulation -> solver -> forms
type ProjectFormMapping = {
  [simulation in SimulationId | 'default']?: {
    [solver in SolverId | 'default']?: FormId[]
  }
};

// Get forms for a specific simulation and solver combination
export function getFormsForProject(
  simulation?: string,
  solver?: string
): FormId[] {
  // Try to find mapping for the specific simulation
  const simulationMapping = PROJECT_FORM_MAPPING[simulation as SimulationId];

  if (!simulationMapping) {
    // Fall back to default if simulation not found
    const defaultMapping = PROJECT_FORM_MAPPING.default;
    return defaultMapping?.default || ['general.basic.info'];
  }

  // Try to find mapping for the specific solver
  const forms = simulationMapping[solver as SolverId] ||
                simulationMapping.default ||
                ['general.basic.info'];

  return forms;
}


// <------- Define project form mapping below ------->

// Depth-based project form mapping: simulation -> solver -> forms
export const PROJECT_FORM_MAPPING: ProjectFormMapping = {
  concentration_diffusion: {
    lbm: ["simulation.concentration_diffusion.lbm"],
    default: ["simulation.concentration_diffusion.lbm"],
  },
  default: {
    default: ["general.basic.info"], // Ultimate fallback
  },
} as const;

// <---------------------------------------------------------->
