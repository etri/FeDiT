/**
 * @file Highlighter.ts
 * @brief CFD Preprocessor Mesh 단위 하이라이터 (Z-fighting 해결)
 */

import * as THREE from 'three';
import type { PickResult } from './picking';

export class Highlighter {
  private scene: THREE.Scene;
  
  // 하이라이트용 메시
  private hoverMesh: THREE.Mesh | null = null;
  private selectMesh: THREE.Mesh | null = null;

  // 원본 메시 저장
  private hoveredMesh: THREE.Mesh | null = null;
  private selectedMesh: THREE.Mesh | null = null;
  
  // 하이라이트 색상
  private hoverColor = new THREE.Color(0x00ff00);
  private selectColor = new THREE.Color(0xffff00);
  
  // 하이라이트 재질
  private hoverMaterial: THREE.MeshBasicMaterial;
  private selectMaterial: THREE.MeshBasicMaterial;
  
  // 아웃라인 재질 (Z-fighting 해결용)
  private outlineHoverMaterial: THREE.MeshBasicMaterial;
  private outlineSelectMaterial: THREE.MeshBasicMaterial;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // 하이라이트 재질 생성 (오버레이용)
    this.hoverMaterial = new THREE.MeshBasicMaterial({
      color: this.hoverColor,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false,
      // Polygon offset으로 Z-fighting 방지
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    
    this.selectMaterial = new THREE.MeshBasicMaterial({
      color: this.selectColor,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false,
      // Polygon offset으로 Z-fighting 방지
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    
    // 아웃라인 재질 (더 진한 색상, 더 큰 오프셋)
    this.outlineHoverMaterial = new THREE.MeshBasicMaterial({
      color: this.hoverColor,
      side: THREE.BackSide,  // 뒷면만 렌더링
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    
    this.outlineSelectMaterial = new THREE.MeshBasicMaterial({
      color: this.selectColor,
      side: THREE.BackSide,  // 뒷면만 렌더링
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
  }
  
  /**
   * 호버 하이라이트 (개선된 방법)
   */
  hover(result: PickResult | null): void {
    // 이전 호버 제거
    this.clearHover();
    
    if (!result || result.kind !== 'mesh') return;
    
    const mesh = result.object;
    
    // 이미 선택된 메시는 호버하지 않음
    if (mesh === this.selectedMesh) return;
    
    // 원본 메시 저장
    this.hoveredMesh = mesh;
    
    // 방법 1: 오버레이 메시 (같은 위치, polygon offset 사용)
    this.createOverlayMesh(mesh, 'hover');
    
    console.log('Hover highlight added for:', mesh.name || 'unnamed');
  }
  
  /**
   * 선택 하이라이트 (개선된 방법)
   */
  select(result: PickResult | null): void {
    // 이전 선택 제거
    this.clearSelection();
    
    if (!result || result.kind !== 'mesh') return;
    
    const mesh = result.object;
    
    // 호버 중이던 메시면 호버 제거
    if (mesh === this.hoveredMesh) {
      this.clearHover();
    }
    
    // 원본 메시 저장
    this.selectedMesh = mesh;
    
    // 방법 1: 오버레이 메시 (같은 위치, polygon offset 사용)
    this.createOverlayMesh(mesh, 'select');
    
    console.log('Selection highlight added for:', mesh.name || 'unnamed');
  }
  
  /**
   * 오버레이 메시 생성 (Z-fighting 해결)
   */
  private createOverlayMesh(mesh: THREE.Mesh, type: 'hover' | 'select'): void {
    const material = type === 'hover' ? this.hoverMaterial : this.selectMaterial;
    const outlineMaterial = type === 'hover' ? this.outlineHoverMaterial : this.outlineSelectMaterial;
    
    // 1. 오버레이 메시 (원본과 같은 크기, polygon offset 사용)
    const overlayMesh = new THREE.Mesh(mesh.geometry, material);
    overlayMesh.position.copy(mesh.position);
    overlayMesh.rotation.copy(mesh.rotation);
    overlayMesh.scale.copy(mesh.scale);
    overlayMesh.userData.isHelper = true;
    overlayMesh.name = `${type}-overlay`;
    overlayMesh.renderOrder = 1; // 원본보다 나중에 렌더링
    
    // 2. 아웃라인 메시 (약간 크게, 뒷면만 렌더링)
    const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMaterial);
    outlineMesh.position.copy(mesh.position);
    outlineMesh.rotation.copy(mesh.rotation);
    outlineMesh.scale.copy(mesh.scale);
    outlineMesh.scale.multiplyScalar(1.01); // 아주 약간만 크게
    outlineMesh.userData.isHelper = true;
    outlineMesh.name = `${type}-outline`;
    outlineMesh.renderOrder = 0; // 원본보다 먼저 렌더링
    
    // 부모가 있으면 같은 부모에 추가
    if (mesh.parent) {
      mesh.parent.add(overlayMesh);
      mesh.parent.add(outlineMesh);
    } else {
      this.scene.add(overlayMesh);
      this.scene.add(outlineMesh);
    }
    
    // 저장
    if (type === 'hover') {
      this.hoverMesh = overlayMesh;
      // outlineMesh도 함께 저장하기 위해 userData에 저장
      overlayMesh.userData.outlineMesh = outlineMesh;
    } else {
      this.selectMesh = overlayMesh;
      overlayMesh.userData.outlineMesh = outlineMesh;
    }
  }
  
  /**
   * 호버 하이라이트 제거
   */
  clearHover(): void {
    if (this.hoverMesh) {
      // 아웃라인 메시도 제거
      const outlineMesh = this.hoverMesh.userData.outlineMesh;
      if (outlineMesh && outlineMesh.parent) {
        outlineMesh.parent.remove(outlineMesh);
      }
      
      if (this.hoverMesh.parent) {
        this.hoverMesh.parent.remove(this.hoverMesh);
      }
      this.hoverMesh = null;
    }
    
    this.hoveredMesh = null;
  }
  
  /**
   * 선택 하이라이트 제거
   */
  clearSelection(): void {
    if (this.selectMesh) {
      // 아웃라인 메시도 제거
      const outlineMesh = this.selectMesh.userData.outlineMesh;
      if (outlineMesh && outlineMesh.parent) {
        outlineMesh.parent.remove(outlineMesh);
      }
      
      if (this.selectMesh.parent) {
        this.selectMesh.parent.remove(this.selectMesh);
      }
      this.selectMesh = null;
    }
    
    this.selectedMesh = null;
  }
  
  /**
   * 모든 하이라이트 제거
   */
  clear(): void {
    this.clearHover();
    this.clearSelection();
  }
  
  /**
   * 호버 색상 설정
   */
  setColor(color: string): void {
    this.hoverColor.set(color);
    this.hoverMaterial.color = this.hoverColor;
    this.outlineHoverMaterial.color = this.hoverColor;
    
    // 현재 호버 중인 메시가 있으면 색상 업데이트
    if (this.hoverMesh) {
      this.hoverMaterial.needsUpdate = true;
      this.outlineHoverMaterial.needsUpdate = true;
    }
  }
  
  /**
   * 선택 색상 설정
   */
  setSelectionColor(color: string): void {
    this.selectColor.set(color);
    this.selectMaterial.color = this.selectColor;
    this.outlineSelectMaterial.color = this.selectColor;
    
    // 현재 선택된 메시가 있으면 색상 업데이트
    if (this.selectMesh) {
      this.selectMaterial.needsUpdate = true;
      this.outlineSelectMaterial.needsUpdate = true;
    }
  }
  
  /**
   * 참조 설정 (호환성 유지)
   */
  setReferences(_faceMesh: any, _edgeLines?: any, _topo?: any): void {
    // Mesh 단위 하이라이터에서는 사용하지 않음
  }
  
  /**
   * 선택된 메시 가져오기
   */
  getSelectedMesh(): THREE.Mesh | null {
    return this.selectedMesh;
  }
  
  /**
   * 호버 중인 메시 가져오기
   */
  getHoveredMesh(): THREE.Mesh | null {
    return this.hoveredMesh;
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    this.clear();
    this.hoverMaterial.dispose();
    this.selectMaterial.dispose();
    this.outlineHoverMaterial.dispose();
    this.outlineSelectMaterial.dispose();
  }
}
