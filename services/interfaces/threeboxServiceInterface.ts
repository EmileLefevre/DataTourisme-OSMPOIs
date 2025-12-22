import * as THREE from "three";
export interface Model3DOptions {
  modelPath: string;
  lng: number;
  lat: number;
  altitude?: number;
  baseScale?: number;
  fixedSize?: boolean;
  billboardRotation?: boolean;
  rotation?: { x?: number; y?: number; z?: number };
  animated?: boolean;
}

export interface MapScene {
  addLight: (light: THREE.Light) => void;
  addObject: (object: THREE.Group) => void;
  removeObject: (object: THREE.Group) => void;
}
