/**
 * @file GizmoModeSelector.tsx
 * @description Gizmo mode selector component (translate, rotate, scale)
 */

import { SelectButton } from 'primereact/selectbutton';
import { useImportStore, type GizmoMode } from '../hooks/useImportStore';

interface GizmoModeSelectorProps {
  disabled?: boolean;
}

const GIZMO_OPTIONS = [
  { label: '이동', value: 'translate' as GizmoMode, icon: 'pi pi-arrows-alt' },
  { label: '회전', value: 'rotate' as GizmoMode, icon: 'pi pi-sync' },
  { label: '크기', value: 'scale' as GizmoMode, icon: 'pi pi-arrows-h' },
];

export default function GizmoModeSelector({ disabled = false }: GizmoModeSelectorProps) {
  const { gizmoMode, setGizmoMode, cropEnabled } = useImportStore();

  const itemTemplate = (option: typeof GIZMO_OPTIONS[0]) => {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <i className={option.icon} style={{ fontSize: '0.9rem' }} />
        <span>{option.label}</span>
      </span>
    );
  };

  return (
    <div className="gizmo-mode-selector">
      <label 
        style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: 500,
          color: disabled || !cropEnabled ? '#999' : '#333'
        }}
      >
        기즈모 모드
      </label>
      <SelectButton
        value={gizmoMode}
        options={GIZMO_OPTIONS}
        onChange={(e) => e.value && setGizmoMode(e.value)}
        optionLabel="label"
        optionValue="value"
        itemTemplate={itemTemplate}
        disabled={disabled || !cropEnabled}
        style={{ width: '100%' }}
      />
      <div 
        style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.75rem', 
          color: '#666' 
        }}
      >
        {gizmoMode === 'translate' && '• 크롭 박스 위치를 이동합니다'}
        {gizmoMode === 'rotate' && '• 크롭 박스를 회전합니다'}
        {gizmoMode === 'scale' && '• 크롭 박스 크기를 조절합니다'}
      </div>
    </div>
  );
}
