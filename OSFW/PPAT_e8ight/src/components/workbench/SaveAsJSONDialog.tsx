import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { convertProjectData } from '../../utils/json';

interface SaveAsJSONDialogProps {
  visible: boolean;
  onHide: () => void;
  formData: any;
  simulation?: string;
  solver?: string;
}

const SaveAsJSONDialog: React.FC<SaveAsJSONDialogProps> = ({
  visible,
  onHide,
  formData,
  simulation,
  solver,
}) => {
  const [fileName, setFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useRef<Toast>(null);

  const handleClose = () => {
    setFileName('');
    setIsSaving(false);
    onHide();
  };

  const handleSave = async () => {
    if (!fileName.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      // Form 데이터를 solver JSON으로 변환
      const solverJson = convertProjectData(
        simulation || '',
        solver?.toLowerCase() || '',
        formData
      );

      // JSON 파일 다운로드
      const blob = new Blob([JSON.stringify(solverJson, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.trim()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.current?.show({
        severity: 'success',
        summary: '성공',
        detail: `${fileName}.json 파일이 다운로드되었습니다.`,
        life: 3000
      });

      handleClose();

    } catch (error: any) {
      console.error('JSON 저장 실패:', error);
      toast.current?.show({
        severity: 'error',
        summary: '저장 실패',
        detail: error.message || 'JSON 변환 중 오류가 발생했습니다.',
        life: 5000
      });
      setIsSaving(false);
    }
  };

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const footer = (
    <div className="flex justify-content-end">
      <Button
        label="Save"
        icon={isSaving ? "pi pi-spin pi-spinner" : "pi pi-download"}
        onClick={handleSave}
        disabled={!fileName.trim() || isSaving}
        loading={isSaving}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Save as JSON"
        visible={visible}
        onHide={handleClose}
        footer={footer}
        style={{
          width: "70vw",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        breakpoints={{ "960px": "90vw", "640px": "95vw" }}
        modal
        dismissableMask={!isSaving}
        closable={!isSaving}
        pt={{
          content: { style: { paddingBottom: "0.1rem" } },
          footer: { style: { padding: "1rem" } },
        }}
      >
        <Divider className="m-0 mb-3" />

        <div className="flex flex-column gap-3">
          {/* File Name Input */}
          <div className="flex flex-column gap-2">
            <label htmlFor="fileName" className="font-semibold">
              File Name
            </label>
            <div className="p-inputgroup">
              <InputText
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                disabled={isSaving}
                autoFocus
              />
              <span className="p-inputgroup-addon">.json</span>
            </div>
          </div>

          {/* Settings Preview */}
          <div className="flex flex-column gap-2">
            <label className="font-semibold">
              Settings Preview
            </label>
            <InputTextarea
              value={formatJson(formData)}
              readOnly
              rows={15}
              style={{
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: "0.875rem",
                resize: "none",
                width: "100%",
                backgroundColor: "#f5f5f5",
              }}
            />
          </div>

          <Divider className="m-0" />
        </div>
      </Dialog>
    </>
  );
};

export default SaveAsJSONDialog;
