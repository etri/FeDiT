import { create } from 'zustand';

interface ProjectState {
  // Project metadata
  projectName: string;
  simulationType: string;
  solverType: string;

  // Form data storage
  formData: any;

  // Actions
  setProjectData: (data: Partial<Pick<ProjectState, 'projectName' | 'simulationType' | 'solverType'>>) => void;
  setFormData: (data: any) => void;
  clearProjectData: () => void;
}

const useProjectStore = create<ProjectState>((set) => ({
  // Initial state - concentration_diffusion + LBM 기본값
  projectName: 'Concentration Diffusion',
  simulationType: 'concentration_diffusion',
  solverType: 'lbm',
  formData: null,

  // Actions
  setProjectData: (data) => set(data),

  setFormData: (data) => set({ formData: data }),

  clearProjectData: () => set({
    projectName: 'Concentration Diffusion',
    simulationType: 'concentration_diffusion',
    solverType: 'lbm',
    formData: null
  })
}));

export default useProjectStore;
