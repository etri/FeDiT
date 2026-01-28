/**
 * @file Models.tsx
 * @description Manager component for rendering all models in the scene
 * Supports: STL, GLTF/GLB, OBJ, PLY formats
 */

import { Suspense } from 'react';
import { useViewerStore } from '../../hooks/useViewerStore';
import STLModel from './STLModel';
import GLTFModel from './GLTFModel';
import OBJModel from './OBJModel';
import PLYModel from './PLYModel';

export default function Models() {
  const models = useViewerStore((state) => state.models);

  if (models.length === 0) return null;

  return (
    <group name="models-group">
      {models.map((model) => (
        <Suspense key={model.id} fallback={null}>
          {model.type === 'stl' && <STLModel model={model} />}
          {model.type === 'gltf' && <GLTFModel model={model} />}
          {model.type === 'obj' && <OBJModel model={model} />}
          {model.type === 'ply' && <PLYModel model={model} />}
        </Suspense>
      ))}
    </group>
  );
}
