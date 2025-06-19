export interface CameraView {
  name: string;
  position: number[];
  quaternion: number[];
  description: string;
  visited: boolean;
  isloading: boolean;
  progress: number;
  isloaded: boolean;
}