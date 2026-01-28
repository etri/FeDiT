import { Tooltip } from 'primereact/tooltip';
import '../../styles/project-side-menu.css';

export interface FormSection {
  key: string;
  label: string;
  icon: string;
}

interface ProjectSideMenuProps {
  formSections?: FormSection[];
  activeSection?: string;
  onSectionClick?: (sectionKey: string) => void;
}

function ProjectSideMenu({
  formSections = [],
  activeSection,
  onSectionClick
}: ProjectSideMenuProps) {
  return (
    <div className="project-side-menu">
      <Tooltip target=".menu-item" position="right" className="project-menu-tooltip" />

      {/* Dynamic Form Section Buttons */}
      {formSections.map((section) => (
        <button
          key={section.key}
          className={`menu-item ${activeSection === section.key ? 'active' : ''}`}
          onClick={() => onSectionClick?.(section.key)}
          data-pr-tooltip={section.label}
          aria-label={section.label}
        >
          <i className={section.icon}></i>
        </button>
      ))}
    </div>
  );
}

export default ProjectSideMenu;
