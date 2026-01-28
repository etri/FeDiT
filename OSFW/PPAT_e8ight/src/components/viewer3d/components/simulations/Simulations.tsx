/**
 * @file Simulations.tsx
 * @description Simulations manager component
 * Conditionally renders simulation-specific components based on ViewerStore state
 */

import { useEffect } from 'react';
import useProjectStore from '../../../../stores/projectStore';
import { useViewerStore } from '../../hooks/useViewerStore';
import AnalysisDomainBox from './ConcentrationDiffusion/AnalysisDomainBox';
import ConcentrationMarker from './ConcentrationDiffusion/ConcentrationMarker';
import type { ConcentrationDiffusionLBMData } from '../../../../components/forms/simulation/concentration-diffusion/ConcentrationDiffusionLBM';

export default function Simulations() {
  const simulationType = useProjectStore((state) => state.simulationType);
  const formData = useProjectStore((state) => state.formData) as ConcentrationDiffusionLBMData | null;
  const setDomainDimensions = useViewerStore((state) => state.setDomainDimensions);

  // Update domain dimensions in ViewerStore when formData changes
  useEffect(() => {
    if (simulationType === 'concentration_diffusion' && formData) {
      const width = formData.domainMaxX - formData.domainMinX;
      const height = formData.domainMaxY - formData.domainMinY;
      const depth = formData.domainMaxZ - formData.domainMinZ;

      setDomainDimensions({
        width,
        height,
        depth,
        centerX: formData.domainMinX + width / 2,
        centerY: formData.domainMinY + height / 2,
        centerZ: formData.domainMinZ + depth / 2,
      });

      // Dispatch domain update event for shadow regeneration
      window.dispatchEvent(new Event('domainUpdated'));
    } else {
      setDomainDimensions(null);
    }
  }, [simulationType, formData, setDomainDimensions]);

  // Concentration diffusion visualization
  if (simulationType === 'concentration_diffusion' && formData) {
    return (
      <>
        {/* Analysis Domain Box */}
        <AnalysisDomainBox
          min={[formData.domainMinX, formData.domainMinY, formData.domainMinZ]}
          max={[formData.domainMaxX, formData.domainMaxY, formData.domainMaxZ]}
          visible={true}
        />

        {/* Concentration Marker */}
        <ConcentrationMarker
          point={[
            formData.initialConcentrationPointX,
            formData.initialConcentrationPointY,
            formData.initialConcentrationPointZ,
          ]}
          width={formData.initialConcentrationWidth}
          visible={true}
        />
      </>
    );
  }

  return null;
}
