/**
 * @file Picking.ts
 * @brief CFD Preprocessor Mesh 단위 피킹 시스템
 */

import * as THREE from 'three';

export type PickResult = {
  kind: 'mesh';
  object: THREE.Mesh;
  point: THREE.Vector3;
  distance: number;
  normal?: THREE.Vector3;
  uv?: THREE.Vector2;
};

interface PickingParams {
  camera: THREE.Camera;
  scene: THREE.Scene;
}

export class Picking {
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  
  // 레이캐스터
  private raycaster: THREE.Raycaster;
  
  // 캐시
  private lastPickResult: PickResult | null = null;
  private lastPickNDC: THREE.Vector2 = new THREE.Vector2();
  
  // 피킹 가능한 메시들
  private pickableMeshes: THREE.Mesh[] = [];
  
  constructor(params: PickingParams) {
    this.camera = params.camera;
    this.scene = params.scene;
    
    // 레이캐스터 설정
    this.raycaster = new THREE.Raycaster();
    
    // Scene에서 모든 메시 찾기
    this.updatePickableMeshes();
    
    console.log('Mesh picking initialized:', {
      meshCount: this.pickableMeshes.length,
      meshes: this.pickableMeshes.map(m => ({ 
        name: m.name || 'unnamed',
        visible: m.visible,
        vertices: m.geometry.attributes.position?.count 
      }))
    });
  }
  
  /**
   * 피킹 가능한 메시 목록 업데이트
   */
  updatePickableMeshes(): void {
    this.pickableMeshes = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 헬퍼나 하이라이트 메시는 제외
        // TransformControls 관련 객체들도 제외
        const name = object.name?.toLowerCase() || '';
        const parentName = object.parent?.name?.toLowerCase() || '';
        
        // TransformControls 및 도메인 관련 객체들 필터링
        if (name.includes('transformcontrol') ||
            parentName.includes('transformcontrol') ||
            name.includes('gizmo') ||
            name.includes('plane') ||
            name.includes('helper') ||
            name.includes('highlight') ||
            name.includes('grid') ||
            object.userData?.isHelper ||
            object.userData?.isGizmo ||
            object.userData?.isTransformControl ||
            object.userData?.isDomainBox ||
            object.userData?.isDomainBoundary ||
            object.userData?.isGrid ||
            object.userData?.raycastIgnore) {
          // TransformControls 관련 객체 및 그리드는 피킹 대상에서 제외
          return;
        }
        
        // TransformControlsPlane 타입 체크 (Three.js 내부 클래스)
        if (object.type === 'TransformControlsPlane' || 
            object.constructor.name === 'TransformControlsPlane' ||
            object.constructor.name === 'TransformControlsGizmo') {
          return;
        }
        
        this.pickableMeshes.push(object);
      }
    });
  }
  
  /**
   * 특정 메시를 피킹 가능 목록에 추가
   */
  addPickableMesh(mesh: THREE.Mesh): void {
    if (!this.pickableMeshes.includes(mesh)) {
      this.pickableMeshes.push(mesh);
    }
  }
  
  /**
   * 특정 메시를 피킹 가능 목록에서 제거
   */
  removePickableMesh(mesh: THREE.Mesh): void {
    const index = this.pickableMeshes.indexOf(mesh);
    if (index > -1) {
      this.pickableMeshes.splice(index, 1);
    }
  }
  
  /**
   * Mesh 피킹
   */
  private pickMesh(ndc: THREE.Vector2): PickResult | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    
    // TransformControls 관련 객체들을 추가로 필터링
    const filteredMeshes = this.pickableMeshes.filter(mesh => {
      const name = mesh.name?.toLowerCase() || '';
      const parentName = mesh.parent?.name?.toLowerCase() || '';
      
      // TransformControls 및 도메인 관련 객체들 제외
      if (name.includes('transformcontrol') || 
          parentName.includes('transformcontrol') ||
          mesh.type === 'TransformControlsPlane' ||
          mesh.userData?.isTransformControl ||
          mesh.userData?.isHelper ||
          mesh.userData?.isGizmo ||
          mesh.userData?.isDomainBox ||
          mesh.userData?.isDomainBoundary) {
        return false;
      }
      
      return true;
    });
    
    // 필터링된 메시에 대해 레이캐스팅
    const intersects = this.raycaster.intersectObjects(filteredMeshes, false);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      const result: PickResult = {
        kind: 'mesh',
        object: hit.object as THREE.Mesh,
        point: hit.point.clone(),
        distance: hit.distance,
        normal: hit.face?.normal.clone(),
        uv: hit.uv?.clone()
      };
      
      console.log('Mesh picked:', {
        name: result.object.name || 'unnamed',
        point: result.point.toArray(),
        distance: result.distance
      });
      
      return result;
    }
    
    return null;
  }
  
  /**
   * 클릭용 피킹
   */
  pick(ndc: THREE.Vector2): PickResult | null {
    // 캐시 확인
    if (this.lastPickNDC.equals(ndc) && this.lastPickResult) {
      return this.lastPickResult;
    }
    
    const result = this.pickMesh(ndc);
    
    this.lastPickResult = result;
    this.lastPickNDC.copy(ndc);
    
    return result;
  }
  
  /**
   * 호버용 피킹
   */
  hoverPick(ndc: THREE.Vector2): PickResult | null {
    return this.pickMesh(ndc);
  }
  
  /**
   * 빠른 피킹 (호버용 별칭)
   */
  quickPick(ndc: THREE.Vector2): PickResult | null {
    return this.pickMesh(ndc);
  }
  
  /**
   * 피킹 설정 (호환성 유지)
   */
  setPickingOptions(_options: any) {
    // Mesh 단위 피킹에서는 사용하지 않음
    console.log('Picking options not applicable for mesh-level picking');
  }
  
  /**
   * 토폴로지 설정 (호환성 유지)
   */
  setTopology(_topo: any) {
    // Mesh 단위 피킹에서는 사용하지 않음
  }
  
  /**
   * 맵핑 설정 (호환성 유지)
   */
  setMappings(_tri2face: any, _seg2edge: any) {
    // Mesh 단위 피킹에서는 사용하지 않음
  }
  
  /**
   * 디버그 정보 출력
   */
  debugPick(ndc: THREE.Vector2): void {
    console.group('Mesh Picking Debug');
    console.log('NDC:', ndc);
    console.log('Pickable meshes:', this.pickableMeshes.length);
    
    this.pickableMeshes.forEach((mesh, i) => {
      console.log(`Mesh ${i}:`, {
        name: mesh.name || 'unnamed',
        visible: mesh.visible,
        position: mesh.position.toArray(),
        vertices: mesh.geometry.attributes.position?.count
      });
    });
    
    const result = this.pickMesh(ndc);
    console.log('Pick result:', result);
    
    console.groupEnd();
  }
  
  /**
   * 모든 메시 검사 (디버깅용)
   */
  testAllMeshes(): void {
    console.log('Testing all meshes:');
    
    const testNDC = new THREE.Vector2(0, 0); // 중앙
    this.raycaster.setFromCamera(testNDC, this.camera);
    
    this.pickableMeshes.forEach((mesh, i) => {
      const intersects = this.raycaster.intersectObject(mesh, false);
      console.log(`Mesh ${i} (${mesh.name || 'unnamed'}):`, {
        intersections: intersects.length,
        visible: mesh.visible,
        material: (mesh.material as THREE.Material).type
      });
    });
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.lastPickResult = null;
    this.pickableMeshes = [];
  }
}
