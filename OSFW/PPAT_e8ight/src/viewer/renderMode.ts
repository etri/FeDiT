/**
 * @file RenderMode.ts
 * @brief CFD Preprocessor 렌더링 모드 관리 (Solid, Wireframe, Edges)
 */

import * as THREE from 'three';

export const RenderModeType = {
  SOLID: 'solid',
  WIREFRAME: 'wireframe',
  EDGES: 'edges',
  SOLID_EDGES: 'solid+edges',
  HIDDEN_EDGES: 'hidden-edges'
} as const;

export type RenderModeType = typeof RenderModeType[keyof typeof RenderModeType];

export class RenderMode {
  private scene: THREE.Scene;
  private currentMode: RenderModeType = RenderModeType.SOLID;
  private originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
  private edgeLines: Map<THREE.Mesh, THREE.LineSegments> = new Map();
  private hiddenEdgeLines: Map<THREE.Mesh, THREE.LineSegments> = new Map();
  
  // 렌더링 모드별 설정
  private wireframeMaterial: THREE.MeshBasicMaterial;
  private edgeMaterial: THREE.LineBasicMaterial;
  private hiddenEdgeMaterial: THREE.LineBasicMaterial;
  private solidMaterial: THREE.MeshPhongMaterial;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // 와이어프레임 재질
    this.wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    
    // 엣지 재질 (선명한 엣지)
    this.edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1
    });
    
    // 히든 엣지 재질 (숨겨진 엣지)
    this.hiddenEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x666666,
      linewidth: 1,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      depthWrite: false
    });
    
    // 기본 솔리드 재질
    this.solidMaterial = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      shininess: 60,
      side: THREE.DoubleSide
    });
  }
  
  /**
   * 렌더링 모드 설정
   */
  setMode(mode: RenderModeType): void {
    if (this.currentMode === mode) return;
    
    // 이전 모드 정리
    this.cleanup();
    
    this.currentMode = mode;
    
    // 새 모드 적용
    this.applyMode();
    
    console.log(`Render mode changed to: ${mode}`);
  }
  
  /**
   * 현재 모드 가져오기
   */
  getMode(): RenderModeType {
    return this.currentMode;
  }
  
  /**
   * 모드 적용
   */
  private applyMode(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && !object.userData?.isHelper) {
        switch (this.currentMode) {
          case RenderModeType.SOLID:
            this.applySolidMode(object);
            break;
          case RenderModeType.WIREFRAME:
            this.applyWireframeMode(object);
            break;
          case RenderModeType.EDGES:
            this.applyEdgesMode(object);
            break;
          case RenderModeType.SOLID_EDGES:
            this.applySolidEdgesMode(object);
            break;
          case RenderModeType.HIDDEN_EDGES:
            this.applyHiddenEdgesMode(object);
            break;
        }
      }
    });
  }
  
  /**
   * 솔리드 모드
   */
  private applySolidMode(mesh: THREE.Mesh): void {
    // 원본 재질 복원
    const original = this.originalMaterials.get(mesh);
    if (original) {
      mesh.material = original;
    }
    mesh.visible = true;
  }
  
  /**
   * 와이어프레임 모드
   */
  private applyWireframeMode(mesh: THREE.Mesh): void {
    // 원본 재질 저장
    if (!this.originalMaterials.has(mesh)) {
      this.originalMaterials.set(mesh, mesh.material);
    }
    
    // 와이어프레임 재질 적용
    const wireframeMat = this.wireframeMaterial.clone();
    
    // 원본 색상 유지 옵션
    const originalMat = mesh.material as THREE.MeshPhongMaterial;
    if (originalMat.color) {
      wireframeMat.color = originalMat.color;
    }
    
    mesh.material = wireframeMat;
    mesh.visible = true;
  }
  
  /**
   * 엣지 모드
   */
  private applyEdgesMode(mesh: THREE.Mesh): void {
    // 메시 숨기기
    mesh.visible = false;
    
    // 엣지 라인 생성
    let edgeLine = this.edgeLines.get(mesh);
    if (!edgeLine) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 30); // 30도 임계값
      edgeLine = new THREE.LineSegments(edges, this.edgeMaterial);
      
      // 메시와 같은 변환 적용
      edgeLine.position.copy(mesh.position);
      edgeLine.rotation.copy(mesh.rotation);
      edgeLine.scale.copy(mesh.scale);
      
      // 메시와 같은 부모에 추가
      if (mesh.parent) {
        mesh.parent.add(edgeLine);
      } else {
        this.scene.add(edgeLine);
      }
      
      this.edgeLines.set(mesh, edgeLine);
    }
    
    edgeLine.visible = true;
  }
  
  /**
   * 솔리드 + 엣지 모드
   */
  private applySolidEdgesMode(mesh: THREE.Mesh): void {
    // 솔리드 표시
    this.applySolidMode(mesh);
    
    // 엣지 라인 추가
    let edgeLine = this.edgeLines.get(mesh);
    if (!edgeLine) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
      edgeLine = new THREE.LineSegments(edges, this.edgeMaterial.clone());
      
      // 메시와 같은 변환 적용
      edgeLine.position.copy(mesh.position);
      edgeLine.rotation.copy(mesh.rotation);
      edgeLine.scale.copy(mesh.scale);
      
      // renderOrder로 엣지가 위에 그려지도록
      edgeLine.renderOrder = 1;
      
      if (mesh.parent) {
        mesh.parent.add(edgeLine);
      } else {
        this.scene.add(edgeLine);
      }
      
      this.edgeLines.set(mesh, edgeLine);
    }
    
    edgeLine.visible = true;
  }
  
  /**
   * 히든 엣지 모드 (숨겨진 선도 표시)
   */
  private applyHiddenEdgesMode(mesh: THREE.Mesh): void {
    // 솔리드 표시
    this.applySolidMode(mesh);
    
    // 보이는 엣지
    let edgeLine = this.edgeLines.get(mesh);
    if (!edgeLine) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
      edgeLine = new THREE.LineSegments(edges, this.edgeMaterial.clone());
      
      edgeLine.position.copy(mesh.position);
      edgeLine.rotation.copy(mesh.rotation);
      edgeLine.scale.copy(mesh.scale);
      edgeLine.renderOrder = 2;
      
      if (mesh.parent) {
        mesh.parent.add(edgeLine);
      } else {
        this.scene.add(edgeLine);
      }
      
      this.edgeLines.set(mesh, edgeLine);
    }
    
    // 숨겨진 엣지
    let hiddenLine = this.hiddenEdgeLines.get(mesh);
    if (!hiddenLine) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
      hiddenLine = new THREE.LineSegments(edges, this.hiddenEdgeMaterial.clone());
      
      hiddenLine.position.copy(mesh.position);
      hiddenLine.rotation.copy(mesh.rotation);
      hiddenLine.scale.copy(mesh.scale);
      hiddenLine.renderOrder = 0;
      
      if (mesh.parent) {
        mesh.parent.add(hiddenLine);
      } else {
        this.scene.add(hiddenLine);
      }
      
      this.hiddenEdgeLines.set(mesh, hiddenLine);
    }
    
    edgeLine.visible = true;
    hiddenLine.visible = true;
  }
  
  /**
   * 정리
   */
  private cleanup(): void {
    // 엣지 라인 제거
    this.edgeLines.forEach((line, _mesh) => {
      if (line.parent) {
        line.parent.remove(line);
      }
      line.geometry.dispose();
    });
    
    // 히든 엣지 라인 제거
    this.hiddenEdgeLines.forEach((line, _mesh) => {
      if (line.parent) {
        line.parent.remove(line);
      }
      line.geometry.dispose();
    });
    
    // 원본 재질 복원
    this.originalMaterials.forEach((material, mesh) => {
      mesh.material = material;
      mesh.visible = true;
    });
    
    this.edgeLines.clear();
    this.hiddenEdgeLines.clear();
  }
  
  /**
   * 와이어프레임 색상 설정
   */
  setWireframeColor(color: string | number): void {
    this.wireframeMaterial.color.set(color);
    
    // 현재 와이어프레임 모드면 즉시 적용
    if (this.currentMode === RenderModeType.WIREFRAME) {
      this.applyMode();
    }
  }
  
  /**
   * 엣지 색상 설정
   */
  setEdgeColor(color: string | number): void {
    this.edgeMaterial.color.set(color);
    
    // 현재 엣지 관련 모드면 즉시 적용
    if (this.currentMode === RenderModeType.EDGES || 
        this.currentMode === RenderModeType.SOLID_EDGES ||
        this.currentMode === RenderModeType.HIDDEN_EDGES) {
      this.edgeLines.forEach(line => {
        (line.material as THREE.LineBasicMaterial).color.set(color);
      });
    }
  }
  
  /**
   * 엣지 두께 설정 (WebGL 제한으로 실제로는 작동 안 할 수 있음)
   */
  setEdgeWidth(width: number): void {
    this.edgeMaterial.linewidth = width;
    
    this.edgeLines.forEach(line => {
      (line.material as THREE.LineBasicMaterial).linewidth = width;
    });
  }
  
  /**
   * 와이어프레임 투명도 설정
   */
  setWireframeOpacity(opacity: number): void {
    this.wireframeMaterial.opacity = opacity;
    
    if (this.currentMode === RenderModeType.WIREFRAME) {
      this.applyMode();
    }
  }
  
  /**
   * 모델 추가/업데이트 시 호출
   */
  updateModel(): void {
    // 새로운 메시가 추가되었을 때 현재 모드 재적용
    if (this.currentMode !== RenderModeType.SOLID) {
      this.cleanup();
      this.applyMode();
    }
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.cleanup();
    this.wireframeMaterial.dispose();
    this.edgeMaterial.dispose();
    this.hiddenEdgeMaterial.dispose();
    this.solidMaterial.dispose();
    this.originalMaterials.clear();
  }
}
