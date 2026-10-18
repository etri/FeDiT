/**
 * Mesh 파일 데이터 타입
 */
export interface MeshFile {
  name: string;
  data: string; // Base64 encoded
}

/**
 * Mesh 생성기 함수 타입
 */
export type MeshGenerator = (viewer: any) => MeshFile[];