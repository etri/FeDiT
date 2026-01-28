import { Suspense, useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import useProjectStore from '../../stores/projectStore';
import { getFormById, type FormId } from '../../configs/formConfig';
import { getFormsForProject } from '../../configs/projectConfig';
import type { FormRef } from '../../types/formTypes';
import type { FormSection } from './ProjectSideMenu';
import '../../styles/project-panel.css';

interface ProjectPanelProps {
  visible: boolean;
  onHide: () => void;
  activeSection?: string;
  onFormSectionsChange?: (sections: FormSection[]) => void;
}

const ProjectPanel = ({
  visible,
  onHide: _onHide,  // Prefixed with _ since it's not used
  activeSection,
  onFormSectionsChange
}: ProjectPanelProps) => {
  const simulationType = useProjectStore(state => state.simulationType);
  const solverType = useProjectStore(state => state.solverType);
  const formData = useProjectStore(state => state.formData);

  // Get forms based on simulation and solver attributes
  // Note: Only the first form is used (one form per project constraint)
  const availableFormIds = getFormsForProject(
    simulationType,
    solverType
  );
  const primaryFormId = availableFormIds[0]; // Use only the first form
  // Single form ref (simplified from multiple refs)
  const formRef = useRef<FormRef | null>(null);
  const toast = useRef<Toast>(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  // State for managing content rendering during transitions
  const [shouldRenderContent, setShouldRenderContent] = useState(visible);

  // State for form sections
  const [formSections, setFormSections] = useState<FormSection[]>([]);

  // Manage content rendering based on visibility
  useEffect(() => {
    if (visible) {
      // Panel is opening - immediately render content
      setShouldRenderContent(true);
    }
    // When closing, keep content rendered until transition completes
    // setShouldRenderContent(false) will be called in handleTransitionEnd
  }, [visible]);

  // Manage loading state based on data readiness
  useEffect(() => {
    // Required data check
    // Note: formData can be null, undefined, or {} for new projects - all are valid states
    // Only undefined means data hasn't been loaded yet
    if (!simulationType || !solverType || formData === undefined) {
      setIsLoading(true);
    } else {
      // All data ready (including empty formData for new projects)
      setIsLoading(false);
    }
  }, [simulationType, solverType, formData]);

  // Note: Form data is now passed as initialData prop to the form component
  // This prevents flickering and ensures data is ready when form renders

  // Load and expose form sections
  useEffect(() => {
    if (!primaryFormId) {
      setFormSections([]);
      onFormSectionsChange?.([]);
      return;
    }

    // Get form configuration (sections are now statically imported)
    const formConfig = getFormById(primaryFormId);

    if (!formConfig || !formConfig.sections) {
      // Form doesn't have sections
      setFormSections([]);
      onFormSectionsChange?.([]);
      return;
    }

    // Set sections directly from formConfig (no dynamic import needed)
    setFormSections(formConfig.sections);
    onFormSectionsChange?.(formConfig.sections);
  }, [primaryFormId, onFormSectionsChange]);

  const renderForm = (formId: FormId) => {
    const form = getFormById(formId);
    if (!form) {
      return (
        <div style={{ padding: '1rem', color: '#666', textAlign: 'center' }}>
          Form not found: {formId}
        </div>
      );
    }

    const FormComponent = form.component;

    return (
      <div>
        {/* Form component - header removed to avoid duplication */}
        <Suspense fallback={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Loading form...</p>
          </div>
        }>
          <FormComponent
            ref={formRef}
            initialData={formData}
            activeSection={activeSection}
            visible={shouldRenderContent}
          />
        </Suspense>
      </div>
    );
  };

  // Handle transition end to cleanup after panel closes
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Only process 'left' property transition when panel is closing
    if (e.propertyName === 'left' && !visible) {
      // Stop rendering content after transition completes
      setShouldRenderContent(false);
      _onHide?.();
    }
  };

  // Get form configuration for header
  const formConfig = primaryFormId ? getFormById(primaryFormId) : undefined;

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <div
        className={`project-panel ${visible ? "visible" : ""}`}
        onTransitionEnd={handleTransitionEnd}
      >
      <div
        className="project-panel-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            margin: 0,
          }}
        >
          {(() => {
            // Find active section from formSections
            const activeFormSection = formSections.find(
              section => section.key === activeSection
            );

            // Use active section label if found
            if (activeFormSection) {
              return activeFormSection.label;
            }

            // Fallback to formConfig or default
            return formConfig?.name || "Project Settings";
          })()}
        </h3>
      </div>

      <div className="project-panel-content">
        {isLoading ? (
          // Show loading spinner while data is being fetched
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p>Loading project data...</p>
          </div>
        ) : shouldRenderContent ? (
          <>
            {/* Project Form Section */}
            {primaryFormId ? (
              <div>
                {/* Render only the primary (first) form */}
                {renderForm(primaryFormId)}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#666" }}>
                No forms available for this project configuration.
                <br />
                <span style={{ fontSize: "0.9rem" }}>
                  Simulation Type: {simulationType || "not set"}, Solver Type:{" "}
                  {solverType || "not set"}
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>
      </div>
    </>
  );
};

export default ProjectPanel;
