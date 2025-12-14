export interface ImageTransform {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

export interface VirtualCamState {
  isActive: boolean;
  selectedImage: string | null; // Base64 string of the image
  transform: ImageTransform;
  maintainAspectRatio: boolean;
}

export interface AppContextType {
  state: VirtualCamState;
  setImage: (image: string | null) => void;
  toggleActive: (isActive: boolean) => void;
  setTransform: (transform: ImageTransform) => void;
  toggleAspectRatio: (maintain: boolean) => void;
}