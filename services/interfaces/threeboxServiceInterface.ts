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
