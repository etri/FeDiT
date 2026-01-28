/**
 * @file FitToBoxButton.tsx
 * @description Floating button to trigger fit-to-box camera adjustment
 * Rendered outside Canvas with fixed 2D screen positioning
 */

interface FitToBoxButtonProps {
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * Fit to Box button component - rendered outside Canvas for fixed screen position
 */
export function FitToBoxButton({ position }: FitToBoxButtonProps) {
  // Default position: top-right corner
  const defaultPosition = {
    top: '20px',
    right: '20px',
    ...position
  };

  const handleClick = () => {
    console.log('[FitToBoxButton] Fit to box triggered');
    // Call window-exposed fitToBox function from FitToBoxHandler
    if ((window as any).dreiViewerFitToBox) {
      (window as any).dreiViewerFitToBox();
    } else {
      console.warn('[FitToBoxButton] Fit to box function not available');
    }
  };

  // Check if button should be centered (left: 50%)
  const isCentered = position?.left === '50%';

  return (
    <button
      onClick={handleClick}
      className="fit-to-box-button"
      style={{
        position: 'absolute',
        ...defaultPosition,
        zIndex: 1000,
        width: '44px',
        height: '44px',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        // Center horizontally when left: 50%
        ...(isCentered && { transform: 'translateX(-50%)' }),
      }}
      title="Fit to Box (전체 모델 보기)"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        const baseTransform = isCentered ? 'translateX(-50%) ' : '';
        e.currentTarget.style.transform = `${baseTransform}scale(1.05)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        const baseTransform = isCentered ? 'translateX(-50%) ' : '';
        e.currentTarget.style.transform = `${baseTransform}scale(1)`;
      }}
    >
      <i className="pi pi-expand" style={{ fontSize: '18px' }}></i>
    </button>
  );
}
