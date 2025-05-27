<template>
    <div class="sketchfab-viewer" :style="{ width, height }">
      <iframe
        ref="viewerIframe"
        :src="embedUrl"
        :title="title"
        allowfullscreen
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        :style="{ width: props.showList ? '80%' : '100%', height: '100%' }"
      ></iframe>
      <div v-if="annotations.length && props.showList" class="annotations-list">
        <h3>Annotations</h3>
        <ul>
          <li 
            v-for="(annotation, index) in annotations" 
            :key="index"
            @click="goToAnnotation(index)"
            class="annotation-item"
            :class="{ 'active': index === currentAnnotationIndex }"
          >
            {{ annotation.name }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  
  interface SketchfabAPI {
    addEventListener: (event: string, callback: () => void) => void;
    getAnnotationList: (callback: (err: any, annotations: any[]) => void) => void;
    gotoAnnotation: (index: number) => void;
    start: () => void;
    stop: () => void;
    play: () => void;
    pause: () => void;
  }
  
  interface Annotation {
    title: string;
    description: string;
    index: number;
    name: string;
  }
  
  interface SketchfabInitOptions {
    success: (api: SketchfabAPI) => void;
    error?: () => void;
    autostart?: boolean;
    preload?: boolean;
    scrollwheel?: number;
  }
  
  interface SketchfabClient {
    init: (modelId: string, options: SketchfabInitOptions) => void;
  }
  
  declare global {
    interface Window {
      Sketchfab: {
        new (iframe: HTMLIFrameElement): SketchfabClient;
      };
    }
  }
  
  const props = defineProps({
    modelId: {
      type: String,
      required: true
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '400px'
    },
    title: {
      type: String,
      default: 'Sketchfab 3D Model'
    },
    autostart: {
      type: Boolean,
      default: true
    },
    showList: {
      type: Boolean,
      default: true
    },
    loop: {
      type: Boolean,
      default: false
    }
  });
  
  const viewerIframe = ref<HTMLIFrameElement | null>(null);
  const api = ref<SketchfabAPI | null>(null);
  const annotations = ref<Annotation[]>([]);
  
  const embedUrl = computed(() => {
    const baseUrl = 'https://sketchfab.com/models/';
    const params = new URLSearchParams({
      autostart: props.autostart ? '1' : '0',
      ui_controls: '1',
      ui_infos: '1',
      ui_inspector: '1',
      ui_stop: '1',
      ui_watermark: '1',
      ui_help: '0',
      annotations_visible: '1',
      scrollwheel: '0',
    });
    return `${baseUrl}${props.modelId}/embed?${params.toString()}`;
  });
  
  const emits = defineEmits(['viewerReady', 'annotationChanged']);

  onMounted(() => {
    // Initialize Sketchfab API
    const initViewer = () => {
      const iframe = viewerIframe.value;
      if (!iframe) return;
  
      const client = new window.Sketchfab(iframe);
  
      client.init(props.modelId, {
        scrollwheel: 0,
        success: (apiClient: SketchfabAPI) => {
          api.value = apiClient;
          
          // Wait for viewer to be ready before accessing annotations
          
          api?.value?.addEventListener('viewerready', () => {
            console.log('Viewer is ready');
            emits('viewerReady', api.value);
            
            // Get annotations once the viewer is ready
            api?.value?.getAnnotationList((err, annotationsList) => {
              if (!err) {
                annotations.value = annotationsList;
                currentAnnotationIndex.value = 0;
                console.log('Annotations loaded:', annotationsList);
              }
            });
          });
  
          // Start the viewer
          console.log(api.value);
          api.value.start();
        },
        error: () => {
          console.error('Viewer error');
        }
      });
    };
  
    // Check if Sketchfab API is loaded
    if (window.Sketchfab) {
      initViewer();
    } else {
      // Wait for Sketchfab API to load
      const script = document.createElement('script');
      script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
      script.onload = initViewer;
      document.head.appendChild(script);
    }
  });
  
  const currentAnnotationIndex = ref(-1);
  
  const nextAnnotation = () => {
    if (!api.value || annotations.value.length === 0) return;
    
    const nextIndex = currentAnnotationIndex.value + 1;
    if (nextIndex < annotations.value.length) {
      goToAnnotation(nextIndex);
    } else if (props.loop && annotations.value.length > 0) {
      goToAnnotation(0);
    }
  };
  
  const previousAnnotation = () => {
    if (!api.value || annotations.value.length === 0) return;
    
    const prevIndex = currentAnnotationIndex.value - 1;
    if (prevIndex >= 0) {
      goToAnnotation(prevIndex);
    } else if (props.loop && annotations.value.length > 0) {
      goToAnnotation(annotations.value.length - 1);
    }
  };
  
  const goToAnnotation = (index: any | never) => {
    if (!api.value || !annotations.value[index]) return;
    
    currentAnnotationIndex.value = index;
    api.value.gotoAnnotation(index);
  };
  
  // Expose methods to parent component
  defineExpose({
    nextAnnotation,
    previousAnnotation,
    goToAnnotation
  });
  </script>
  
  <style scoped>
  .sketchfab-viewer {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 20px;
  }
  
  .annotations-list {
    width: 200px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
  }
  
  .annotation-item {
    cursor: pointer;
    padding: 8px;
    margin: 4px 0;
    border-radius: 4px;
  }
  
  .annotation-item:hover {
    background: #e0e0e0;
  }
  
  .annotation-item.active {
    background: #42b883;
    color: white;
  }
  
  .annotation-item.active:hover {
    background: #3aa876;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  </style>