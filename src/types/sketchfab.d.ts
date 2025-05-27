interface SketchfabAPI {
  addEventListener: (event: string, callback: () => void) => void;
  getAnnotationList: (callback: (err: any, annotations: any[]) => void) => void;
  start: () => void;
}

interface SketchfabClient {
  init: (
    modelId: string, 
    options: {
      success: (api: SketchfabAPI) => void;
      error: () => void;
    }
  ) => void;
}

declare global {
  interface Window {
    Sketchfab: {
      new (iframe: HTMLIFrameElement): SketchfabClient;
    };
  }
}