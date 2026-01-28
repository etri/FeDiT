/**
 * @file cropGeometry.ts
 * @description Utility functions for cropping geometry with proper clipping and capping
 */

import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

interface Vertex {
  x: number;
  y: number;
  z: number;
}

interface ClipEdge {
  start: Vertex;
  end: Vertex;
  planeKey: string;
}

const EPSILON = 1e-8;

/**
 * Check if two vertices are approximately equal
 */
function vertexEquals(v1: Vertex, v2: Vertex): boolean {
  return Math.abs(v1.x - v2.x) < EPSILON &&
         Math.abs(v1.y - v2.y) < EPSILON &&
         Math.abs(v1.z - v2.z) < EPSILON;
}

/**
 * Create a unique key for a vertex (for deduplication)
 */
function vertexKey(v: Vertex): string {
  const precision = 6;
  return `${v.x.toFixed(precision)},${v.y.toFixed(precision)},${v.z.toFixed(precision)}`;
}

/**
 * Check if a vertex is within bounds
 */
function isVertexInBounds(v: Vertex, min: [number, number, number], max: [number, number, number]): boolean {
  return v.x >= min[0] - EPSILON && v.x <= max[0] + EPSILON &&
         v.y >= min[1] - EPSILON && v.y <= max[1] + EPSILON &&
         v.z >= min[2] - EPSILON && v.z <= max[2] + EPSILON;
}

/**
 * Interpolate between two vertices
 */
function lerp(v1: Vertex, v2: Vertex, t: number): Vertex {
  return {
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t,
    z: v1.z + (v2.z - v1.z) * t,
  };
}

/**
 * Find intersection of line segment with axis-aligned plane
 * Returns t parameter (0 <= t <= 1) or -1 if no intersection
 */
function intersectLinePlane(
  v1: Vertex,
  v2: Vertex,
  axis: 'x' | 'y' | 'z',
  planeValue: number
): number {
  const p1 = v1[axis];
  const p2 = v2[axis];
  
  if (Math.abs(p2 - p1) < EPSILON) return -1; // Line parallel to plane
  
  const t = (planeValue - p1) / (p2 - p1);
  if (t < -EPSILON || t > 1 + EPSILON) return -1;
  
  return Math.max(0, Math.min(1, t));
}

/**
 * Clip a polygon against one plane of the bounding box
 * Uses Sutherland-Hodgman algorithm
 * Also collects edges that lie on the clipping plane for capping
 */
function clipPolygonAgainstPlane(
  vertices: Vertex[],
  axis: 'x' | 'y' | 'z',
  planeValue: number,
  isMinPlane: boolean,
  clipEdges: ClipEdge[],
  planeKey: string
): Vertex[] {
  if (vertices.length === 0) return [];
  
  const result: Vertex[] = [];
  const newVertices: Vertex[] = []; // Vertices created by clipping
  
  const isInside = (v: Vertex): boolean => {
    return isMinPlane ? v[axis] >= planeValue - EPSILON : v[axis] <= planeValue + EPSILON;
  };
  
  const isOnPlane = (v: Vertex): boolean => {
    return Math.abs(v[axis] - planeValue) < EPSILON;
  };
  
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    const currentInside = isInside(current);
    const nextInside = isInside(next);
    
    if (currentInside) {
      result.push(current);
      if (isOnPlane(current)) {
        newVertices.push(current);
      }
      
      if (!nextInside) {
        // Edge leaves the box
        const t = intersectLinePlane(current, next, axis, planeValue);
        if (t >= 0) {
          const intersection = lerp(current, next, t);
          result.push(intersection);
          newVertices.push(intersection);
        }
      }
    } else if (nextInside) {
      // Edge enters the box
      const t = intersectLinePlane(current, next, axis, planeValue);
      if (t >= 0) {
        const intersection = lerp(current, next, t);
        result.push(intersection);
        newVertices.push(intersection);
      }
    }
  }
  
  // If we have exactly 2 new vertices on the plane, add them as a clip edge
  if (newVertices.length >= 2) {
    for (let i = 0; i < newVertices.length - 1; i++) {
      if (!vertexEquals(newVertices[i], newVertices[i + 1])) {
        clipEdges.push({
          start: newVertices[i],
          end: newVertices[i + 1],
          planeKey
        });
      }
    }
  }
  
  return result;
}

/**
 * Clip a triangle against a bounding box
 * Returns array of triangles and collects clip edges for capping
 */
function clipTriangleWithEdges(
  v0: Vertex,
  v1: Vertex,
  v2: Vertex,
  min: [number, number, number],
  max: [number, number, number],
  allClipEdges: Map<string, ClipEdge[]>
): Vertex[][] {
  let polygon: Vertex[] = [v0, v1, v2];
  
  const getOrCreateEdges = (key: string): ClipEdge[] => {
    if (!allClipEdges.has(key)) {
      allClipEdges.set(key, []);
    }
    return allClipEdges.get(key)!;
  };
  
  // Clip against each plane of the bounding box
  // Min planes
  polygon = clipPolygonAgainstPlane(polygon, 'x', min[0], true, getOrCreateEdges('x-min'), 'x-min');
  if (polygon.length < 3) return [];
  
  polygon = clipPolygonAgainstPlane(polygon, 'y', min[1], true, getOrCreateEdges('y-min'), 'y-min');
  if (polygon.length < 3) return [];
  
  polygon = clipPolygonAgainstPlane(polygon, 'z', min[2], true, getOrCreateEdges('z-min'), 'z-min');
  if (polygon.length < 3) return [];
  
  // Max planes
  polygon = clipPolygonAgainstPlane(polygon, 'x', max[0], false, getOrCreateEdges('x-max'), 'x-max');
  if (polygon.length < 3) return [];
  
  polygon = clipPolygonAgainstPlane(polygon, 'y', max[1], false, getOrCreateEdges('y-max'), 'y-max');
  if (polygon.length < 3) return [];
  
  polygon = clipPolygonAgainstPlane(polygon, 'z', max[2], false, getOrCreateEdges('z-max'), 'z-max');
  if (polygon.length < 3) return [];
  
  // Triangulate the resulting polygon (fan triangulation)
  const triangles: Vertex[][] = [];
  for (let i = 1; i < polygon.length - 1; i++) {
    triangles.push([polygon[0], polygon[i], polygon[i + 1]]);
  }
  
  return triangles;
}

/**
 * Check if triangle intersects or is inside the bounding box
 */
function triangleIntersectsBox(
  v0: Vertex,
  v1: Vertex,
  v2: Vertex,
  min: [number, number, number],
  max: [number, number, number]
): boolean {
  // Quick check: if all vertices are outside on the same side, no intersection
  const allOutsideMinX = v0.x < min[0] && v1.x < min[0] && v2.x < min[0];
  const allOutsideMaxX = v0.x > max[0] && v1.x > max[0] && v2.x > max[0];
  const allOutsideMinY = v0.y < min[1] && v1.y < min[1] && v2.y < min[1];
  const allOutsideMaxY = v0.y > max[1] && v1.y > max[1] && v2.y > max[1];
  const allOutsideMinZ = v0.z < min[2] && v1.z < min[2] && v2.z < min[2];
  const allOutsideMaxZ = v0.z > max[2] && v1.z > max[2] && v2.z > max[2];
  
  if (allOutsideMinX || allOutsideMaxX || allOutsideMinY || allOutsideMaxY || allOutsideMinZ || allOutsideMaxZ) {
    return false;
  }
  
  return true;
}

/**
 * Build connected loops from clip edges
 */
function buildLoopsFromEdges(edges: ClipEdge[]): Vertex[][] {
  if (edges.length === 0) return [];
  
  const loops: Vertex[][] = [];
  const usedEdges = new Set<number>();
  
  // Build adjacency map
  const adjacency = new Map<string, { vertex: Vertex; edgeIndex: number }[]>();
  
  edges.forEach((edge, index) => {
    const startKey = vertexKey(edge.start);
    const endKey = vertexKey(edge.end);
    
    if (!adjacency.has(startKey)) adjacency.set(startKey, []);
    if (!adjacency.has(endKey)) adjacency.set(endKey, []);
    
    adjacency.get(startKey)!.push({ vertex: edge.end, edgeIndex: index });
    adjacency.get(endKey)!.push({ vertex: edge.start, edgeIndex: index });
  });
  
  // Build loops
  for (let startIdx = 0; startIdx < edges.length; startIdx++) {
    if (usedEdges.has(startIdx)) continue;
    
    const loop: Vertex[] = [];
    let currentVertex = edges[startIdx].start;
    loop.push(currentVertex);
    usedEdges.add(startIdx);
    currentVertex = edges[startIdx].end;
    
    let maxIterations = edges.length * 2;
    while (maxIterations-- > 0) {
      loop.push(currentVertex);
      
      const currentKey = vertexKey(currentVertex);
      const neighbors = adjacency.get(currentKey) || [];
      
      let found = false;
      for (const neighbor of neighbors) {
        if (!usedEdges.has(neighbor.edgeIndex)) {
          usedEdges.add(neighbor.edgeIndex);
          currentVertex = neighbor.vertex;
          found = true;
          break;
        }
      }
      
      if (!found) break;
      
      // Check if we've closed the loop
      if (vertexEquals(currentVertex, loop[0])) {
        break;
      }
    }
    
    if (loop.length >= 3) {
      loops.push(loop);
    }
  }
  
  return loops;
}

/**
 * Triangulate a 2D polygon using ear clipping (simplified)
 * Projects vertices to 2D based on the plane axis
 */
function triangulatePolygon(
  vertices: Vertex[],
  _axis: 'x' | 'y' | 'z',
  flipNormal: boolean
): Vertex[][] {
  if (vertices.length < 3) return [];
  
  // Simple fan triangulation for convex or nearly convex polygons
  const triangles: Vertex[][] = [];
  const center = vertices[0];
  
  for (let i = 1; i < vertices.length - 1; i++) {
    if (flipNormal) {
      triangles.push([center, vertices[i + 1], vertices[i]]);
    } else {
      triangles.push([center, vertices[i], vertices[i + 1]]);
    }
  }
  
  return triangles;
}

/**
 * Generate cap triangles for a clipping plane
 */
function generateCapTriangles(
  edges: ClipEdge[],
  planeKey: string,
  _min: [number, number, number],
  _max: [number, number, number]
): Vertex[][] {
  const loops = buildLoopsFromEdges(edges);
  const allTriangles: Vertex[][] = [];
  
  // Determine axis and whether to flip normal based on plane
  let axis: 'x' | 'y' | 'z';
  let flipNormal: boolean;
  
  switch (planeKey) {
    case 'x-min': axis = 'x'; flipNormal = true; break;
    case 'x-max': axis = 'x'; flipNormal = false; break;
    case 'y-min': axis = 'y'; flipNormal = true; break;
    case 'y-max': axis = 'y'; flipNormal = false; break;
    case 'z-min': axis = 'z'; flipNormal = true; break;
    case 'z-max': axis = 'z'; flipNormal = false; break;
    default: return [];
  }
  
  for (const loop of loops) {
    const triangles = triangulatePolygon(loop, axis, flipNormal);
    allTriangles.push(...triangles);
  }
  
  return allTriangles;
}

/**
 * Crop a BufferGeometry based on bounding box
 * Properly clips triangles at the boundary and optionally generates cap faces for clean edges
 * @param geometry - The geometry to crop
 * @param min - Minimum bounds [x, y, z]
 * @param max - Maximum bounds [x, y, z]
 * @param capCrossSection - Whether to generate cap faces for cut surfaces (default: true)
 */
export function cropBufferGeometry(
  geometry: THREE.BufferGeometry,
  min: [number, number, number],
  max: [number, number, number],
  capCrossSection: boolean = true
): THREE.BufferGeometry {
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  
  if (!positions) {
    throw new Error('Geometry must have position attribute');
  }

  const newPositions: number[] = [];
  const clipEdgesMap = new Map<string, ClipEdge[]>();

  // Helper to get vertex from positions attribute
  const getVertex = (index: number): Vertex => ({
    x: positions.getX(index),
    y: positions.getY(index),
    z: positions.getZ(index),
  });

  // Process triangles
  const processTriangle = (i0: number, i1: number, i2: number) => {
    const v0 = getVertex(i0);
    const v1 = getVertex(i1);
    const v2 = getVertex(i2);
    
    // Quick rejection test
    if (!triangleIntersectsBox(v0, v1, v2, min, max)) {
      return;
    }
    
    // Check if all vertices are inside (common case - no clipping needed)
    const allInside = isVertexInBounds(v0, min, max) && 
                      isVertexInBounds(v1, min, max) && 
                      isVertexInBounds(v2, min, max);
    
    if (allInside) {
      // Add triangle as-is
      newPositions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    } else {
      // Clip triangle against bounding box and collect clip edges
      const clippedTriangles = clipTriangleWithEdges(v0, v1, v2, min, max, clipEdgesMap);
      
      for (const tri of clippedTriangles) {
        newPositions.push(
          tri[0].x, tri[0].y, tri[0].z,
          tri[1].x, tri[1].y, tri[1].z,
          tri[2].x, tri[2].y, tri[2].z
        );
      }
    }
  };

  if (indices) {
    // Indexed geometry
    for (let i = 0; i < indices.count; i += 3) {
      processTriangle(indices.getX(i), indices.getX(i + 1), indices.getX(i + 2));
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < positions.count; i += 3) {
      processTriangle(i, i + 1, i + 2);
    }
  }

  // Generate cap triangles for each clipping plane (if enabled)
  if (capCrossSection) {
    for (const [planeKey, edges] of clipEdgesMap) {
      if (edges.length > 0) {
        const capTriangles = generateCapTriangles(edges, planeKey, min, max);
        for (const tri of capTriangles) {
          newPositions.push(
            tri[0].x, tri[0].y, tri[0].z,
            tri[1].x, tri[1].y, tri[1].z,
            tri[2].x, tri[2].y, tri[2].z
          );
        }
      }
    }
  }

  // Create new geometry
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

  // Compute normals
  newGeometry.computeVertexNormals();

  return newGeometry;
}

/**
 * Convert BufferGeometry to STL binary format
 */
export function geometryToSTLBinary(geometry: THREE.BufferGeometry): ArrayBuffer {
  const exporter = new STLExporter();
  
  // Create a temporary mesh for export
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  const stlString = exporter.parse(mesh);
  
  // Convert ASCII STL to binary
  const lines = stlString.split('\n');
  const vertices: number[] = [];
  const normals: number[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/);
      normals.push(
        parseFloat(parts[2]),
        parseFloat(parts[3]),
        parseFloat(parts[4])
      );
    } else if (line.startsWith('vertex')) {
      const parts = line.split(/\s+/);
      vertices.push(
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      );
    }
  }

  const triangleCount = vertices.length / 9;
  const buffer = new ArrayBuffer(80 + 4 + triangleCount * 50);
  const view = new DataView(buffer);
  
  // Header (80 bytes)
  const header = 'STL Binary Format - Generated by NFLOW';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  }
  
  // Triangle count (4 bytes)
  view.setUint32(80, triangleCount, true);
  
  // Triangles (50 bytes each: 12 bytes normal + 36 bytes vertices + 2 bytes attribute)
  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    const normalIdx = i * 3;
    const vertexIdx = i * 9;
    
    // Normal
    view.setFloat32(offset, normals[normalIdx], true);
    view.setFloat32(offset + 4, normals[normalIdx + 1], true);
    view.setFloat32(offset + 8, normals[normalIdx + 2], true);
    
    // Vertices
    for (let j = 0; j < 9; j++) {
      view.setFloat32(offset + 12 + j * 4, vertices[vertexIdx + j], true);
    }
    
    // Attribute byte count (2 bytes, usually 0)
    view.setUint16(offset + 48, 0, true);
    
    offset += 50;
  }
  
  return buffer;
}
