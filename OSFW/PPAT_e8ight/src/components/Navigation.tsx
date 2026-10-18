import { useRef, useState } from "react";
import { Menubar } from "primereact/menubar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import useProjectStore from "../stores/projectStore";
import SaveAsJSONDialog from "./workbench/SaveAsJSONDialog";
import "../styles/navigation.css";

interface NavigationProps {
  title?: string;
  showSaveButton?: boolean;
}

function Navigation({
  title = "NFLOW Web",
  showSaveButton = false,
}: NavigationProps) {
  const toast = useRef<Toast>(null);

  // Dialog 상태
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Zustand에서 필요한 상태
  const formData = useProjectStore((state) => state.formData);
  const simulationType = useProjectStore((state) => state.simulationType);
  const solverType = useProjectStore((state) => state.solverType);

  // Save 버튼 클릭 핸들러
  const handleSaveButtonClick = () => {
    setShowSaveDialog(true);
  };

  // Empty menu items - Home removed
  const items: any[] = [];

  const start = (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-heart-fill" style={{ fontSize: "1.3rem" }}></i>
      <span className="font-bold text-xl">{title}</span>
    </div>
  );

  // 우측 영역 - Save as JSON 버튼
  const end = showSaveButton ? (
    <div className="flex align-items-center gap-2">
      <Button
        label="Save as JSON"
        aria-label="Save as JSON"
        icon="pi pi-download"
        onClick={handleSaveButtonClick}
        style={{
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      />
    </div>
  ) : null;

  return (
    <>
      <Toast ref={toast} />
      <Menubar
        model={items}
        start={start}
        end={end}
        style={{
          borderRadius: 0,
          backgroundColor: "var(--surface-card)",
        }}
      />

      {/* Save as JSON Dialog */}
      <SaveAsJSONDialog
        visible={showSaveDialog}
        onHide={() => setShowSaveDialog(false)}
        formData={formData}
        simulation={simulationType}
        solver={solverType}
      />
    </>
  );
}

export default Navigation;
