/**
 * @file RenderModeButton.tsx
 * @description Floating dropdown to select render modes
 * Rendered outside Canvas with fixed 2D screen positioning
 */

import { useState, useRef, useEffect } from 'react';
import { useViewerStore } from '../../hooks/useViewerStore';
import type { RenderMode } from '../../types/viewer.types';

interface RenderModeButtonProps {
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

// Render mode options with labels and icons
const RENDER_MODES: { value: RenderMode; label: string; icon: string }[] = [
  { value: 'solid', label: 'Solid', icon: 'pi-box' },
  { value: 'wireframe', label: 'Wireframe', icon: 'pi-th-large' },
  { value: 'points', label: 'Points', icon: 'pi-circle' },
  { value: 'solid+edges', label: 'Solid + Edges', icon: 'pi-stop' },
  { value: 'solid+wireframe', label: 'Solid + Wireframe', icon: 'pi-table' },
  { value: 'hidden-edges', label: 'Hidden Edges', icon: 'pi-eye-slash' },
];

/**
 * Render Mode dropdown component - rendered outside Canvas for fixed screen position
 */
export function RenderModeButton({ position }: RenderModeButtonProps) {
  const renderMode = useViewerStore((state) => state.displaySettings.renderMode);
  const setRenderMode = useViewerStore((state) => state.setRenderMode);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default position: next to fit-to-box button (right side)
  const defaultPosition = {
    top: '20px',
    left: 'calc(50% + 54px)', // 50% + 44px (fit-to-box width) + 10px (gap)
    ...position
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Reset button transform when closing
    if (!newIsOpen && dropdownRef.current) {
      const button = dropdownRef.current.querySelector('button');
      if (button) {
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      }
    }
  };

  const handleSelect = (mode: RenderMode) => {
    console.log('[RenderModeButton] Switching render mode:', renderMode, '->', mode);
    setRenderMode(mode);
    setIsOpen(false);

    // Reset button transform after selection
    if (dropdownRef.current) {
      const button = dropdownRef.current.querySelector('button');
      if (button) {
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      }
    }
  };

  // Get current mode info
  const currentMode = RENDER_MODES.find(mode => mode.value === renderMode) || RENDER_MODES[0];

  return (
    <div
      ref={dropdownRef}
      className="render-mode-dropdown"
      style={{
        position: 'absolute',
        ...defaultPosition,
        zIndex: 1000,
      }}
    >
      {/* Dropdown button */}
      <button
        onClick={handleToggle}
        className="render-mode-button"
        style={{
          width: '44px',
          height: '44px',
          padding: '0',
          margin: '0',
          boxSizing: 'border-box',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
        title={`Render Mode: ${currentMode.label}`}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <i className={`pi ${currentMode.icon}`} style={{ fontSize: '18px' }}></i>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px', // 44px button + 4px gap
            left: '0',
            minWidth: '180px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
          }}
        >
          {RENDER_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleSelect(mode.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: mode.value === renderMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                transition: 'background-color 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = mode.value === renderMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent';
              }}
            >
              <i className={`pi ${mode.icon}`} style={{ fontSize: '16px' }}></i>
              <span>{mode.label}</span>
              {mode.value === renderMode && (
                <i className="pi pi-check" style={{ fontSize: '14px', marginLeft: 'auto' }}></i>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
