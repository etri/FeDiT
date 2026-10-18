/**
 * @file ExportHandler.tsx
 * @description Component that exposes STL export functionality to the window object
 * This allows WorkbenchPage to trigger exports without prop drilling
 */

import { useEffect } from 'react';
import { useExportSTL } from '../hooks/useExportSTL';
import { useCaptureThumbnail } from '../hooks/useCaptureThumbnail';

export default function ExportHandler() {
  const { exportToSTL, exportCombinedSTL, getSTLData } = useExportSTL();
  const { captureThumbnail } = useCaptureThumbnail();

  useEffect(() => {
    // Expose export functions to window object
    (window as any).dreiViewerExportSTL = exportToSTL;
    (window as any).dreiViewerExportCombinedSTL = exportCombinedSTL;
    (window as any).dreiViewerGetSTLData = getSTLData;
    (window as any).dreiViewerCaptureThumbnail = captureThumbnail;

    //console.log('[Drei Viewer] STL export functions registered');

    return () => {
      // Cleanup on unmount
      delete (window as any).dreiViewerExportSTL;
      delete (window as any).dreiViewerExportCombinedSTL;
      delete (window as any).dreiViewerGetSTLData;
      delete (window as any).dreiViewerCaptureThumbnail;
    };
  }, [exportToSTL, exportCombinedSTL, getSTLData, captureThumbnail]);

  return null; // This component doesn't render anything
}
