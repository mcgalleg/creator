declare module "three" {
  export * from "three/src/Three";
  export class WebGLRenderer {
    constructor(params?: {
      canvas?: HTMLCanvasElement;
      antialias?: boolean;
      alpha?: boolean;
      powerPreference?: string;
    });
    domElement: HTMLCanvasElement;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setClearAlpha(alpha: number): void;
    setClearColor(color: number, alpha?: number): void;
    render(scene: Scene, camera: Camera): void;
    dispose(): void;
    getPixelRatio(): number;
  }

  export class Scene {
    add(object: Object3D): void;
  }

  export class OrthographicCamera extends Camera {
    constructor(
      left: number,
      right: number,
      top: number,
      bottom: number,
      near: number,
      far: number
    );
  }

  export class Camera {}
  export class Object3D {}

  export class ShaderMaterial {
    constructor(params?: {
      vertexShader?: string;
      fragmentShader?: string;
      uniforms?: Record<string, { value: unknown }>;
      transparent?: boolean;
      depthTest?: boolean;
      depthWrite?: boolean;
      glslVersion?: number;
    });
    dispose(): void;
  }

  export class PlaneGeometry {
    constructor(width: number, height: number);
    dispose(): void;
  }

  export class Mesh extends Object3D {
    constructor(geometry: PlaneGeometry, material: ShaderMaterial);
    geometry: PlaneGeometry;
  }

  export class Clock {
    getElapsedTime(): number;
  }

  export class Vector2 {
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
    x: number;
    y: number;
  }

  export class Color {
    constructor(color?: string | number);
    set(color: string | number): this;
  }

  export class Texture {
    constructor(image?: HTMLCanvasElement | HTMLImageElement);
    minFilter: number;
    magFilter: number;
    generateMipmaps: boolean;
    needsUpdate: boolean;
  }

  export class Uniform {
    constructor(value: unknown);
    value: unknown;
  }

  export const LinearFilter: number;
  export const GLSL3: number;
}

declare module "postprocessing" {
  import type { WebGLRenderer, Scene, Camera } from "three";

  export class EffectComposer {
    constructor(renderer: WebGLRenderer);
    passes: Pass[];
    addPass(pass: Pass): void;
    setSize(width: number, height: number): void;
    render(): void;
    dispose(): void;
  }

  export class Pass {
    renderToScreen: boolean;
  }

  export class RenderPass extends Pass {
    constructor(scene: Scene, camera: Camera);
  }

  export class EffectPass extends Pass {
    constructor(camera: Camera, ...effects: Effect[]);
    effects: Effect[];
  }

  export class Effect {
    constructor(
      name: string,
      fragment: string,
      options?: {
        uniforms?: Map<string, { value: unknown }>;
      }
    );
    uniforms: Map<string, { value: unknown }>;
  }
}
