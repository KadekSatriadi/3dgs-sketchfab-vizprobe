export interface CameraView {
  name: string;
  position: number[];
  euler: number[];
  description: string;
  visited: boolean;
  isloading: boolean;
  progress: number;
  isloaded: boolean;
}