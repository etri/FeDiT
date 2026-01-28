import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import './GenerateCaseDialog.css';

export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface GenerateStep {
  id: string;
  label: string;
  status: StepStatus;
  message?: string;
}

interface GenerateCaseDialogProps {
  visible: boolean;
  steps: GenerateStep[];
  onHide: () => void;
}

export function GenerateCaseDialog({ visible, steps, onHide }: GenerateCaseDialogProps) {
  const allCompleted = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error');

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'pending':
        return <i className="pi pi-circle step-icon step-pending" />;
      case 'running':
        return <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="6" />;
      case 'completed':
        return <i className="pi pi-check-circle step-icon step-completed" />;
      case 'error':
        return <i className="pi pi-times-circle step-icon step-error" />;
    }
  };

  return (
    <Dialog
      header="Generate OpenFOAM Case"
      visible={visible}
      style={{ width: '500px' }}
      onHide={onHide}
      closable={allCompleted || hasError}
      closeOnEscape={allCompleted || hasError}
      dismissableMask={false}
      draggable={false}
      resizable={false}
    >
      <div className="generate-case-steps">
        {steps.map((step, index) => (
          <div key={step.id} className={`step-item step-${step.status}`}>
            <div className="step-indicator">
              <div className="step-number-wrapper">
                {getStepIcon(step.status)}
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${step.status === 'completed' ? 'completed' : ''}`} />
              )}
            </div>
            <div className="step-content">
              <div className="step-label">{step.label}</div>
              {step.message && (
                <div className="step-message">{step.message}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="success-message">
          <i className="pi pi-check-circle" style={{ fontSize: '1.5rem', color: '#22c55e' }} />
          <span>케이스 생성이 완료되었습니다!</span>
        </div>
      )}

      {hasError && (
        <div className="error-message">
          <i className="pi pi-times-circle" style={{ fontSize: '1.5rem', color: '#ef4444' }} />
          <span>케이스 생성 중 오류가 발생했습니다.</span>
        </div>
      )}
    </Dialog>
  );
}
