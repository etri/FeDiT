import { lazy } from 'react';
import type { LazyExoticComponent, ComponentType } from 'react';
import type { FormSection } from '../components/workbench/ProjectSideMenu';

// FormConfig interface definition
export interface FormConfig {
  component: LazyExoticComponent<ComponentType<any>>;
  path: string; // path 필드 추가 (for reference only, not used in import)
  name?: string;
  icon?: string;
  sections?: FormSection[]; // Form sections with icons for sidebar navigation
}

// Type exports
export type FormCategory = keyof typeof FORM_CATEGORIES;
export type FormId = `${FormCategory}.${string}.${string}`;

// Helper to get form by ID with explicit return type
export function getFormById(formId: FormId): FormConfig | undefined {
  const [category, subcategory, key] = formId.split('.') as [FormCategory, string, string];
  const categoryData = FORM_CATEGORIES[category];
  if (!categoryData) return undefined;

  // Check if subcategory exists before accessing
  if (!(subcategory in categoryData)) return undefined;

  const subcategoryData = categoryData[subcategory as keyof typeof categoryData];
  if (!subcategoryData) return undefined;

  // Check if key exists before accessing
  if (!(key in subcategoryData)) return undefined;

  return subcategoryData[key as keyof typeof subcategoryData] as FormConfig;
}

// Type for FORM_CATEGORIES structure
type FormCategoriesType = {
  [category: string]: {
    [subcategory: string]: {
      [key: string]: FormConfig;
    };
  };
};

// Helper function: creates a FormConfig using a single options object
function createFormConfig(options: {
  component: LazyExoticComponent<ComponentType<any>>;
  path: string; // For reference/documentation only
  name?: string;
  icon?: string;
  sections?: FormSection[];
}): FormConfig {
  return {
    path: options.path,
    component: options.component,
    ...(options.name && { name: options.name }),
    ...(options.icon && { icon: options.icon }),
    ...(options.sections && { sections: options.sections }),
  };
}

// Export helper to get path by formId
// Returns path relative to ProjectPanel (src/components/workbench/)
export function getFormModulePath(formId: FormId): string | undefined {
  const formConfig = getFormById(formId);
  if (!formConfig || !formConfig.path) return undefined;

  // Convert path from formConfig location to ProjectPanel location
  // '../components/forms/...' → '../forms/...'
  return formConfig.path.replace('../components/forms/', '../forms/');
}


// <------- Configure form categories and forms below ------->

// Static lazy imports for Vite build optimization
// IMPORTANT: Use static imports instead of dynamic import(path) for proper bundling
const FORMS = {
  GENERAL_FORM: lazy(() => import('../components/forms/general/GeneralForm')),
  CONCENTRATION_DIFFUSION_LBM: lazy(() => import('../components/forms/simulation/concentration-diffusion/ConcentrationDiffusionLBM')),
} as const;

// Import FORM_SECTIONS from each form module
// These define the sidebar navigation items with icons
import { FORM_SECTIONS as CONCENTRATION_DIFFUSION_LBM_SECTIONS } from '../components/forms/simulation/concentration-diffusion/ConcentrationDiffusionLBM';

// Path strings for reference/documentation
const PATHS = {
  GENERAL_FORM: '../components/forms/general/GeneralForm',
  CONCENTRATION_DIFFUSION_LBM: '../components/forms/simulation/concentration-diffusion/ConcentrationDiffusionLBM',
} as const;

// Form configuration with lazy loading (3-level depth: category > subcategory > form)
export const FORM_CATEGORIES: FormCategoriesType = {
  general: {
    basic: {
      info: createFormConfig({
        component: FORMS.GENERAL_FORM,
        path: PATHS.GENERAL_FORM,
        name: "General Settings",
        icon: "pi pi-cog",
      }),
    },
  },

  simulation: {
    concentration_diffusion: {
      lbm: createFormConfig({
        component: FORMS.CONCENTRATION_DIFFUSION_LBM,
        path: PATHS.CONCENTRATION_DIFFUSION_LBM,
        sections: CONCENTRATION_DIFFUSION_LBM_SECTIONS
      }),
    },
  },
} as const;

// <-------------------------------------------------------->
