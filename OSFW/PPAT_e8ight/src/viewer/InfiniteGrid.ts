import * as THREE from 'three';

export interface InfiniteGridOptions {
  subdivisions?: number;
  gridWidth?: number;
  backgroundColor?: THREE.Color;
  backgroundColorTwo?: THREE.Color;
  gridColor?: THREE.Color;
  dashedScaleX?: number;
  dashedScaleY?: number;
  dashedCountX?: number;
  dashedCountY?: number;
  pointWidth?: number;
  pointColor?: THREE.Color;
  pointScaleX?: number;
  pointScaleY?: number;
  insideWidth?: number;
  insideSubdivisions?: number;
  insideColor?: THREE.Color;
  inDashedScaleX?: number;
  inDashedScaleY?: number;
  inDashedCountX?: number;
  inDashedCountY?: number;
  size?: number;
}

export class InfiniteGrid extends THREE.Mesh {

  constructor(options: InfiniteGridOptions = {}) {
    const geometry = new THREE.PlaneGeometry(1, 1);

    const uniforms = {
      subdivisions: { value: options.subdivisions || 32.0 },
      grid_width: { value: options.gridWidth || 0.02 },
      background_color: { value: options.backgroundColor || new THREE.Color(0.2, 0.2, 0.2) },
      background_color_two: { value: options.backgroundColorTwo || new THREE.Color(0.1, 0.1, 0.1) },
      grid_color: { value: options.gridColor || new THREE.Color(0.5, 0.5, 0.5) },
      inside_width: { value: options.insideWidth || 0.01 },
      inside_subdivisions: { value: options.insideSubdivisions || 6.0 },
      inside_color: { value: options.insideColor || new THREE.Color(0.4, 0.4, 0.4) },
      cameraPos: { value: new THREE.Vector3() },
      cameraWorldMatrix: { value: new THREE.Matrix4() },
      cameraProjectionMatrixInverse: { value: new THREE.Matrix4() },
      fadeDistance: { value: options.size || 100.0 }
    };

    const vertexShader = `
      uniform mat4 cameraWorldMatrix;
      uniform mat4 cameraProjectionMatrixInverse;

      varying vec3 nearPoint;
      varying vec3 farPoint;

      vec3 unprojectPoint(float x, float y, float z, mat4 viewInverse, mat4 projInverse) {
        vec4 unprojectedPoint = viewInverse * projInverse * vec4(x, y, z, 1.0);
        return unprojectedPoint.xyz / unprojectedPoint.w;
      }

      void main() {
        vec3 p = position;
        nearPoint = unprojectPoint(p.x, p.y, 0.0, cameraWorldMatrix, cameraProjectionMatrixInverse);
        farPoint = unprojectPoint(p.x, p.y, 1.0, cameraWorldMatrix, cameraProjectionMatrixInverse);
        gl_Position = vec4(p, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float subdivisions;
      uniform float grid_width;
      uniform vec3 background_color;
      uniform vec3 background_color_two;
      uniform vec3 grid_color;
      uniform float inside_width;
      uniform float inside_subdivisions;
      uniform vec3 inside_color;
      uniform vec3 cameraPos;
      uniform mat4 cameraWorldMatrix;
      uniform mat4 cameraProjectionMatrixInverse;
      uniform float fadeDistance;

      varying vec3 nearPoint;
      varying vec3 farPoint;

      float grid(vec2 uv, float lineWidth) {
        vec2 coord = abs(fract(uv) - 0.5);
        vec2 grid = smoothstep(0.0, lineWidth, coord);
        float line = 1.0 - min(grid.x, grid.y);
        return line;
      }

      void main() {
        float t = -nearPoint.y / (farPoint.y - nearPoint.y);

        // Only render if intersection with Y=0 plane exists
        if (t < 0.0) {
          discard;
        }

        vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);

        // Scale the grid
        vec2 uv = fragPos3D.xz / subdivisions;

        // CheckerBoard pattern
        vec2 c = abs(floor(uv * 0.5) - floor(uv * 0.5 + 0.5));
        float checker = c.x * c.y + (1.0 - c.x) * (1.0 - c.y);

        // Main Grid
        float mainGrid = grid(uv, grid_width);

        // Inside Grid
        float insideGrid = grid(uv * inside_subdivisions, inside_width);

        // Distance fade
        float dist = distance(fragPos3D, cameraPos);
        float fade = 1.0 - smoothstep(fadeDistance * 0.5, fadeDistance, dist);

        // Add final color
        vec3 finalColor = mix(background_color, background_color_two, checker);
        finalColor = mix(finalColor, inside_color, insideGrid * 0.5);
        finalColor = mix(finalColor, grid_color, mainGrid);

        float alpha = fade;
        if (alpha < 0.01) {
          discard;
        }

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: true
    });

    super(geometry, material);

    this._uniforms = uniforms;

    // Position as fullscreen quad
    this.frustumCulled = false;
    this.renderOrder = -1000; // 가장 먼저 렌더링

    // Disable interactions - grid should not be pickable or hoverable
    this.raycast = () => {};
    this.userData = { isGrid: true, raycastIgnore: true };
  }

  updateCamera(camera: THREE.Camera) {
    this._uniforms.cameraPos.value.copy(camera.position);
    this._uniforms.cameraWorldMatrix.value.copy(camera.matrixWorld);
    this._uniforms.cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
  }

  private _uniforms: { [key: string]: THREE.IUniform };
}