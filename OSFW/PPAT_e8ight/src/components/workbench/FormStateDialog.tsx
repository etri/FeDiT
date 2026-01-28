import { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

interface FormStateDialogProps {
  visible: boolean;
  onHide: () => void;
  watchedValues: any;
  errors: any;
  touchedFields: any;
  formName?: string;
  simulation?: string;
  solver?: string;
}

const FormStateDialog: React.FC<FormStateDialogProps> = ({
  visible,
  onHide,
  watchedValues,
  errors,
  touchedFields,
  formName = 'Form',
}) => {
  const toast = useRef<Toast>(null);

  const handleClose = () => {
    onHide();
  };

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formatJson(watchedValues))
      .then(() => {
        toast.current?.show({
          severity: 'success',
          summary: 'Copied!',
          detail: 'JSON copied to clipboard',
          life: 3000
        });
      })
      .catch(() => {
        toast.current?.show({
          severity: 'error',
          summary: 'Failed',
          detail: 'Failed to copy to clipboard',
          life: 3000
        });
      });
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasTouched = Object.keys(touchedFields).length > 0;

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Close"
        icon="pi pi-times"
        severity="secondary"
        onClick={handleClose}
      />
      <Button
        label="Copy JSON"
        icon="pi pi-copy"
        onClick={handleCopyToClipboard}
        severity="info"
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <Dialog
        header={`${formName} State Inspector`}
        visible={visible}
        onHide={handleClose}
        footer={footer}
        style={{ width: '70vw', maxWidth: '900px' }}
        breakpoints={{ '960px': '90vw', '640px': '95vw' }}
        modal
        dismissableMask
      >
        <div className="flex flex-column gap-3">
          {hasErrors && (
            <div className="p-message p-message-error p-component">
              <span className="p-message-icon pi pi-times-circle"></span>
              <span className="p-message-text">
                Form has validation errors. Please fix them before saving.
              </span>
            </div>
          )}

          <Panel
            header="Watched Values (Current Form Data)"
            toggleable
            collapsed={false}
            className="form-state-panel"
          >
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '0.875rem',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace'
              }}
            >
              {formatJson(watchedValues)}
            </pre>
          </Panel>

          <Panel
            header={`Validation Errors ${hasErrors ? `(${Object.keys(errors).length})` : '(None)'}`}
            toggleable
            collapsed={!hasErrors}
            className="form-state-panel"
          >
            <pre
              style={{
                backgroundColor: hasErrors ? '#fff5f5' : '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '0.875rem',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                color: hasErrors ? '#c41e3a' : '#495057'
              }}
            >
              {hasErrors ? formatJson(errors) : '{}'}
            </pre>
          </Panel>

          <Panel
            header={`Touched Fields ${hasTouched ? `(${Object.keys(touchedFields).length})` : '(None)'}`}
            toggleable
            collapsed={!hasTouched}
            className="form-state-panel"
          >
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '0.875rem',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace'
              }}
            >
              {hasTouched ? formatJson(touchedFields) : '{}'}
            </pre>
          </Panel>

          <Panel
            header="Form Validation Summary"
            toggleable
            collapsed={true}
            className="form-state-panel"
          >
            <div className="flex flex-column gap-2">
              <div className="flex align-items-center gap-2">
                <i className={`pi ${hasErrors ? 'pi-times-circle' : 'pi-check-circle'}`}
                   style={{ color: hasErrors ? '#c41e3a' : '#16a34a' }}></i>
                <span>
                  Validation Status: <strong>{hasErrors ? 'Invalid' : 'Valid'}</strong>
                </span>
              </div>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle" style={{ color: '#3b82f6' }}></i>
                <span>
                  Total Fields: <strong>{Object.keys(watchedValues).length}</strong>
                </span>
              </div>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-user-edit" style={{ color: '#8b5cf6' }}></i>
                <span>
                  Touched Fields: <strong>{Object.keys(touchedFields).length}</strong>
                </span>
              </div>
              {hasErrors && (
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-exclamation-triangle" style={{ color: '#f59e0b' }}></i>
                  <span>
                    Error Count: <strong>{Object.keys(errors).length}</strong>
                  </span>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </Dialog>
    </>
  );
};

export default FormStateDialog;
