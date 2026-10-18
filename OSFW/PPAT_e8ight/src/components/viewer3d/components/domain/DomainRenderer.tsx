/**
 * @file DomainRenderer.tsx
 * @description Main domain rendering component that handles different domain shapes
 */

import React, { memo } from 'react';
import { useDomainStore } from '../../stores/domainStore';
import BoxDomainRenderer from './BoxDomainRenderer';
import CylinderDomainRenderer from './CylinderDomainRenderer';
import SphereDomainRenderer from './SphereDomainRenderer';
import CustomDomainRenderer from './CustomDomainRenderer';
import RefinementRegions from './RefinementRegions';

const DomainRenderer: React.FC = () => {
  const domain = useDomainStore((state) => state.domain);
  const showMeshPreview = useDomainStore((state) => state.showMeshPreview);

  if (!domain || !domain.display.visible) {
    return null;
  }

  const renderDomain = () => {
    switch (domain.shape) {
      case 'box':
        return <BoxDomainRenderer domain={domain} />;
      case 'cylinder':
        return <CylinderDomainRenderer domain={domain} />;
      case 'sphere':
        return <SphereDomainRenderer domain={domain} />;
      case 'custom':
        return <CustomDomainRenderer domain={domain} />;
      default:
        console.warn(`Unknown domain shape: ${(domain as any).shape}`);
        return null;
    }
  };

  return (
    <group name="domain-renderer">
      {/* Main domain geometry */}
      {renderDomain()}

      {/* Refinement regions */}
      {domain.display.showRefinementRegions && domain.mesh.refinementRegions.length > 0 && (
        <RefinementRegions regions={domain.mesh.refinementRegions} />
      )}

      {/* Mesh preview (optional) */}
      {showMeshPreview && (
        <group name="mesh-preview">
          {/* TODO: Implement mesh preview visualization */}
        </group>
      )}
    </group>
  );
};

export default memo(DomainRenderer);