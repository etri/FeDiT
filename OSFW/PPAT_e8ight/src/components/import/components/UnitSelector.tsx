/**
 * @file UnitSelector.tsx
 * @description Unit selector component for STL import
 */

import { Dropdown } from 'primereact/dropdown';
import { useImportStore, type SourceUnit } from '../hooks/useImportStore';

interface UnitSelectorProps {
  disabled?: boolean;
}

const UNIT_OPTIONS = [
  { label: 'mm (밀리미터)', value: 'mm' as SourceUnit },
  { label: 'cm (센티미터)', value: 'cm' as SourceUnit },
  { label: 'm (미터)', value: 'm' as SourceUnit },
  { label: 'inch (인치)', value: 'inch' as SourceUnit },
];

export default function UnitSelector({ disabled = false }: UnitSelectorProps) {
  const { 
    sourceUnit, 
    setSourceUnit, 
    scaleFactor, 
    originalBounds 
  } = useImportStore();

  // Calculate scaled dimensions
  const getScaledSize = () => {
    if (!originalBounds) return null;
    
    return {
      x: originalBounds.size.x * scaleFactor,
      y: originalBounds.size.y * scaleFactor,
      z: originalBounds.size.z * scaleFactor,
    };
  };

  const scaledSize = getScaledSize();

  return (
    <div className="unit-selector">
      <label 
        style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: 500 
        }}
      >
        원본 단위
      </label>
      
      <Dropdown
        value={sourceUnit}
        options={UNIT_OPTIONS}
        onChange={(e) => setSourceUnit(e.value)}
        optionLabel="label"
        optionValue="value"
        disabled={disabled}
        style={{ width: '100%' }}
        placeholder="단위 선택"
      />

      {/* Scale info */}
      <div 
        style={{ 
          marginTop: '0.75rem',
          padding: '0.5rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ color: '#666' }}>변환 배율:</span>
          <span style={{ fontWeight: 500 }}>×{scaleFactor}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#666' }}>목표 단위:</span>
          <span style={{ fontWeight: 500 }}>m (미터)</span>
        </div>
      </div>

      {/* Original and converted size */}
      {originalBounds && (
        <div 
          style={{ 
            marginTop: '0.75rem',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ color: '#666', marginBottom: '0.25rem' }}>원본 크기:</div>
            <div 
              style={{ 
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              {originalBounds.size.x.toFixed(2)} × {originalBounds.size.y.toFixed(2)} × {originalBounds.size.z.toFixed(2)} {sourceUnit}
            </div>
          </div>
          
          {scaledSize && (
            <div>
              <div style={{ color: '#666', marginBottom: '0.25rem' }}>변환 후:</div>
              <div 
                style={{ 
                  fontFamily: 'monospace',
                  backgroundColor: '#e8f5e9',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  color: '#2e7d32'
                }}
              >
                {scaledSize.x.toFixed(4)} × {scaledSize.y.toFixed(4)} × {scaledSize.z.toFixed(4)} m
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
