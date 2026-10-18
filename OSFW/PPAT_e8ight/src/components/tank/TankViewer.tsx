import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type TankType = 'lbm' | 'sph';

interface TankConstants {
  width?: number;
  depth?: number;
  height: number;
  diameter?: number;
  type: 'rectangular' | 'circular';
}

interface TankViewerProps {
  tankType: TankType;
  waterHeight: number;
  tankConstants: TankConstants;
}

const TankViewer: React.FC<TankViewerProps> = ({ tankType, waterHeight, tankConstants }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.001, 100);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0.02, 0.05, 0.02);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.001;
    directionalLight.shadow.camera.far = 0.1;
    directionalLight.shadow.camera.left = -0.02;
    directionalLight.shadow.camera.right = 0.02;
    directionalLight.shadow.camera.top = 0.02;
    directionalLight.shadow.camera.bottom = -0.02;
    scene.add(directionalLight);

    // Grid helper (very small scale)
    const gridHelper = new THREE.GridHelper(0.02, 20, 0x888888, 0xcccccc);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Tank and water meshes (will be updated in render function)
    let tankMesh: THREE.Group;
    let waterMesh: THREE.Mesh | null = null;

    const createTank = () => {
      const tankGroup = new THREE.Group();

      if (tankType === 'lbm') {
        // Rectangular tank
        const tankWidth = tankConstants.width || 0.00595;
        const tankDepth = tankWidth; // Square base
        const tankHeight = tankConstants.height;

        // Tank walls (thin rectangles)
        const wallThickness = 0.0002;
        const wallMaterial = new THREE.MeshPhongMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.3
        });

        // Front wall
        const frontWall = new THREE.BoxGeometry(tankWidth, tankHeight, wallThickness);
        const frontWallMesh = new THREE.Mesh(frontWall, wallMaterial);
        frontWallMesh.position.set(0, tankHeight/2, tankDepth/2);
        frontWallMesh.castShadow = true;
        tankGroup.add(frontWallMesh);

        // Back wall
        const backWallMesh = new THREE.Mesh(frontWall, wallMaterial);
        backWallMesh.position.set(0, tankHeight/2, -tankDepth/2);
        backWallMesh.castShadow = true;
        tankGroup.add(backWallMesh);

        // Left wall
        const sideWall = new THREE.BoxGeometry(wallThickness, tankHeight, tankDepth);
        const leftWallMesh = new THREE.Mesh(sideWall, wallMaterial);
        leftWallMesh.position.set(-tankWidth/2, tankHeight/2, 0);
        leftWallMesh.castShadow = true;
        tankGroup.add(leftWallMesh);

        // Right wall
        const rightWallMesh = new THREE.Mesh(sideWall, wallMaterial);
        rightWallMesh.position.set(tankWidth/2, tankHeight/2, 0);
        rightWallMesh.castShadow = true;
        tankGroup.add(rightWallMesh);

        // Bottom
        const bottom = new THREE.BoxGeometry(tankWidth, wallThickness, tankDepth);
        const bottomMesh = new THREE.Mesh(bottom, wallMaterial);
        bottomMesh.position.set(0, wallThickness/2, 0);
        bottomMesh.receiveShadow = true;
        tankGroup.add(bottomMesh);

        // Camera position for rectangular tank
        camera.position.set(0.015, 0.012, 0.015);
        camera.lookAt(0, tankHeight/2, 0);

      } else {
        // Circular tank (SPH)
        const diameter = tankConstants.diameter || 0.008;
        const radius = diameter / 2;
        const tankHeight = tankConstants.height;

        const wallThickness = 0.0002;
        const wallMaterial = new THREE.MeshPhongMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.3
        });

        // Cylinder wall
        const cylinderGeometry = new THREE.CylinderGeometry(
          radius, radius, tankHeight, 32, 1, true
        );
        const cylinderMesh = new THREE.Mesh(cylinderGeometry, wallMaterial);
        cylinderMesh.position.set(0, tankHeight/2, 0);
        cylinderMesh.castShadow = true;
        tankGroup.add(cylinderMesh);

        // Bottom circle
        const bottomGeometry = new THREE.CylinderGeometry(radius, radius, wallThickness, 32);
        const bottomMesh = new THREE.Mesh(bottomGeometry, wallMaterial);
        bottomMesh.position.set(0, wallThickness/2, 0);
        bottomMesh.receiveShadow = true;
        tankGroup.add(bottomMesh);

        // Camera position for circular tank
        camera.position.set(0.012, 0.015, 0.012);
        camera.lookAt(0, tankHeight/2, 0);
      }

      return tankGroup;
    };

    const createWater = (height: number) => {
      if (height <= 0) return null;

      const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.7,
        shininess: 100
      });

      let waterGeometry: THREE.BufferGeometry;

      if (tankType === 'lbm') {
        // Rectangular water volume
        const tankWidth = tankConstants.width || 0.00595;
        const tankDepth = tankWidth;
        waterGeometry = new THREE.BoxGeometry(tankWidth * 0.98, height, tankDepth * 0.98);
      } else {
        // Circular water volume
        const diameter = tankConstants.diameter || 0.008;
        const radius = diameter / 2;
        waterGeometry = new THREE.CylinderGeometry(radius * 0.98, radius * 0.98, height, 32);
      }

      const water = new THREE.Mesh(waterGeometry, waterMaterial);
      water.position.set(0, height/2, 0);
      water.receiveShadow = true;
      water.castShadow = true;

      return water;
    };

    // Controls (simple orbit)
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // Rotate camera around origin
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, tankConstants.height/3, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scale = 1 + event.deltaY * 0.001;
      camera.position.multiplyScalar(scale);

      // Clamp distance
      const distance = camera.position.length();
      if (distance < 0.005) {
        camera.position.normalize().multiplyScalar(0.005);
      } else if (distance > 0.1) {
        camera.position.normalize().multiplyScalar(0.1);
      }
    };

    mountRef.current.addEventListener('mousedown', onMouseDown);
    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('mouseup', onMouseUp);
    mountRef.current.addEventListener('wheel', onWheel);

    // Initial setup
    tankMesh = createTank();
    scene.add(tankMesh);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Update water
      if (waterMesh) {
        scene.remove(waterMesh);
      }
      if (waterHeight > 0) {
        waterMesh = createWater(waterHeight);
        if (waterMesh) {
          scene.add(waterMesh);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    mountRef.current.appendChild(renderer.domElement);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeEventListener('mousedown', onMouseDown);
        mountRef.current.removeEventListener('mousemove', onMouseMove);
        mountRef.current.removeEventListener('mouseup', onMouseUp);
        mountRef.current.removeEventListener('wheel', onWheel);

        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }

      window.removeEventListener('resize', handleResize);

      renderer.dispose();
    };
  }, [tankType, waterHeight, tankConstants]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
};

export default TankViewer;