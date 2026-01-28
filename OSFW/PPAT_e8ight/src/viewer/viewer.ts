/**
 * @file Viewer.ts
 * @brief CFD Preprocessor 메인 3D 뷰어 클래스
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { RenderMode, RenderModeType } from './renderMode';
import { Picking } from './picking';
import { Highlighter } from './highlighter';

// Three.js에 BVH 확장 추가
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export interface ViewerOptions {
  container: HTMLElement;
  antialias?: boolean;
  shadows?: boolean;
  enablePicking?: boolean;
}

export interface Topo {
  metadata?: {
    version: string;
    deflLinear: number;
    deflAngular: number;
    unit: string;
  };
  faces: Array<{
    idx: number;
    id: string;
    triStart: number;
    triCount: number;
    surf: string;
    area: number;
    adjEdges: number[];
  }>;
  edges: Array<{
    idx: number;
    id: string;
    polyStart: number;
    polyCount: number;
    v0: number;
    v1: number;
    len: number;
    curve: string;
  }>;
  verts: Array<{
    idx: number;
    id: string;
    p: [number, number, number];
  }>;
}

export class Viewer {
  private _scene: THREE.Scene;
  private _camera: THREE.PerspectiveCamera;
  private _renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  
  private _model: THREE.Group | null = null;
  private _faceMesh: THREE.Mesh | null = null;
  private edgeLines: THREE.LineSegments | null = null;

  // Tank rendering
  private _tankGroup: THREE.Group | null = null;
  private _waterMesh: THREE.Mesh | null = null;

  // Domain rendering
  private _domainGroup: THREE.Group | null = null;

  // Triangle vectors rendering
  private _triangleVectors: THREE.Group | null = null;
  private _triangleVectorsVisible: boolean = false;
  private _vectorSize: number = 1.0;
  private _vectorColor: string = '#00ff00';
  private picking: Picking | null = null;
  private highlighter: Highlighter;
  private renderMode: RenderMode;
  
  private topo: Topo | null = null;
  private tri2face: Uint32Array | null = null;
  private seg2edge: Uint32Array | null = null;
  
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  
  private wireframeMode = false;
  private edgesVisible = false;
  private clippingEnabled = false;
  private clippingPlanes: THREE.Plane[] = [];
  private hoverEnabled = false;  // 기본값 OFF
  private selectionEnabled = false;  // 기본값 OFF
  private antialiasingEnabled = true;  // 기본값 ON

  // 조명 관련
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private hemisphereLight!: THREE.HemisphereLight;
  
  // 디스플레이 관련
  private infiniteGrid: THREE.GridHelper;
  private axesHelper: THREE.AxesHelper;
  
  
  constructor(container: HTMLElement) {
    // Scene 설정
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xa8a8a8);
    
    // Camera 설정 (Y-up convention)
    const aspect = container.clientWidth / container.clientHeight;
    // Z-fighting 방지를 위한 최적화된 near/far plane 설정
    // near: 0.0001 (0.1mm), far: 100 (100m) - 무한 그리드를 위해 확장
    this._camera = new THREE.PerspectiveCamera(45, aspect, 0.0001, 100);
    this._camera.position.set(0.1, 0.15, -0.1);
    // Set camera up vector to Y-axis (standard Three.js convention)
    this._camera.up.set(0, 1, 0);
    
    // Renderer 설정
    this._renderer = new THREE.WebGLRenderer({
      antialias: this.antialiasingEnabled,
      alpha: true
    });
    this._renderer.setSize(container.clientWidth, container.clientHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.shadowMap.enabled = false;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 클리핑 평면 설정
    this._renderer.localClippingEnabled = true;
    
    container.appendChild(this._renderer.domElement);
    
    // Controls 설정 (Y-up convention)
    this.controls = new OrbitControls(this._camera, this._renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // 마우스 버튼 설정
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,    // 왼쪽 버튼: 회전
      MIDDLE: THREE.MOUSE.PAN,     // 가운데 버튼: 이동
      RIGHT: THREE.MOUSE.ROTATE    // 오른쪽 버튼: 회전 (기본적으로 비활성화됨)
    };

    // Pan 기능 활성화
    this.controls.enablePan = true;
    this.controls.panSpeed = 2.0; // 기본 팬 속도 증가
    this.controls.screenSpacePanning = true; // 화면 공간에서 팬 - 줌 레벨에 관계없이 일정한 속도

    // Set controls to use Y-up - 수조 영역을 중심으로
    this.controls.target.set(0, 0.03, 0);
    this.controls.update();
    
    console.log('OrbitControls initialized:', {
      enabled: this.controls.enabled,
      domElement: this._renderer.domElement,
      camera: this._camera,
      target: this.controls.target
    });
    
    // 조명 설정
    this.setupLights();
    
    // Highlighter 생성
    this.highlighter = new Highlighter(this._scene);
    
    // 렌더링 모드 초기화
    this.renderMode = new RenderMode(this._scene);
    
    // 피킹 설정
    this.setupPicking();
    this.setupKeyboardEvents();
    
    // 안전한 기본 GridHelper 사용 (대형)
    this.infiniteGrid = new THREE.GridHelper(200, 2000, 0x444444, 0x222222);
    this.infiniteGrid.visible = false; // Grid 기본값 OFF
    // 그리드 상호작용 비활성화
    this.infiniteGrid.raycast = () => {};
    this.infiniteGrid.userData = { isGrid: true, raycastIgnore: true };
    this._scene.add(this.infiniteGrid);

    // 축 헬퍼 추가 - 수조 크기에 맞게 조정
    this.axesHelper = new THREE.AxesHelper(0.02);
    this.axesHelper.visible = false; // Axes Helper 기본값 OFF
    this._scene.add(this.axesHelper);
    
    // 리사이즈 이벤트 처리
    window.addEventListener('resize', () => this.handleResize());
  }
  
  // Getters for external access
  get scene(): THREE.Scene {
    return this._scene;
  }
  
  get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }
  
  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }
  
  get canvas(): HTMLCanvasElement {
    return this._renderer.domElement;
  }
  
  get faceMesh(): THREE.Mesh | null {
    return this._faceMesh;
  }

  set faceMesh(mesh: THREE.Mesh | null) {
    this._faceMesh = mesh;
  }
  
  get model(): THREE.Group | null {
    return this._model;
  }

  /**
   * 조명 설정
   */
  private setupLights() {
    // 환경광
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this._scene.add(this.ambientLight);

    // 방향광
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(100, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this._scene.add(this.directionalLight);
    
    // 헤미스피어 라이트
    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    this._scene.add(this.hemisphereLight);
  }
  
  /**
   * 키보드 이벤트 설정
   */
  private setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      // UI 입력 요소가 포커스되어 있으면 뷰어 키보드 이벤트 무시
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        (activeElement as any).isContentEditable ||
        activeElement.closest('[contenteditable]') ||
        activeElement.closest('.p-inputtext') ||
        activeElement.closest('.p-dropdown') ||
        activeElement.closest('.p-calendar')
      )) {
        return; // UI 입력 중이면 뷰어 이벤트 무시
      }

      // ESC 키로 선택 해제
      if (event.key === 'Escape') {
        this.highlighter.clearSelection();
        this.emit('pick', null);
      }

      // 숫자 키로 렌더링 모드 전환
      if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
        switch(event.key) {
          case '1':
            this.setRenderMode(RenderModeType.SOLID);
            this.updateRenderModeUI('solid');
            break;
          case '2':
            this.setRenderMode(RenderModeType.WIREFRAME);
            this.updateRenderModeUI('wireframe');
            break;
          case '3':
            this.setRenderMode(RenderModeType.EDGES);
            this.updateRenderModeUI('edges');
            break;
          case '4':
            this.setRenderMode(RenderModeType.SOLID_EDGES);
            this.updateRenderModeUI('solid+edges');
            break;
          case '5':
            this.setRenderMode(RenderModeType.HIDDEN_EDGES);
            this.updateRenderModeUI('hidden-edges');
            break;
        }
      }
    });
  }
  
  /**
   * 렌더링 모드 UI 업데이트
   */
  private updateRenderModeUI(mode: string) {
    const buttons = document.querySelectorAll('.render-mode-btn');
    buttons.forEach(btn => {
      const btnElement = btn as HTMLElement;
      if (btnElement.dataset.mode === mode) {
        btnElement.classList.add('active');
      } else {
        btnElement.classList.remove('active');
      }
    });
  }
  
  
  /**
   * 조명 색상 설정
   */
  setAmbientColor(color: string) {
    this.ambientLight.color = new THREE.Color(color);
  }

  setDirectionalColor(color: string) {
    this.directionalLight.color = new THREE.Color(color);
  }

  /**
   * 그림자 활성화/비활성화
   */
  setShadowsEnabled(enabled: boolean) {
    this._renderer.shadowMap.enabled = enabled;
    this.directionalLight.castShadow = enabled;

    if (this._faceMesh) {
      this._faceMesh.castShadow = enabled;
      this._faceMesh.receiveShadow = enabled;
    }
  }

  /**
   * 재질 속성 설정
   */
  setMaterialColor(color: string) {
    if (!this._faceMesh || !this._faceMesh.material) return;

    const material = this._faceMesh.material as THREE.MeshStandardMaterial;
    if ('color' in material) {
      material.color = new THREE.Color(color);
    }
  }

  setMaterialMetalness(value: number) {
    if (!this._faceMesh || !this._faceMesh.material) return;

    const material = this._faceMesh.material as THREE.MeshStandardMaterial;
    if ('metalness' in material) {
      material.metalness = value;
    }
  }

  setMaterialRoughness(value: number) {
    if (!this._faceMesh || !this._faceMesh.material) return;

    const material = this._faceMesh.material as THREE.MeshStandardMaterial;
    if ('roughness' in material) {
      material.roughness = value;
    }
  }

  setMaterialOpacity(value: number) {
    if (!this._faceMesh || !this._faceMesh.material) return;

    const material = this._faceMesh.material as THREE.MeshStandardMaterial;
    if ('opacity' in material) {
      material.opacity = value;
      material.transparent = value < 1.0;
    }
  }

  /**
   * 디스플레이 설정
   */
  setBackgroundColor(color: string) {
    this._scene.background = new THREE.Color(color);
  }

  setGridEnabled(enabled: boolean) {
    this.infiniteGrid.visible = enabled;
  }

  setAxesEnabled(enabled: boolean) {
    this.axesHelper.visible = enabled;
  }

  setAntialiasEnabled(_enabled: boolean) {
    // 안티앨리어싱은 렌더러 재생성이 필요하므로 현재는 무시
    console.warn('Antialiasing requires renderer recreation');
  }
  
  // 카메라 설정 메서드들은 아래에 정의됨
  
  /**
   * 피킹 설정
   */
  private setupPicking() {
    console.log('Setting up picking event listeners');
    this._renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this._renderer.domElement.addEventListener('click', this.onClick.bind(this));
    
    // 마우스 나가기 이벤트 추가
    this._renderer.domElement.addEventListener('mouseleave', () => {
      this.highlighter.clearHover();
      this.emit('hover', null);
    });
  }
  
  /**
   * 마우스 이동 이벤트 처리 (Face만 hover)
   */
  private onMouseMove(event: MouseEvent) {
    // Hover가 비활성화되어 있으면 무시
    if (!this.hoverEnabled) {
      this.highlighter.clearHover();
      this.emit('hover', null);
      return;
    }
    
    if (!this.picking || !this._faceMesh) {
      return;
    }
    
    // 정확한 마우스 좌표 계산
    const coords = this.getMouseCoords(event);
    
    // Face만 hover 가능
    const result = this.picking.hoverPick(coords);
    
    this.highlighter.hover(result);
    this.emit('hover', result);
  }
  
  /**
   * 클릭 이벤트 처리 (모든 요소 선택 가능)
   */
  private onClick(event: MouseEvent) {
    if (!this.picking) return;

    // Selection이 비활성화되어 있으면 리턴
    if (!this.selectionEnabled) {
      return;
    }

    // 정확한 마우스 좌표 계산
    const coords = this.getMouseCoords(event);

    // 모든 요소 선택 가능 (Vertex, Edge, Face)
    const result = this.picking.pick(coords);

    if (result) {
      // 선택
      this.highlighter.select(result);
      this.emit('pick', result);
    } else {
      // 빈 공간 클릭 시 선택 해제
      this.highlighter.clearSelection();
      this.emit('pick', null);
    }
  }
  
  /**
   * 마우스 좌표를 NDC(Normalized Device Coordinates)로 변환
   * -1 ~ 1 범위로 정규화
   */
  private getMouseCoords(event: MouseEvent): THREE.Vector2 {
    const canvas = this._renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    return new THREE.Vector2(x, y);
  }
  
  /**
   * 3D 모델 로드 (다양한 형식 지원)
   * @param url - 모델 파일 URL
   * @param fileExtension - 파일 확장자 (선택)
   * @param clearExisting - 기존 모델 제거 여부 (기본값: true)
   */
  async loadModel(url: string, fileExtension?: string, clearExisting: boolean = true, meshName?: string): Promise<void> {
    // 기존 모델 제거 (clearExisting가 true일 때만) - COMMENTED OUT
    // if (clearExisting && this._model) {
    //   this._scene.remove(this._model);
    //   this._model.traverse((child) => {
    //     if (child instanceof THREE.Mesh) {
    //       child.geometry.dispose();
    //       if (Array.isArray(child.material)) {
    //         child.material.forEach(m => m.dispose());
    //       } else {
    //         child.material.dispose();
    //       }
    //     }
    //   });
    // }

    // 파일 확장자 감지
    const extension = fileExtension || url.split('.').pop()?.toLowerCase();

    let loadedModel: THREE.Group | THREE.Object3D;

    switch (extension) {
      case 'gltf':
      case 'glb': {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        loadedModel = gltf.scene;
        break;
      }
      case 'obj': {
        const loader = new OBJLoader();
        loadedModel = await loader.loadAsync(url);
        break;
      }
      case 'stl': {
        const loader = new STLLoader();
        const geometry = await loader.loadAsync(url);

        // Special material for Broad_weir_fluid (water)
        let material: THREE.Material;
        if (meshName === 'Broad_weir_fluid') {
          material = new THREE.MeshPhongMaterial({
            color: 0x1e88e5,      // Blue color
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false
          });
        } else {
          material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        }

        const mesh = new THREE.Mesh(geometry, material);
        // Set mesh name if provided
        if (meshName) {
          mesh.name = meshName;
        }
        loadedModel = new THREE.Group();
        loadedModel.add(mesh);
        break;
      }
      case 'ply': {
        const loader = new PLYLoader();
        const geometry = await loader.loadAsync(url);
        const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geometry, material);
        // Set mesh name if provided
        if (meshName) {
          mesh.name = meshName;
        }
        loadedModel = new THREE.Group();
        loadedModel.add(mesh);
        break;
      }
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }

    // clearExisting가 false이고 이미 모델이 있으면 기존 그룹에 추가
    if (!clearExisting && this._model) {
      this._model.add(loadedModel);
    } else {
      // 새 모델로 교체
      this._model = loadedModel as THREE.Group;
      this._scene.add(this._model);
    }

    // 새로 로드된 모델에 대해서만 메시 처리
    let meshCount = 0;
    loadedModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        
        console.log(`Found mesh ${meshCount}:`, {
          name: child.name,
          vertexCount: child.geometry.attributes.position?.count,
          indexCount: child.geometry.index?.count,
          material: (child.material as THREE.Material).type,
          visible: child.visible,
          parent: child.parent?.name
        });

        // 모든 메시에 그림자 및 기본 설정 적용
        child.castShadow = true;
        child.receiveShadow = true;

        // Material 설정
        const material = child.material as THREE.MeshStandardMaterial;
        if (material) {
          material.side = THREE.DoubleSide;
          child.frustumCulled = false;
        }

        // 첫 번째 메시를 Face 메시로 설정 (edges가 아닌 경우)
        if (!this._faceMesh && child.name !== 'edges') {
          this._faceMesh = child;

          // BVH 생성 (첫 번째 메시만)
          if (!child.geometry.boundsTree) {
            console.log('Creating BVH for mesh...');
            child.geometry.computeBoundsTree();
          }

          console.log('Face mesh set and material settings updated:', {
            side: material?.side,
            depthTest: material?.depthTest,
            depthWrite: material?.depthWrite,
            transparent: material?.transparent
          });
        }
      }
      
      // Edge Lines 처리
      if (child instanceof THREE.LineSegments && !this.edgeLines) {
        this.edgeLines = child;
        this.edgeLines.visible = false;
        console.log('Found edge lines - hidden by default');
      }
    });
    
    console.log(`Total meshes found: ${meshCount}`);
    
    if (!this._faceMesh) {
      console.warn('No face mesh found in model!');
    }
    
    // 렌더링 모드 업데이트
    this.renderMode.updateModel();
    
    // 카메라 위치 조정
    this.fitCameraToModel();
    
    // 피킹 재설정
    if (this._faceMesh) {
      // 기존 피킹 정리
      if (this.picking) {
        this.picking.dispose();
      }
      
      this.picking = new Picking({
        camera: this._camera,
        scene: this._scene
      });
      
      // 피킹 가능한 메시 추가
      this.picking.addPickableMesh(this._faceMesh);
      
      // Highlighter 참조 설정
      this.highlighter.setReferences(this._faceMesh, this.edgeLines || undefined, undefined);
      
      console.log('Picking and highlighting initialized for model');
      console.log('FaceMesh available:', !!this._faceMesh);
      console.log('Picking instance created:', !!this.picking);
    } else {
      console.warn('Cannot initialize picking - no face mesh found');
    }
  }
  
  /**
   * 토폴로지 데이터 로드
   */
  async loadTopology(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      this.topo = await response.json();
      
      console.log('Topology loaded:', {
        faces: this.topo?.faces?.length,
        edges: this.topo?.edges?.length,
        verts: this.topo?.verts?.length
      });
      
      if (this.picking && this.topo) {
        this.picking.setTopology(this.topo);
      }
      
      // Highlighter에도 토폴로지 설정
      if (this.faceMesh) {
        this.highlighter.setReferences(this.faceMesh, this.edgeLines || undefined, this.topo);
      }
    } catch (error) {
      console.warn('Failed to load topology:', error);
    }
  }
  
  /**
   * 맵핑 데이터 로드
   */
  async loadMappings(tri2faceUrl: string, seg2edgeUrl: string): Promise<void> {
    try {
      // tri2face 로드
      const tri2faceResponse = await fetch(tri2faceUrl);
      const tri2faceBuffer = await tri2faceResponse.arrayBuffer();
      this.tri2face = new Uint32Array(tri2faceBuffer);
      
      // seg2edge 로드
      const seg2edgeResponse = await fetch(seg2edgeUrl);
      const seg2edgeBuffer = await seg2edgeResponse.arrayBuffer();
      this.seg2edge = new Uint32Array(seg2edgeBuffer);
      
      console.log('Mappings loaded:', {
        tri2face: this.tri2face?.length,
        seg2edge: this.seg2edge?.length
      });
      
      if (this.picking) {
        this.picking.setMappings(this.tri2face, this.seg2edge);
      }
    } catch (error) {
      console.warn('Failed to load mappings:', error);
    }
  }
  
  /**
   * 카메라를 모델에 맞게 조정
   */
  fitCameraToModel() {
    if (!this._model) return;

    const box = new THREE.Box3().setFromObject(this._model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this._camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

    this._camera.position.set(center.x + cameraZ, center.y + cameraZ / 2, center.z + cameraZ);
    this._camera.lookAt(center);

    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * 메시를 화면 절반에 맞게 카메라를 스무스하게 이동
   * @param mesh 대상 메시 (없으면 현재 로드된 모델 사용)
   * @param duration 애니메이션 시간 (밀리초, 기본값: 1000ms)
   */
  fitToBox(mesh?: THREE.Mesh, duration: number = 1000): void {
    let targetObject: THREE.Object3D | null = null;

    if (mesh) {
      targetObject = mesh;
    } else if (this._model) {
      targetObject = this._model;
    } else if (this._faceMesh) {
      targetObject = this._faceMesh;
    } else if (this._tankGroup) {
      targetObject = this._tankGroup;
    }

    if (!targetObject) {
      console.warn('No mesh found to fit camera to');
      return;
    }

    // 객체의 bounding box 계산
    const box = new THREE.Box3().setFromObject(targetObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 화면 절반을 채우기 위한 거리 계산
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this._camera.fov * (Math.PI / 180);

    // 화면 절반을 채우도록 거리를 계산 (factor를 2.0으로 늘려서 적당한 거리 유지)
    const distance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.0;

    // 현재 카메라 방향을 유지하면서 적절한 위치 계산
    const currentDirection = new THREE.Vector3()
      .subVectors(this._camera.position, this.controls.target)
      .normalize();

    // 새로운 카메라 위치 계산
    const newPosition = new THREE.Vector3()
      .copy(center)
      .addScaledVector(currentDirection, distance);

    // 애니메이션을 위한 시작 값들
    const startPosition = this._camera.position.clone();
    const startTarget = this.controls.target.clone();

    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeInOutCubic 애니메이션 곡선
      const easedProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // 카메라 위치 보간
      this._camera.position.lerpVectors(startPosition, newPosition, easedProgress);

      // 타겟 보간
      this.controls.target.lerpVectors(startTarget, center, easedProgress);

      // 카메라가 타겟을 바라보도록 설정
      this._camera.lookAt(this.controls.target);

      // 컨트롤 업데이트
      this.controls.update();

      // 렌더링
      this.render();

      // 애니메이션 계속 또는 종료
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료 후 최종 설정
        this._camera.position.copy(newPosition);
        this.controls.target.copy(center);
        this._camera.lookAt(center);
        this.controls.update();
        this.render();

        console.log('fitToBox animation completed:', {
          center: center,
          distance: distance,
          cameraPosition: this._camera.position,
          target: this.controls.target
        });
      }
    };

    // 애니메이션 시작
    requestAnimationFrame(animate);

    console.log('Starting fitToBox animation:', {
      object: mesh?.name || targetObject.constructor.name,
      center: center,
      size: size,
      distance: distance,
      duration: duration
    });
  }
  
  /**
   * 뷰 리셋
   */
  resetView() {
    this.fitCameraToModel();
  }
  
  /**
   * 엣지 토글
   */
  toggleEdges() {
    this.edgesVisible = !this.edgesVisible;
    if (this.edgeLines) {
      this.edgeLines.visible = this.edgesVisible;
    }
    console.log(`Edges ${this.edgesVisible ? 'shown' : 'hidden'}`);
  }
  
  /**
   * 렌더링 모드 설정
   */
  setRenderMode(mode: RenderModeType): void {
    this.renderMode.setMode(mode);
  }
  
  /**
   * 현재 렌더링 모드 가져오기
   */
  getRenderMode(): RenderModeType {
    return this.renderMode.getMode();
  }
  
  /**
   * 와이어프레임 색상 설정
   */
  setWireframeColor(color: string | number): void {
    this.renderMode.setWireframeColor(color);
  }
  
  /**
   * 엣지 색상 설정
   */
  setEdgeColor(color: string | number): void {
    this.renderMode.setEdgeColor(color);
  }
  
  /**
   * 와이어프레임 투명도 설정
   */
  setWireframeOpacity(opacity: number): void {
    this.renderMode.setWireframeOpacity(opacity);
  }
  
  /**
   * 와이어프레임 토글
   */
  toggleWireframe() {
    this.wireframeMode = !this.wireframeMode;
    if (this.faceMesh) {
      const material = this.faceMesh.material as THREE.MeshStandardMaterial;
      material.wireframe = this.wireframeMode;
    }
  }
  
  /**
   * 클리핑 토글
   */
  toggleClipping() {
    this.clippingEnabled = !this.clippingEnabled;
    
    if (this.clippingEnabled) {
      // Y축 클리핑 평면 생성
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      this.clippingPlanes = [plane];
      
      if (this.faceMesh) {
        const material = this.faceMesh.material as THREE.MeshStandardMaterial;
        material.clippingPlanes = this.clippingPlanes;
      }
    } else {
      this.clippingPlanes = [];
      if (this.faceMesh) {
        const material = this.faceMesh.material as THREE.MeshStandardMaterial;
        material.clippingPlanes = [];
      }
    }
  }
  
  /**
   * 하이라이트 색상 설정
   */
  setHighlightColor(color: string) {
    this.highlighter.setColor(color);
  }
  
  /**
   * 선택 색상 설정
   */
  setSelectionColor(color: string) {
    this.highlighter.setSelectionColor(color);
  }
  
  // ========== 카메라 설정 ==========
  
  /**
   * 카메라 FOV 설정
   */
  setCameraFOV(fov: number) {
    this._camera.fov = fov;
    this._camera.updateProjectionMatrix();
  }
  
  /**
   * 카메라 거리 설정
   */
  setCameraDistance(distance: number) {
    const direction = new THREE.Vector3();
    direction.subVectors(this._camera.position, this.controls.target).normalize();
    this._camera.position.copy(this.controls.target).addScaledVector(direction, distance);
    this.controls.update();
  }
  
  /**
   * 회전 속도 설정
   */
  setRotationSpeed(speed: number) {
    this.controls.rotateSpeed = speed;
  }
  
  /**
   * 자동 회전 설정
   */
  setAutoRotate(enabled: boolean, speed: number = 2) {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = speed;
  }
  
  /**
   * 카메라 리셋
   */
  resetCamera() {
    this.fitCameraToModel();
  }

  /**
   * Handle resize
   */
  handleResize() {
    const container = this._renderer.domElement.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(window.devicePixelRatio);
  }

  /**
   * Public resize method
   */
  resize(width: number, height: number) {
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(window.devicePixelRatio);
  }

  /**
   * Update method for animation loop
   */
  update() {
    this.controls.update();
    this._renderer.render(this._scene, this._camera);
  }

  render() {
    this._renderer.render(this._scene, this._camera);
  }
  /**
   * Set grid visibility
   */
  setGridVisible(visible: boolean): void {
    if (this.infiniteGrid) {
      this.infiniteGrid.visible = visible;
      this.render();
    }
  }

  /**
   * Set axes helper visibility
   */
  setAxesHelperVisible(visible: boolean): void {
    if (this.axesHelper) {
      this.axesHelper.visible = visible;
      this.render();
    }
  }

  /**
   * Set hover interaction enabled/disabled
   */
  setHoverEnabled(enabled: boolean): void {
    this.hoverEnabled = enabled;
    // If disabling, clear any current hover
    if (!enabled && this.highlighter) {
      this.highlighter.hover(null);
      this.emit('hover', null);
    }
    console.log(`Hover ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set selection interaction enabled/disabled
   */
  setSelectionEnabled(enabled: boolean): void {
    this.selectionEnabled = enabled;
    // If disabling, clear any current selection
    if (!enabled && this.highlighter) {
      this.highlighter.clearSelection();
      this.emit('pick', null);
    }
    console.log(`Selection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set antialiasing enabled/disabled
   * Note: This requires recreating the renderer
   */
  setAntialiasingEnabled(enabled: boolean): void {
    if (this.antialiasingEnabled === enabled) {
      return; // No change needed
    }

    this.antialiasingEnabled = enabled;

    // Store current renderer properties
    const container = this._renderer.domElement.parentElement;
    if (!container) {
      console.error('Cannot recreate renderer: no parent container');
      return;
    }

    const currentWidth = container.clientWidth;
    const currentHeight = container.clientHeight;
    const pixelRatio = this._renderer.getPixelRatio();

    // Remove old renderer
    const oldCanvas = this._renderer.domElement;
    this._renderer.dispose();
    container.removeChild(oldCanvas);

    // Create new renderer with updated antialias setting
    this._renderer = new THREE.WebGLRenderer({
      antialias: enabled,
      alpha: true
    });
    this._renderer.setSize(currentWidth, currentHeight);
    this._renderer.setPixelRatio(pixelRatio);
    this._renderer.shadowMap.enabled = false;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.localClippingEnabled = true;

    // Re-attach to container
    container.appendChild(this._renderer.domElement);

    // Update OrbitControls to use new domElement
    this.controls.dispose();
    this.controls = new OrbitControls(this._camera, this._renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.03, 0);
    this.controls.update();

    // Re-attach event listeners
    this._renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this._renderer.domElement.addEventListener('click', this.onClick.bind(this));

    // Re-render
    this.render();

    console.log(`Antialiasing ${enabled ? 'enabled' : 'disabled'} (renderer recreated)`);
  }

  /**
   * Set ambient light intensity
   */
  setAmbientLightIntensity(intensity: number): void {
    if (this.ambientLight) {
      this.ambientLight.intensity = intensity;
      this.render();
    }
  }

  /**
   * Set directional light intensity
   */
  setDirectionalLightIntensity(intensity: number): void {
    if (this.directionalLight) {
      this.directionalLight.intensity = intensity;
      this.render();
    }
  }

  /**
   * Set directional light color
   */
  setDirectionalLightColor(color: string): void {
    if (this.directionalLight) {
      this.directionalLight.color.setStyle(color);
      this.render();
    }
  }

  /**
   * Set directional light position
   */
  setDirectionalLightPosition(x: number, y: number, z: number): void {
    if (this.directionalLight) {
      this.directionalLight.position.set(x, y, z);
      this.render();
    }
  }

  /**
   * Set hemisphere light intensity
   */
  setHemisphereLightIntensity(intensity: number): void {
    if (this.hemisphereLight) {
      this.hemisphereLight.intensity = intensity;
      this.render();
    }
  }

  /**
   * Set hemisphere light colors
   */
  setHemisphereLightColors(skyColor: string, groundColor: string): void {
    if (this.hemisphereLight) {
      this.hemisphereLight.color.setStyle(skyColor);
      this.hemisphereLight.groundColor.setStyle(groundColor);
      this.render();
    }
  }

  /**
   * Emit events
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.renderMode.dispose();

    if (this.picking) {
      this.picking.dispose();
      this.picking = null;
    }

    this.highlighter.dispose();

    // 삼각형 벡터 정리
    this.clearTriangleVectors();

    // 탱크 정리
    this.clearTank();

    // 도메인 정리
    this.clearDomain();

    // 모델 정리
    if (this._model) {
      this._scene.remove(this._model);
      this._model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this._model = null;
    }

    this.controls.dispose();
    this._renderer.dispose();
    this.listeners.clear();
  }

  // Display Settings 메서드 추가
  getContainer(): HTMLElement | null {
    return this._renderer?.domElement.parentElement || null;
  }

  /**
   * 삼각형 벡터 표시/숨김
   */
  setTriangleVectorsVisible(visible: boolean): void {
    this._triangleVectorsVisible = visible;

    if (visible) {
      this.createTriangleVectors();
    } else {
      this.clearTriangleVectors();
    }

    this.render();
  }

  /**
   * 삼각형 벡터 설정 (크기, 색상)
   */
  setTriangleVectorSettings(size: number, color: string): void {
    this._vectorSize = size;
    this._vectorColor = color;

    // 벡터가 표시 중이면 다시 생성
    if (this._triangleVectorsVisible) {
      this.createTriangleVectors();
      this.render();
    }
  }

  /**
   * 삼각형 벡터 생성
   */
  private createTriangleVectors(): void {
    // 기존 벡터 제거
    this.clearTriangleVectors();

    this._triangleVectors = new THREE.Group();
    let totalTriangles = 0;
    let meshCount = 0;

    // 설정된 색상을 16진수로 변환
    const vectorColor = parseInt(this._vectorColor.replace('#', ''), 16);
    console.log(`Creating triangle vectors with color: ${this._vectorColor} (0x${vectorColor.toString(16)})`);

    // 로드된 모델 메시에 벡터 생성
    if (this._model) {
      console.log('Processing loaded model meshes for triangle vectors');
      this._model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          meshCount++;
          const vectors = this.createVectorsForMesh(child, vectorColor);
          totalTriangles += vectors;
          console.log(`Model mesh ${child.name || 'unnamed'}: ${vectors} vectors`);
        }
      });
    }

    // 수조 메시에 벡터 생성
    if (this._tankGroup) {
      console.log('Processing tank meshes for triangle vectors');
      this._tankGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          meshCount++;
          const vectors = this.createVectorsForMesh(child, vectorColor);
          totalTriangles += vectors;
          console.log(`Tank mesh ${child.name || 'unnamed'}: ${vectors} vectors`);
        }
      });
    }

    // Face mesh 처리 (만약 있다면)
    if (this._faceMesh) {
      console.log('Processing face mesh for triangle vectors');
      meshCount++;
      const vectors = this.createVectorsForMesh(this._faceMesh, vectorColor);
      totalTriangles += vectors;
      console.log(`Face mesh: ${vectors} vectors`);
    }

    if (totalTriangles > 0) {
      this._scene.add(this._triangleVectors);
      console.log(`✅ Triangle vectors created: ${totalTriangles} triangles from ${meshCount} meshes`);
    } else {
      console.warn(`❌ No triangle vectors created. Processed ${meshCount} meshes but found no valid triangles.`);
      if (meshCount === 0) {
        console.warn('No meshes found in scene. Make sure models are loaded.');
      }
    }
  }

  /**
   * 개별 메시에 대한 삼각형 벡터 생성
   */
  private createVectorsForMesh(mesh: THREE.Mesh, color: number): number {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position;
    const indexAttribute = geometry.index;

    if (!positionAttribute) {
      console.warn(`Mesh ${mesh.name} geometry missing position attribute`);
      return 0;
    }

    const positions = positionAttribute.array as Float32Array;
    let triangleCount = 0;

    // Update matrix world to ensure correct transformations
    mesh.updateMatrixWorld(true);
    const worldMatrix = mesh.matrixWorld;

    if (indexAttribute) {
      // Indexed geometry
      const indices = indexAttribute.array;
      console.log(`Processing indexed mesh ${mesh.name} with ${indices.length / 3} triangles`);

      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;

        // Check bounds to prevent array access errors
        if (a + 2 >= positions.length || b + 2 >= positions.length || c + 2 >= positions.length) {
          continue;
        }

        if (this.createTriangleVector(positions, a, b, c, worldMatrix, color)) {
          triangleCount++;
        }
      }
    } else {
      // Non-indexed geometry
      console.log(`Processing non-indexed mesh ${mesh.name} with ${positions.length / 9} triangles`);

      for (let i = 0; i < positions.length; i += 9) {
        const a = i;
        const b = i + 3;
        const c = i + 6;

        if (this.createTriangleVector(positions, a, b, c, worldMatrix, color)) {
          triangleCount++;
        }
      }
    }

    console.log(`Created ${triangleCount} vectors for mesh: ${mesh.name}`);
    return triangleCount;
  }

  /**
   * 개별 삼각형에 대한 벡터 생성
   */
  private createTriangleVector(
    positions: Float32Array,
    a: number,
    b: number,
    c: number,
    worldMatrix: THREE.Matrix4,
    color: number
  ): boolean {
    try {
      // 삼각형의 세 점 (로컬 좌표)
      const p1 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
      const p2 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
      const p3 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);

      // 월드 좌표로 변환
      p1.applyMatrix4(worldMatrix);
      p2.applyMatrix4(worldMatrix);
      p3.applyMatrix4(worldMatrix);

      // 삼각형 중심점 계산
      const center = new THREE.Vector3()
        .addVectors(p1, p2)
        .add(p3)
        .divideScalar(3);

      // 법선 벡터 계산
      const edge1 = new THREE.Vector3().subVectors(p2, p1);
      const edge2 = new THREE.Vector3().subVectors(p3, p1);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2);

      // 법선 벡터 길이 확인 (degenerate triangle 방지)
      const normalLength = normal.length();
      if (normalLength < 0.00001) {
        return false; // Skip degenerate triangles
      }

      normal.normalize();

      // 벡터 크기 설정
      const baseVectorLength = 0.003; // 기본 벡터 길이 (3mm)
      const vectorLength = baseVectorLength * this._vectorSize;

      // 벡터 화살표 생성
      const arrowHelper = new THREE.ArrowHelper(
        normal,                    // 방향
        center,                    // 시작점
        vectorLength,              // 길이
        color,                     // 색상
        vectorLength * 0.2,        // 머리 길이 (벡터의 20%)
        vectorLength * 0.1         // 머리 폭 (벡터의 10%)
      );

      this._triangleVectors!.add(arrowHelper);
      return true;
    } catch (error) {
      console.error('Error creating triangle vector:', error);
      return false;
    }
  }

  /**
   * 삼각형 벡터 제거
   */
  private clearTriangleVectors(): void {
    if (this._triangleVectors) {
      this._scene.remove(this._triangleVectors);

      // ArrowHelper들 정리
      this._triangleVectors.traverse((child) => {
        if (child instanceof THREE.ArrowHelper) {
          child.dispose();
        }
      });

      this._triangleVectors = null;
    }
  }

  // Tank rendering methods
  async createTank(tankType: 'lbm' | 'sph', waterHeight: number): Promise<void> {
    console.log(`Creating ${tankType} tank with STL files and water height: ${waterHeight}m`);

    // Remove existing tank
    this.clearTank();

    const tankGroup = new THREE.Group();

    // STL 파일 경로

    const tankPath = `/models/sedimentation-column/${tankType}_tank.stl`;
    const waterPath = `/models/sedimentation-column/${tankType}_water.stl`;

    try {
      // STL 로더 초기화
      const loader = new STLLoader();

      // 탱크 로드
      const tankGeometry = await this.loadSTL(loader, tankPath);

      // 탱크 메시 생성
      const tankMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });

      const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
      tankMesh.name = `${tankType}_tank`;
      tankMesh.castShadow = true;
      tankMesh.receiveShadow = true;

      // Y-up 좌표계 사용 (변환 불필요)

      // LBM 탱크의 경우, STL 모델을 36mm 높이로 맞추고 바닥을 Y=0으로 조정
      let tankYOffset = 0; // 수조 이동 거리를 저장
      let waterBottomOffset = 0; // 물의 바닥이 올라가는 거리
      if (tankType === 'lbm') {
        // STL 모델의 실제 높이를 계산
        tankGeometry.computeBoundingBox();
        const bbox = tankGeometry.boundingBox;
        if (bbox) {
          const currentHeight = bbox.max.y - bbox.min.y;
          const targetHeight = 0.036; // 36mm
          const scaleY = targetHeight / currentHeight;
          tankMesh.scale.setY(scaleY);

          // 바닥이 Y=0에서 시작하도록 위치 조정
          // 스케일 후의 최소 Y 좌표 계산
          const scaledMinY = bbox.min.y * scaleY;
          tankYOffset = -scaledMinY; // 수조 이동 거리 저장
          tankMesh.position.setY(tankYOffset);

          console.log(`LBM tank scaled from ${currentHeight}m to ${targetHeight}m (scale: ${scaleY})`);
          console.log(`LBM tank positioned: Y offset = ${tankYOffset}m (bottom at Y=0)`);
        }
      }

      // Z-fighting 방지: 탱크를 먼저 렌더링
      tankMesh.renderOrder = 0;
      tankGroup.add(tankMesh);

      // 물 로드
      const waterGeometry = await this.loadSTL(loader, waterPath);

      // 물 메시 생성 (불투명 유지, Z-fighting 방지)
      const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x006994,
        transparent: false,
        opacity: 1.0,
        side: THREE.DoubleSide,
        // Z-fighting 방지를 위한 polygon offset
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });

      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);

      // Y-up 좌표계 사용 (변환 불필요)

      // LBM의 경우, 물의 바닥을 수조와 함께 올리고 updateWaterGeometry가 올바른 범위에서 작동하도록 설정
      if (tankType === 'lbm') {
        // 물의 현재 Y축 범위 계산
        waterGeometry.computeBoundingBox();
        const waterBbox = waterGeometry.boundingBox;
        if (waterBbox) {
          const waterOriginalBottom = waterBbox.min.y;

          const positionAttribute = waterGeometry.attributes.position as THREE.BufferAttribute;
          const positions = positionAttribute.array as Float32Array;

          // 물의 바닥을 tankYOffset만큼 올려서 수조 내부 바닥과 일치시킴
          waterBottomOffset = tankYOffset;

          // 모든 정점을 tankYOffset만큼 Y축으로 이동
          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += waterBottomOffset;
          }

          positionAttribute.needsUpdate = true;
          waterGeometry.computeBoundingBox();
          waterGeometry.computeVertexNormals();

          console.log(`LBM water geometry adjusted:`);
          console.log(`  - Water bottom offset: ${waterBottomOffset}m`);
          console.log(`  - Water bottom moved from ${waterOriginalBottom}m to ${waterOriginalBottom + waterBottomOffset}m`);
        }
      }

      // 초기 물 높이 설정 - 전달받은 waterHeight 값을 그대로 사용
      // LBM/SPH의 경우 updateWaterGeometry는 이미 조정된 geometry의 바닥을 기준으로 동작
      this.updateWaterGeometry(waterMesh, waterHeight, tankType);

      waterMesh.name = `${tankType}_water`;
      waterMesh.castShadow = true;
      // Z-fighting 방지: 물을 탱크 다음에 렌더링
      waterMesh.renderOrder = 1;
      tankGroup.add(waterMesh);

      // 그룹 설정
      tankGroup.name = `${tankType}_tank_group`;
      tankGroup.position.set(0, 0, 0);

      // 씬에 추가
      this._tankGroup = tankGroup;
      this._scene.add(tankGroup);

      // 카메라 조정
      this.setCameraForTank(tankType);

      // 현재 물 높이를 UI로 전송 (전달받은 값 그대로 사용)
      console.log(`Current water height for ${tankType}: ${waterHeight}m`);
      const heightEvent = new CustomEvent('stlWaterHeightMeasured', {
        detail: { tankType, actualHeight: waterHeight }
      });
      window.dispatchEvent(heightEvent);

      console.log(`Successfully loaded ${tankType} tank and water from STL files`);

    } catch (error) {
      console.error(`Failed to load ${tankType} tank:`, error);
      // 에러 시 기본 형태로 폴백
      this.createFallbackTank(tankType, waterHeight);
    }

    this.render();
  }

  /**
   * STL 파일 로드 유틸리티
   */
  private loadSTL(loader: STLLoader, path: string): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (geometry) => {
          resolve(geometry);
        },
        (progress) => {
          console.log('Loading progress:', progress);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 폴백용 기본 탱크 생성
   */
  private createFallbackTank(tankType: 'lbm' | 'sph', waterHeight: number): void {
    console.log(`Creating fallback ${tankType} tank`);

    const tankGroup = new THREE.Group();

    if (tankType === 'lbm') {
      // 간단한 박스 형태의 LBM 탱크
      const tankGeometry = new THREE.BoxGeometry(0.006, 0.032, 0.006);
      const tankMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
      tankMesh.name = `${tankType}_tank`;
      tankGroup.add(tankMesh);

      // 물
      const waterGeometry = new THREE.BoxGeometry(0.0055, 0.031, waterHeight);
      const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x006994,
        transparent: false,
        opacity: 1.0
      });
      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      waterMesh.name = `${tankType}_water`;
      waterMesh.position.setY(waterHeight / 2 - 0.003);
      tankGroup.add(waterMesh);

    } else {
      // 간단한 원통 형태의 SPH 탱크
      const tankGeometry = new THREE.CylinderGeometry(0.0045, 0.0045, 0.05, 32);
      const tankMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
      tankMesh.name = `${tankType}_tank`;
      tankGroup.add(tankMesh);

      // 물
      const waterGeometry = new THREE.CylinderGeometry(0.004, 0.004, waterHeight, 32);
      const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x006994,
        transparent: false,
        opacity: 1.0
      });
      const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
      waterMesh.name = `${tankType}_water`;
      waterMesh.position.setY(waterHeight / 2 - 0.025);
      tankGroup.add(waterMesh);
    }

    // 그룹 설정
    tankGroup.name = `${tankType}_tank_group`;
    tankGroup.position.set(0, 0, 0);

    // 씬에 추가
    this._tankGroup = tankGroup;
    this._scene.add(tankGroup);

    // 카메라 조정
    this.setCameraForTank(tankType);
  }

  updateWater(tankType: 'lbm' | 'sph', waterHeight: number): void {
    if (!this._tankGroup) return;

    const waterMesh = this._tankGroup.getObjectByName(`${tankType}_water`) as THREE.Mesh;
    if (waterMesh && waterMesh.geometry) {
      // 지오메트리를 직접 수정하여 바닥 고정, 상단만 늘어나도록 처리
      this.updateWaterGeometry(waterMesh, waterHeight, tankType);

      console.log(`Updated ${tankType} water height to: ${waterHeight}m`);
    }

    this.render();
  }

  /**
   * 물 지오메트리를 직접 수정하여 바닥 고정, 상단만 변화
   */
  private updateWaterGeometry(waterMesh: THREE.Mesh, newHeight: number, tankType: 'lbm' | 'sph'): void {
    const geometry = waterMesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    if (!positionAttribute) return;

    const positions = positionAttribute.array as Float32Array;

    // 먼저 현재 지오메트리의 Y축 범위를 찾아서 실제 좌표 범위 파악
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const currentHeight = maxY - minY;
    console.log(`Current geometry Y range: ${minY} to ${maxY}, height: ${currentHeight}`);

    // 바닥 Y 좌표를 고정점으로 사용
    const bottomY = minY;

    // 탱크 타입별 최대 높이 제한
    // LBM: 36mm (0.036m), SPH: 45mm (0.045m)
    const maxAllowedTop = tankType === 'lbm' ? 0.036 : 0.045;
    const requestedTop = bottomY + newHeight;
    const actualNewHeight = requestedTop > maxAllowedTop ? (maxAllowedTop - bottomY) : newHeight;

    if (requestedTop > maxAllowedTop) {
      console.warn(`Requested water top (${requestedTop}m) exceeds ${tankType.toUpperCase()} tank top (${maxAllowedTop}m). Clamping to max height: ${actualNewHeight}m`);
    }

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];

      // 현재 정점의 높이 비율 계산 (0 = 바닥, 1 = 최상단)
      const heightRatio = (y - bottomY) / currentHeight;

      // 새로운 높이에 맞게 Y 좌표 재계산
      // 바닥은 고정하고, 높이 비율에 따라 선형적으로 새 높이 적용
      positions[i + 1] = bottomY + (heightRatio * actualNewHeight);
    }

    // 지오메트리 업데이트
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    console.log(`Updated ${tankType.toUpperCase()} water geometry: bottom fixed at ${bottomY}m, new height: ${actualNewHeight}m (requested: ${newHeight}m), top at: ${bottomY + actualNewHeight}m`);
  }

  /**
   * Update Broad_weir_fluid (Weir Overflow Tank water) mesh height
   * This is used for weir_overflow simulation where Broad_weir_fluid.stl represents water
   */
  updateSedTankWater(tankType: 'weir_overflow_sph', waterHeight: number): void {
    if (!this._model) {
      console.warn('No model loaded - cannot update Broad_weir_fluid height');
      return;
    }

    // Find the Broad_weir_fluid mesh
    let broadWeirMesh: THREE.Mesh | null = null;
    this._model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === 'Broad_weir_fluid') {
        broadWeirMesh = child;
      }
    });

    if (!broadWeirMesh) {
      console.warn('Broad_weir_fluid mesh not found - cannot update water height');
      return;
    }

    // Update the water geometry height
    this.updateSTLWaterGeometry(broadWeirMesh, waterHeight);
    console.log(`Updated Broad_weir_fluid (${tankType}) height to: ${waterHeight}m`);

    this.render();
  }

  /**
   * Update STL water mesh geometry (for Broad_weir_fluid)
   * Modifies Y-axis (vertical) to adjust water height while keeping bottom fixed
   */
  private updateSTLWaterGeometry(waterMesh: THREE.Mesh, newHeight: number): void {
    const geometry = waterMesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    if (!positionAttribute) {
      console.warn('Position attribute not found in Broad_weir_fluid mesh');
      return;
    }

    const positions = positionAttribute.array as Float32Array;

    // Find current Y-axis range
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]; // Y is vertical
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const currentHeight = maxY - minY;
    console.log(`Broad_weir_fluid current Y range: ${minY} to ${maxY}, height: ${currentHeight}m`);

    // Use the bottom Y coordinate as fixed point
    const bottomY = minY;

    // Tank height limits (maximum 1.6m)
    const maxAllowedHeight = 1.6;
    const actualNewHeight = newHeight > maxAllowedHeight ? maxAllowedHeight : newHeight;

    if (newHeight > maxAllowedHeight) {
      console.warn(`Requested water height (${newHeight}m) exceeds max allowed (${maxAllowedHeight}m). Clamping.`);
    }

    // Update each vertex position
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];

      // Calculate height ratio (0 = bottom, 1 = top)
      const heightRatio = (y - bottomY) / currentHeight;

      // Apply new height while keeping bottom fixed
      positions[i + 1] = bottomY + (heightRatio * actualNewHeight);
    }

    // Update geometry
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    console.log(`Updated Broad_weir_fluid geometry: bottom fixed at ${bottomY}m, new height: ${actualNewHeight}m, top at: ${bottomY + actualNewHeight}m`);
  }


  setCameraForTank(tankType: 'lbm' | 'sph'): void {
    if (tankType === 'lbm') {
      // LBM 수조 - Y-up 좌표계에서 적당한 거리에서 전체 수조가 보이도록
      this._camera.position.set(0.08, 0.1, -0.08);
      this._camera.lookAt(0, 0.02, 0);
    } else {
      // SPH 수조 - Y-up 좌표계에서 적당한 거리에서 전체 수조가 보이도록
      this._camera.position.set(0.08, 0.12, -0.08);
      this._camera.lookAt(0, 0.025, 0);
    }

    this.controls.target.set(0, tankType === 'lbm' ? 0.02 : 0.025, 0);
    this.controls.update();

    console.log(`Camera set for ${tankType} tank (STL-based):`, {
      position: this._camera.position,
      target: this.controls.target
    });
  }


  clearTank(): void {
    if (this._tankGroup) {
      this._scene.remove(this._tankGroup);
      this._tankGroup = null;
    }

    if (this._waterMesh) {
      this._scene.remove(this._waterMesh);
      this._waterMesh = null;
    }

    this.render();
  }

  /**
   * Create domain box for OpenFOAM simulations (rectangular only)
   */
  createDomain(width: number, height: number, depth: number): void {
    console.log(`Creating rectangular domain box: ${width}m x ${height}m x ${depth}m`);

    // Remove existing domain
    this.clearDomain();

    const domainGroup = new THREE.Group();

    // Rectangular box
    // For pipe: depth=length (X-axis), width=width (Y-axis), height=height (Z-axis)
    // This matches OpenFOAM blockMeshDict coordinates:
    // X: 0 to length (axial/flow direction)
    // Y: 0 to width
    // Z: 0 to height
    const geometry = new THREE.BoxGeometry(depth, width, height);

    const centerX = depth / 2;
    const centerY = width / 2;
    const centerZ = height / 2;

    console.log(`[Viewer] Rectangular pipe coordinates:
  Width: ${width}m, Height: ${height}m, Length: ${depth}m
  Extent: X=[0, ${depth}], Y=[0, ${width}], Z=[0, ${height}]`);

    // Create edges geometry
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0066ff,
      linewidth: 2,
      opacity: 0.8,
      transparent: true
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);

    // Position the domain
    wireframe.position.set(centerX, centerY, centerZ);
    wireframe.name = 'domain_wireframe';

    // Make wireframe not pickable
    wireframe.raycast = () => {};
    wireframe.userData = { isDomain: true, raycastIgnore: true };

    domainGroup.add(wireframe);

    // Add semi-transparent faces for inlet/outlet visibility
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const faceMesh = new THREE.Mesh(geometry, faceMaterial);
    faceMesh.position.set(centerX, centerY, centerZ);
    faceMesh.name = 'domain_faces';

    // Make faces not pickable
    faceMesh.raycast = () => {};
    faceMesh.userData = { isDomain: true, raycastIgnore: true };

    domainGroup.add(faceMesh);

    domainGroup.name = 'domain_group';
    this._domainGroup = domainGroup;
    this._scene.add(domainGroup);

    // Adjust camera to view the domain
    const maxDim = Math.max(width, height, depth);
    this.fitCameraToDomain(maxDim, maxDim, maxDim);

    console.log(`Domain created successfully (rectangular)`);
    this.render();
  }

  /**
   * Clear domain visualization
   */
  clearDomain(): void {
    if (this._domainGroup) {
      this._scene.remove(this._domainGroup);

      // Dispose geometries and materials
      this._domainGroup.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      this._domainGroup = null;
    }

    // Also clear water mesh if it exists
    if (this._waterMesh) {
      this._scene.remove(this._waterMesh);
      if (this._waterMesh.geometry) {
        this._waterMesh.geometry.dispose();
      }
      if (this._waterMesh.material) {
        if (Array.isArray(this._waterMesh.material)) {
          this._waterMesh.material.forEach(m => m.dispose());
        } else {
          this._waterMesh.material.dispose();
        }
      }
      this._waterMesh = null;
    }

    this.render();
  }

  /**
   * Create water column for dam break simulation
   *
   * Coordinate system mapping:
   * OpenFOAM (Y-up):           Three.js Viewer (Z-up):
   * - X: domainLength (0.584m)  →  Y: domainLength
   * - Y: domainHeight (0.4m)    →  Z: domainHeight (UP)
   * - Z: domainDepth (0.01m)    →  X: domainDepth
   *
   * OpenFOAM water box (0 0 0) to (waterColumnWidth, waterColumnHeight, domainDepth)
   * Three.js water box: X=[0, domainDepth], Y=[0, waterColumnWidth], Z=[0, waterColumnHeight]
   */
  createDamBreakWater(waterColumnWidth: number, waterColumnHeight: number, domainDepth: number): void {
    console.log(`[Dam Break] Creating water column`);
    console.log(`  OpenFOAM: width=${waterColumnWidth}m (X), height=${waterColumnHeight}m (Y), depth=${domainDepth}m (Z)`);
    console.log(`  Three.js: X=${domainDepth}m, Y=${waterColumnWidth}m, Z=${waterColumnHeight}m`);

    // Remove existing water if any
    if (this._waterMesh) {
      this._scene.remove(this._waterMesh);
      if (this._waterMesh.geometry) this._waterMesh.geometry.dispose();
      if (this._waterMesh.material) {
        if (Array.isArray(this._waterMesh.material)) {
          this._waterMesh.material.forEach(m => m.dispose());
        } else {
          this._waterMesh.material.dispose();
        }
      }
      this._waterMesh = null;
    }

    // Create water column geometry
    // Three.js BoxGeometry(X-size, Y-size, Z-size)
    const geometry = new THREE.BoxGeometry(domainDepth, waterColumnWidth, waterColumnHeight);

    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x1e88e5,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const waterMesh = new THREE.Mesh(geometry, waterMaterial);

    // Position water column at left side of domain, bottom aligned
    // Water box: X=[0, domainDepth], Y=[0, waterColumnWidth], Z=[0, waterColumnHeight]
    // Box center position
    waterMesh.position.set(
      domainDepth / 2,         // X: center of depth (OpenFOAM Z)
      waterColumnWidth / 2,    // Y: left side (OpenFOAM X)
      waterColumnHeight / 2    // Z: bottom aligned (OpenFOAM Y)
    );

    waterMesh.name = 'dam_break_water';
    waterMesh.castShadow = true;
    waterMesh.renderOrder = 1;

    this._waterMesh = waterMesh;
    this._scene.add(waterMesh);

    console.log(`  Position: (${domainDepth/2}, ${waterColumnWidth/2}, ${waterColumnHeight/2})`);
    this.render();
  }

  /**
   * Update dam break water column dimensions
   */
  updateDamBreakWater(waterColumnWidth: number, waterColumnHeight: number, domainDepth: number): void {
    if (!this._waterMesh || this._waterMesh.name !== 'dam_break_water') {
      console.warn('No dam break water mesh to update');
      return;
    }

    // Update geometry
    if (this._waterMesh.geometry) {
      this._waterMesh.geometry.dispose();
    }

    // Match domain coordinate system: X=depth, Y=width, Z=height
    const newGeometry = new THREE.BoxGeometry(domainDepth, waterColumnWidth, waterColumnHeight);
    this._waterMesh.geometry = newGeometry;

    // Update position (left side of domain, bottom aligned)
    this._waterMesh.position.set(
      domainDepth / 2,
      waterColumnWidth / 2,
      waterColumnHeight / 2
    );

    console.log(`Dam break water column updated: ${waterColumnWidth}m x ${waterColumnHeight}m`);
    this.render();
  }

  /**
   * Fit camera to domain
   */
  private fitCameraToDomain(width: number, height: number, depth: number): void {
    const maxDim = Math.max(width, height, depth);
    const fov = this._camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;

    // Position camera to view the domain from an angle
    const centerX = width / 2;
    const centerY = height / 2;
    const centerZ = 0;

    this._camera.position.set(
      centerX + distance * 0.7,
      centerY + distance * 0.5,
      distance * 0.7
    );
    this._camera.lookAt(centerX, centerY, centerZ);

    this.controls.target.set(centerX, centerY, centerZ);
    this.controls.update();

    console.log(`Camera adjusted for domain:`, {
      position: this._camera.position,
      target: this.controls.target
    });
  }



  /**
   * 수조 투명도 업데이트 (물은 제외하고 탱크만)
   */
  updateTankOpacity(opacity: number): void {
    if (!this._tankGroup) return;

    this._tankGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // 물 메시는 제외하고 탱크 메시만 투명도 조절
        if (child.name && child.name.includes('_water')) {
          return; // 물 메시는 건드리지 않음
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshPhongMaterial) {
              mat.opacity = opacity;
              mat.transparent = opacity < 1.0;
            }
          });
        } else if (child.material instanceof THREE.MeshPhongMaterial) {
          child.material.opacity = opacity;
          child.material.transparent = opacity < 1.0;
        }
      }
    });

    console.log(`Tank opacity updated to: ${opacity}`);
    this.render();
  }

  /**
   * STL 파일로 export (물과 수조를 분리하여 export)
   * LBM/SPH의 경우 수조와 물 모두 원본 STL 파일 사용
   */
  async exportToSTL(): Promise<void> {
    if (!this._tankGroup) {
      console.warn('No tank to export');
      return;
    }

    const meshes: THREE.Mesh[] = [];

    // 탱크 그룹에서 메시 수집
    this._tankGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });

    // 탱크와 물 메시 찾기
    const tankMesh = meshes.find(mesh => mesh.name?.includes('_tank'));
    const waterMesh = meshes.find(mesh => mesh.name?.includes('_water'));

    // 탱크 STL export - 원본 STL 파일에서 로드
    if (tankMesh) {
      const tankName = tankMesh.name || 'tank';

      // LBM 또는 SPH tank인 경우 원본 STL에서 로드
      if (tankMesh.name?.includes('lbm_tank') || tankMesh.name?.includes('sph_tank')) {
        const tankType = tankMesh.name.includes('lbm_tank') ? 'lbm' : 'sph';
        try {
          console.log(`Exporting tank from ${tankType}_tank.stl`);
          const loader = new STLLoader();
          const tankOriginalGeometry = await this.loadSTL(loader, `/models/sedimentation-column/${tankType}_tank.stl`);

          // 임시 메시 생성하여 STL 데이터 생성
          const tempMesh = new THREE.Mesh(tankOriginalGeometry);
          tempMesh.updateMatrixWorld(true);
          const tankSTLData = this.generateBinarySTL(tempMesh);

          // 지오메트리 정리
          tankOriginalGeometry.dispose();

          this.downloadSTLBinary(tankSTLData, `${tankName}.stl`);
          console.log(`Using ${tankType}_tank.stl for tank export`);
        } catch (error) {
          console.error(`Failed to load ${tankType}_tank.stl, using rendered tank mesh:`, error);
          const tankSTLData = this.generateBinarySTL(tankMesh);
          this.downloadSTLBinary(tankSTLData, `${tankName}.stl`);
        }
      } else {
        // 기타 탱크 타입은 렌더링된 메시 사용
        console.log(`Exporting tank: ${tankName}`);
        const tankSTLData = this.generateBinarySTL(tankMesh);
        this.downloadSTLBinary(tankSTLData, `${tankName}.stl`);
      }
    } else {
      console.warn('Tank mesh not found for export');
    }

    // 물 STL export - 원본 STL 파일에서 로드
    if (waterMesh) {
      const waterName = waterMesh.name || 'water';

      // LBM 또는 SPH water인 경우 원본 STL에서 로드
      if (waterMesh.name?.includes('lbm_water') || waterMesh.name?.includes('sph_water')) {
        const waterType = waterMesh.name.includes('lbm_water') ? 'lbm' : 'sph';
        try {
          console.log(`Exporting water from ${waterType}_water_temp.stl`);
          const loader = new STLLoader();
          const waterTempGeometry = await this.loadSTL(loader, `/models/sedimentation-column/${waterType}_water_temp.stl`);

          // 임시 메시 생성하여 STL 데이터 생성
          const tempMesh = new THREE.Mesh(waterTempGeometry);
          tempMesh.updateMatrixWorld(true);
          const waterSTLData = this.generateBinarySTL(tempMesh);

          // 지오메트리 정리
          waterTempGeometry.dispose();

          this.downloadSTLBinary(waterSTLData, `${waterName}_temp.stl`);
          console.log(`Using ${waterType}_water_temp.stl for water export`);
        } catch (error) {
          console.error(`Failed to load ${waterType}_water_temp.stl, using rendered water mesh:`, error);
          const waterSTLData = this.generateBinarySTL(waterMesh);
          this.downloadSTLBinary(waterSTLData, `${waterName}.stl`);
        }
      } else {
        // 기타 탱크 타입은 렌더링된 메시 사용
        console.log(`Exporting water: ${waterName}`);
        const waterSTLData = this.generateBinarySTL(waterMesh);
        this.downloadSTLBinary(waterSTLData, `${waterName}.stl`);
      }
    } else {
      console.warn('Water mesh not found for export');
    }

    if (tankMesh || waterMesh) {
      console.log('STL export completed - tank and water exported separately as binary files');
    }
  }

  /**
   * 메시를 바이너리 STL 데이터로 변환
   */
  private generateBinarySTL(mesh: THREE.Mesh): ArrayBuffer {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position;
    const normalAttribute = geometry.attributes.normal;
    const indexAttribute = geometry.index;

    if (!positionAttribute) {
      throw new Error('Geometry has no position attribute');
    }

    const positions = positionAttribute.array as Float32Array;
    const normals = normalAttribute ? normalAttribute.array as Float32Array : null;

    // 삼각형 수 계산
    let triangleCount = 0;
    if (indexAttribute) {
      triangleCount = indexAttribute.count / 3;
    } else {
      triangleCount = positionAttribute.count / 3;
    }

    // 바이너리 STL 구조:
    // Header (80 bytes) + Triangle count (4 bytes) + Triangles (50 bytes each)
    const headerSize = 80;
    const triangleCountSize = 4;
    const triangleSize = 50; // 12 floats (normal + 3 vertices) + 2 bytes attribute
    const totalSize = headerSize + triangleCountSize + (triangleCount * triangleSize);

    const buffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(buffer);
    const uint8Array = new Uint8Array(buffer);

    // STL Header (80 bytes)
    const header = `Binary STL generated by CFD Preprocessor - ${mesh.name || 'mesh'}`;
    const headerBytes = new TextEncoder().encode(header.padEnd(80, '\0').substring(0, 80));
    uint8Array.set(headerBytes, 0);

    // Triangle count (4 bytes, little-endian)
    dataView.setUint32(80, triangleCount, true);

    // 메시의 world matrix 가져오기
    mesh.updateMatrixWorld(true);
    const worldMatrix = mesh.matrixWorld;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);

    let offset = 84; // Header + triangle count

    if (indexAttribute) {
      // Indexed geometry
      const indices = indexAttribute.array;

      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;

        offset = this.writeTriangleToSTL(
          dataView, offset, positions, normals,
          a, b, c, worldMatrix, normalMatrix
        );
      }
    } else {
      // Non-indexed geometry
      for (let i = 0; i < positions.length; i += 9) {
        const a = i;
        const b = i + 3;
        const c = i + 6;

        offset = this.writeTriangleToSTL(
          dataView, offset, positions, normals,
          a, b, c, worldMatrix, normalMatrix
        );
      }
    }

    return buffer;
  }

  /**
   * STL 바이너리 데이터에 삼각형 쓰기
   */
  private writeTriangleToSTL(
    dataView: DataView,
    offset: number,
    positions: Float32Array,
    normals: Float32Array | null,
    a: number, b: number, c: number,
    worldMatrix: THREE.Matrix4,
    normalMatrix: THREE.Matrix3
  ): number {
    // 삼각형의 세 점 가져오기
    const p1 = new THREE.Vector3(positions[a], positions[a + 1], positions[a + 2]);
    const p2 = new THREE.Vector3(positions[b], positions[b + 1], positions[b + 2]);
    const p3 = new THREE.Vector3(positions[c], positions[c + 1], positions[c + 2]);

    // World 좌표로 변환
    p1.applyMatrix4(worldMatrix);
    p2.applyMatrix4(worldMatrix);
    p3.applyMatrix4(worldMatrix);

    // 법선 벡터 계산
    let normal: THREE.Vector3;
    if (normals) {
      // 기존 법선 사용
      const n1 = new THREE.Vector3(normals[a], normals[a + 1], normals[a + 2]);
      const n2 = new THREE.Vector3(normals[b], normals[b + 1], normals[b + 2]);
      const n3 = new THREE.Vector3(normals[c], normals[c + 1], normals[c + 2]);

      // 평균 법선
      normal = new THREE.Vector3()
        .addVectors(n1, n2)
        .add(n3)
        .divideScalar(3)
        .applyMatrix3(normalMatrix)
        .normalize();
    } else {
      // 법선 계산
      const edge1 = new THREE.Vector3().subVectors(p2, p1);
      const edge2 = new THREE.Vector3().subVectors(p3, p1);
      normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    }

    // Normal vector (12 bytes)
    dataView.setFloat32(offset, normal.x, true); offset += 4;
    dataView.setFloat32(offset, normal.y, true); offset += 4;
    dataView.setFloat32(offset, normal.z, true); offset += 4;

    // Vertex 1 (12 bytes)
    dataView.setFloat32(offset, p1.x, true); offset += 4;
    dataView.setFloat32(offset, p1.y, true); offset += 4;
    dataView.setFloat32(offset, p1.z, true); offset += 4;

    // Vertex 2 (12 bytes)
    dataView.setFloat32(offset, p2.x, true); offset += 4;
    dataView.setFloat32(offset, p2.y, true); offset += 4;
    dataView.setFloat32(offset, p2.z, true); offset += 4;

    // Vertex 3 (12 bytes)
    dataView.setFloat32(offset, p3.x, true); offset += 4;
    dataView.setFloat32(offset, p3.y, true); offset += 4;
    dataView.setFloat32(offset, p3.z, true); offset += 4;

    // Attribute byte count (2 bytes) - usually 0
    dataView.setUint16(offset, 0, true); offset += 2;

    return offset;
  }

  /**
   * 바이너리 STL 데이터를 파일로 다운로드
   */
  private downloadSTLBinary(stlData: ArrayBuffer, filename: string): void {
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log(`Downloaded binary STL: ${filename} (${(stlData.byteLength / 1024).toFixed(2)} KB)`);
  }

  /**
   * STL 데이터를 반환하는 함수 (파일 생성 없이 데이터만)
   * LBM/SPH의 경우 수조와 물 모두 원본 STL 파일에서 로드
   */
  async getSTLData(): Promise<{ tankData: ArrayBuffer | null, waterData: ArrayBuffer | null }> {
    if (!this._tankGroup) {
      console.warn('No tank to export');
      return { tankData: null, waterData: null };
    }

    const meshes: THREE.Mesh[] = [];

    // 탱크 그룹에서 메시 수집
    this._tankGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });

    // 탱크와 물 메시 찾기
    const tankMesh = meshes.find(mesh => mesh.name?.includes('_tank'));
    const waterMesh = meshes.find(mesh => mesh.name?.includes('_water'));

    // LBM 또는 SPH의 경우 원본 STL 파일에서 수조 데이터 로드
    let tankData: ArrayBuffer | null = null;
    if (tankMesh?.name?.includes('lbm_tank') || tankMesh?.name?.includes('sph_tank')) {
      const tankType = tankMesh.name.includes('lbm_tank') ? 'lbm' : 'sph';
      try {
        const loader = new STLLoader();
        const tankOriginalGeometry = await this.loadSTL(loader, `/models/sedimentation-column/${tankType}_tank.stl`);

        // 임시 메시 생성하여 STL 데이터 생성
        const tempMesh = new THREE.Mesh(tankOriginalGeometry);
        tempMesh.updateMatrixWorld(true);
        tankData = this.generateBinarySTL(tempMesh);

        // 지오메트리 정리
        tankOriginalGeometry.dispose();

        console.log(`Using ${tankType}_tank.stl for tank data`);
      } catch (error) {
        console.error(`Failed to load ${tankType}_tank.stl, using rendered tank mesh:`, error);
        tankData = this.generateBinarySTL(tankMesh);
      }
    } else {
      // 기타 탱크 타입은 렌더링된 메시 사용
      tankData = tankMesh ? this.generateBinarySTL(tankMesh) : null;
    }

    // LBM 또는 SPH의 경우 원본 STL 파일에서 물 데이터 로드
    let waterData: ArrayBuffer | null = null;
    if (waterMesh?.name?.includes('lbm_water') || waterMesh?.name?.includes('sph_water')) {
      const waterType = waterMesh.name.includes('lbm_water') ? 'lbm' : 'sph';
      try {
        const loader = new STLLoader();
        const waterTempGeometry = await this.loadSTL(loader, `/models/sedimentation-column/${waterType}_water_temp.stl`);

        // 임시 메시 생성하여 STL 데이터 생성
        const tempMesh = new THREE.Mesh(waterTempGeometry);
        tempMesh.updateMatrixWorld(true);
        waterData = this.generateBinarySTL(tempMesh);

        // 지오메트리 정리
        waterTempGeometry.dispose();

        console.log(`Using ${waterType}_water_temp.stl for water data`);
      } catch (error) {
        console.error(`Failed to load ${waterType}_water_temp.stl, using rendered water mesh:`, error);
        waterData = this.generateBinarySTL(waterMesh);
      }
    } else {
      // 기타 탱크 타입은 렌더링된 메시 사용
      waterData = waterMesh ? this.generateBinarySTL(waterMesh) : null;
    }

    console.log('STL data generated:', {
      tank: tankData ? `${(tankData.byteLength / 1024).toFixed(2)} KB` : 'none',
      water: waterData ? `${(waterData.byteLength / 1024).toFixed(2)} KB` : 'none'
    });

    return { tankData, waterData };
  }
}
