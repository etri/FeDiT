import * as THREE from 'three';

export interface VehicleDimensions {
  length: number;
  width: number;
  height: number;
  orientation: 'X' | 'Y' | 'Z';
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
}

/**
 * Detects vehicle orientation based on bounding box dimensions
 * Assumes the longest horizontal dimension is the vehicle length (front-to-rear)
 * @param boundingBox - Three.js Box3 object containing model bounds
 * @returns Vehicle dimensions and detected orientation
 */
export function detectVehicleOrientation(boundingBox: THREE.Box3): VehicleDimensions {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  boundingBox.getSize(size);
  boundingBox.getCenter(center);

  // Get dimensions
  const xSize = size.x;
  const ySize = size.y;
  const zSize = size.z;

  // Height is typically Y-axis (vertical)
  const height = ySize;

  // Determine which horizontal axis is longer (X or Z)
  // The longer axis is assumed to be the vehicle length
  let length: number;
  let width: number;
  let orientation: 'X' | 'Y' | 'Z';

  if (xSize > zSize) {
    // X-axis is longer, so vehicle is oriented along X
    length = xSize;
    width = zSize;
    orientation = 'X';
  } else {
    // Z-axis is longer, so vehicle is oriented along Z
    length = zSize;
    width = xSize;
    orientation = 'Z';
  }

  // Sanity check: if Y is the longest dimension, something might be wrong
  // (vehicle might be vertical), but we'll handle it
  if (ySize > length) {
    console.warn('Vehicle appears to be oriented vertically. Adjusting detection...');
    // Swap height with length
    length = ySize;
    orientation = 'Y';

    // Re-determine width and actual height
    if (xSize > zSize) {
      width = zSize;
    } else {
      width = xSize;
    }
  }

  return {
    length,
    width,
    height,
    orientation,
    boundingBox,
    center
  };
}

/**
 * Calculates domain bounds based on vehicle dimensions and extension settings
 * @param vehicleDims - Vehicle dimensions from orientation detection
 * @param frontExtension - Multiple of vehicle length to extend in front
 * @param rearExtension - Multiple of vehicle length to extend in rear
 * @param sideRatio - Multiple of vehicle width for total side width
 * @param heightRatio - Multiple of vehicle height for total height
 * @returns New bounding box for the domain
 */
export function calculateDomainBounds(
  vehicleDims: VehicleDimensions,
  frontExtension: number = 3,
  rearExtension: number = 7,
  sideRatio: number = 5,
  heightRatio: number = 5
): THREE.Box3 {
  const { length, width, height, orientation, center, boundingBox } = vehicleDims;

  // Calculate domain dimensions
  const totalWidth = width * sideRatio;

  // Calculate total domain height
  // Domain starts at ground (Y=0) and extends upward based on vehicle height and ratio
  const totalDomainHeight = height * heightRatio;

  // Log vehicle position info
  const vehicleMinY = boundingBox.min.y;
  const vehicleMaxY = boundingBox.max.y;
  const isFloating = vehicleMinY > 0.001; // Tolerance for floating point

  console.log('🚗 Vehicle Position:', {
    minY: vehicleMinY.toFixed(3),
    maxY: vehicleMaxY.toFixed(3),
    height: height.toFixed(3),
    isFloating: isFloating
  });

  // Create domain bounds based on orientation
  const domainMin = new THREE.Vector3();
  const domainMax = new THREE.Vector3();

  if (orientation === 'X') {
    // Vehicle is oriented along X-axis
    domainMin.x = center.x - length / 2 - (length * frontExtension);
    domainMax.x = center.x + length / 2 + (length * rearExtension);

    domainMin.z = center.z - totalWidth / 2;
    domainMax.z = center.z + totalWidth / 2;

    // Always start domain at ground level (Y=0)
    domainMin.y = 0;
    domainMax.y = totalDomainHeight;
  } else if (orientation === 'Z') {
    // Vehicle is oriented along Z-axis
    domainMin.z = center.z - length / 2 - (length * frontExtension);
    domainMax.z = center.z + length / 2 + (length * rearExtension);

    domainMin.x = center.x - totalWidth / 2;
    domainMax.x = center.x + totalWidth / 2;

    // Always start domain at ground level (Y=0)
    domainMin.y = 0;
    domainMax.y = totalDomainHeight;
  } else {
    // Vehicle is oriented along Y-axis (unusual case)
    console.warn('Handling vertical vehicle orientation');

    domainMin.y = center.y - length / 2 - (length * frontExtension);
    domainMax.y = center.y + length / 2 + (length * rearExtension);

    domainMin.x = center.x - totalWidth / 2;
    domainMax.x = center.x + totalWidth / 2;

    domainMin.z = center.z - width / 2;
    domainMax.z = center.z + width / 2;
  }

  console.log('🔷 Domain Generated:', {
    size: `${(domainMax.x - domainMin.x).toFixed(2)}m × ${(domainMax.y - domainMin.y).toFixed(2)}m × ${(domainMax.z - domainMin.z).toFixed(2)}m`,
    ground: `Y: ${domainMin.y.toFixed(2)}m to ${domainMax.y.toFixed(2)}m`,
    extensions: `Front: ${frontExtension}×L, Rear: ${rearExtension}×L, Side: ${sideRatio}×W, Height: ${heightRatio}×H`
  });

  return new THREE.Box3(domainMin, domainMax);
}

/**
 * Creates a wireframe mesh for visualizing the domain
 * @param domainBounds - The bounding box for the domain
 * @param color - Color for the wireframe (default: cyan)
 * @returns Three.js LineSegments object for the domain wireframe
 */
export function createDomainWireframe(
  domainBounds: THREE.Box3,
  color: number = 0x00ffff
): THREE.LineSegments {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  domainBounds.getSize(size);
  domainBounds.getCenter(center);

  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 2,
    transparent: true,
    opacity: 0.8
  });

  const wireframe = new THREE.LineSegments(edges, material);
  wireframe.position.copy(center);
  wireframe.name = 'domainWireframe';

  return wireframe;
}

/**
 * Creates plane helpers for domain boundaries with inlet/outlet visualization
 * @param domainBounds - The bounding box for the domain
 * @param vehicleOrientation - The detected vehicle orientation
 * @returns Array of plane meshes for visualization
 */
export function createDomainPlanes(
  domainBounds: THREE.Box3,
  vehicleOrientation: 'X' | 'Y' | 'Z' | null = null,
  isFlipped: boolean = false
): THREE.Mesh[] {
  const planes: THREE.Mesh[] = [];
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  domainBounds.getSize(size);
  domainBounds.getCenter(center);

  // Wall material (gray)
  const wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x808080,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
  });

  // Inlet material (blue)
  const inletMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });

  // Outlet material (red)
  const outletMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });

  // Bottom plane (ground - wall)
  const groundGeometry = new THREE.PlaneGeometry(size.x, size.z);
  const ground = new THREE.Mesh(groundGeometry, wallMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, domainBounds.min.y, center.z);
  ground.name = 'domainGround';
  planes.push(ground);

  // Top plane (wall)
  const topGeometry = new THREE.PlaneGeometry(size.x, size.z);
  const top = new THREE.Mesh(topGeometry, wallMaterial);
  top.rotation.x = Math.PI / 2;
  top.position.set(center.x, domainBounds.max.y, center.z);
  top.name = 'domainTop';
  planes.push(top);

  // Create inlet/outlet based on vehicle orientation
  // When flipped, swap the inlet/outlet positions
  const actualInletMaterial = isFlipped ? outletMaterial : inletMaterial;
  const actualOutletMaterial = isFlipped ? inletMaterial : outletMaterial;

  if (vehicleOrientation === 'X') {
    // Vehicle is oriented along X-axis
    // Inlet at min X (front of domain) - or max X if flipped
    const inletGeometry = new THREE.PlaneGeometry(size.z, size.y);
    const inlet = new THREE.Mesh(inletGeometry, actualInletMaterial);
    inlet.rotation.y = Math.PI / 2;
    inlet.position.set(domainBounds.min.x, center.y, center.z);
    inlet.name = isFlipped ? 'domainOutlet' : 'domainInlet';
    planes.push(inlet);

    // Outlet at max X (rear of domain) - or min X if flipped
    const outletGeometry = new THREE.PlaneGeometry(size.z, size.y);
    const outlet = new THREE.Mesh(outletGeometry, actualOutletMaterial);
    outlet.rotation.y = -Math.PI / 2;
    outlet.position.set(domainBounds.max.x, center.y, center.z);
    outlet.name = isFlipped ? 'domainInlet' : 'domainOutlet';
    planes.push(outlet);

    // Side walls (Z min and max)
    const sideWall1Geometry = new THREE.PlaneGeometry(size.x, size.y);
    const sideWall1 = new THREE.Mesh(sideWall1Geometry, wallMaterial);
    sideWall1.position.set(center.x, center.y, domainBounds.min.z);
    sideWall1.name = 'domainSideWall1';
    planes.push(sideWall1);

    const sideWall2Geometry = new THREE.PlaneGeometry(size.x, size.y);
    const sideWall2 = new THREE.Mesh(sideWall2Geometry, wallMaterial);
    sideWall2.rotation.y = Math.PI;
    sideWall2.position.set(center.x, center.y, domainBounds.max.z);
    sideWall2.name = 'domainSideWall2';
    planes.push(sideWall2);

  } else if (vehicleOrientation === 'Z') {
    // Vehicle is oriented along Z-axis
    // Inlet at min Z (front of domain) - or max Z if flipped
    const inletGeometry = new THREE.PlaneGeometry(size.x, size.y);
    const inlet = new THREE.Mesh(inletGeometry, actualInletMaterial);
    inlet.position.set(center.x, center.y, domainBounds.min.z);
    inlet.name = isFlipped ? 'domainOutlet' : 'domainInlet';
    planes.push(inlet);

    // Outlet at max Z (rear of domain) - or min Z if flipped
    const outletGeometry = new THREE.PlaneGeometry(size.x, size.y);
    const outlet = new THREE.Mesh(outletGeometry, actualOutletMaterial);
    outlet.rotation.y = Math.PI;
    outlet.position.set(center.x, center.y, domainBounds.max.z);
    outlet.name = isFlipped ? 'domainInlet' : 'domainOutlet';
    planes.push(outlet);

    // Side walls (X min and max)
    const sideWall1Geometry = new THREE.PlaneGeometry(size.z, size.y);
    const sideWall1 = new THREE.Mesh(sideWall1Geometry, wallMaterial);
    sideWall1.rotation.y = Math.PI / 2;
    sideWall1.position.set(domainBounds.min.x, center.y, center.z);
    sideWall1.name = 'domainSideWall1';
    planes.push(sideWall1);

    const sideWall2Geometry = new THREE.PlaneGeometry(size.z, size.y);
    const sideWall2 = new THREE.Mesh(sideWall2Geometry, wallMaterial);
    sideWall2.rotation.y = -Math.PI / 2;
    sideWall2.position.set(domainBounds.max.x, center.y, center.z);
    sideWall2.name = 'domainSideWall2';
    planes.push(sideWall2);
  }

  return planes;
}

/**
 * Creates flow direction arrows for the domain
 * @param domainBounds - The bounding box for the domain
 * @param vehicleOrientation - The detected vehicle orientation
 * @param isFlipped - Whether the flow direction is flipped
 * @returns Group containing arrow helpers showing flow direction
 */
/**
 * Make arrow cone smoother by increasing radial segments
 */
function makeArrowSmoother(arrow: THREE.ArrowHelper) {
  // ArrowHelper has two children: line and cone
  arrow.children.forEach((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      if (geometry instanceof THREE.ConeGeometry) {
        // Replace cone with smoother version (32 segments instead of default 8)
        const params = geometry.parameters;
        const smoothCone = new THREE.ConeGeometry(
          params.radius,
          params.height,
          32, // radialSegments (default is 8)
          params.heightSegments,
          params.openEnded,
          params.thetaStart,
          params.thetaLength
        );
        child.geometry.dispose();
        child.geometry = smoothCone;
      }
    }
  });
}

export function createFlowArrows(
  domainBounds: THREE.Box3,
  vehicleOrientation: 'X' | 'Y' | 'Z' | null = null,
  isFlipped: boolean = false
): THREE.Group {
  const arrowGroup = new THREE.Group();
  arrowGroup.name = 'flowArrows';

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  domainBounds.getSize(size);
  domainBounds.getCenter(center);

  // Arrow colors
  const inletColor = 0x0088ff;  // Bright blue for inlet
  const outletColor = 0xff4444; // Bright red for outlet

  if (vehicleOrientation === 'X') {
    // Flow along X-axis
    const arrowLength = size.x * 0.15; // 15% of domain length
    const direction = isFlipped ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);

    // Create multiple arrows at different Y and Z positions
    const yPositions = [center.y];
    const zPositions = [
      center.z,
      center.z + size.z * 0.3,
      center.z - size.z * 0.3
    ];

    for (const y of yPositions) {
      for (const z of zPositions) {
        // Inlet arrow
        const inletOrigin = new THREE.Vector3(
          domainBounds.min.x + arrowLength * 0.5,
          y,
          z
        );
        const inletArrow = new THREE.ArrowHelper(
          direction,
          inletOrigin,
          arrowLength,
          isFlipped ? outletColor : inletColor,
          arrowLength * 0.3,
          arrowLength * 0.2
        );
        inletArrow.name = 'inletArrow';
        makeArrowSmoother(inletArrow);
        arrowGroup.add(inletArrow);

        // Outlet arrow
        const outletOrigin = new THREE.Vector3(
          domainBounds.max.x - arrowLength * 1.5,
          y,
          z
        );
        const outletArrow = new THREE.ArrowHelper(
          direction,
          outletOrigin,
          arrowLength,
          isFlipped ? inletColor : outletColor,
          arrowLength * 0.3,
          arrowLength * 0.2
        );
        outletArrow.name = 'outletArrow';
        makeArrowSmoother(outletArrow);
        arrowGroup.add(outletArrow);
      }
    }
  } else if (vehicleOrientation === 'Z') {
    // Flow along Z-axis
    const arrowLength = size.z * 0.15; // 15% of domain length
    const direction = isFlipped ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);

    // Create multiple arrows at different X and Y positions
    const yPositions = [center.y];
    const xPositions = [
      center.x,
      center.x + size.x * 0.3,
      center.x - size.x * 0.3
    ];

    for (const y of yPositions) {
      for (const x of xPositions) {
        // Inlet arrow
        const inletOrigin = new THREE.Vector3(
          x,
          y,
          domainBounds.min.z + arrowLength * 0.5
        );
        const inletArrow = new THREE.ArrowHelper(
          direction,
          inletOrigin,
          arrowLength,
          isFlipped ? outletColor : inletColor,
          arrowLength * 0.3,
          arrowLength * 0.2
        );
        inletArrow.name = 'inletArrow';
        makeArrowSmoother(inletArrow);
        arrowGroup.add(inletArrow);

        // Outlet arrow
        const outletOrigin = new THREE.Vector3(
          x,
          y,
          domainBounds.max.z - arrowLength * 1.5
        );
        const outletArrow = new THREE.ArrowHelper(
          direction,
          outletOrigin,
          arrowLength,
          isFlipped ? inletColor : outletColor,
          arrowLength * 0.3,
          arrowLength * 0.2
        );
        outletArrow.name = 'outletArrow';
        makeArrowSmoother(outletArrow);
        arrowGroup.add(outletArrow);
      }
    }
  }

  return arrowGroup;
}