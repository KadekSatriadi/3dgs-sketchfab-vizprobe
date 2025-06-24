<template>
  <div class="gaussian-viewer" ref="containerRef">
    <template v-if="props.controlButtons">
      <div class="navigation-buttons" v-if="(cameraViews?.length ?? 0) > 0">
        <button @click="previousView()" class="nav-button">Previous</button>
        <button @click="nextView()" class="nav-button">Next</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { Viewer, SceneRevealMode, RenderMode   } from '@mkkellogg/gaussian-splats-3d'
import { type CameraView } from "../types/cameraview"

const props = defineProps<{
  modelUrl: string
  width?: number
  height?: number
  cameraViews?: CameraView[]
  loop?: boolean
  controlButtons?: boolean,
  cameraControls?: boolean
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const currentViewIndex = ref(0)
let viewer = new Viewer({
      renderMode: RenderMode.Always,
      sceneRevealMode: SceneRevealMode.Instant,
      sharedMemoryForWorkers: false
}) 
let animationFrameId: number

const emit = defineEmits(['frame', 'modelLoaded', 'modelLoadError'])

const setCameraView = (view: CameraView) => {
if (!viewer) return

  const camera = viewer.controls.object
  
  // Set camera transform
  camera.position.fromArray(view.position)
  camera.quaternion.fromArray(view.quaternion)
  
  // Calculate where the camera is looking and update controls target
  const direction = new THREE.Vector3(0, 0, -1)
  direction.applyQuaternion(camera.quaternion)
  
  const lookAtPoint = camera.position.clone().add(direction.multiplyScalar(10))
  viewer.controls.target.copy(lookAtPoint)
  
  // Update controls to sync with new state
  viewer.controls.update()
  
  // Force render
  viewer.render()

  //console.log('Camera:', viewer)
}



const nextView = () => {
  if (!props.cameraViews?.length) return
  
  if (currentViewIndex.value < props.cameraViews.length - 1) {
    currentViewIndex.value++
  } else if (props.loop) {
    currentViewIndex.value = 0
  }
  
  setCameraView(props.cameraViews[currentViewIndex.value])
}

const previousView = () => {
  if (!props.cameraViews?.length) return
  
  if (currentViewIndex.value > 0) {
    currentViewIndex.value--
  } else if (props.loop) {
    currentViewIndex.value = props.cameraViews.length - 1
  }
  
  setCameraView(props.cameraViews[currentViewIndex.value])
}

function setFOV(fovDegrees: number): void {
  if (!viewer) return
  
  const h = props.height || 100;
  const w = props.width || (h * 100) / 100; // Default to 100x100 if not provided
  const camera = new THREE.PerspectiveCamera(fovDegrees, (w / h), 0.1, 1000);
  camera.updateProjectionMatrix()
}

const initViewer = async () => {
  if (!containerRef.value) return

  try {
    // Create viewer with configuration
    viewer = new Viewer({
          cameraUp: [0, -1, 0],
          initialCameraPosition: [-1, -4, 6],
          initialCameraLookAt: [0, 0, 0],
          renderMode: RenderMode.Always,
          sharedMemoryForWorkers : false,
    })

    containerRef.value.style.width = props.width + 'px';
containerRef.value.style.height = props.height + 'px';

    const renderer = viewer.renderer;
    renderer.setSize(props.width || 800, props.height || 600)
    renderer.setClearColor(0x242424, 1) // Set background color;
    
    // Add canvas to container
    containerRef.value.appendChild(renderer.domElement)

    const scale = 5
    // Load the splat file
    await viewer.addSplatScene(props.modelUrl, {
      progressiveLoad: false,
      streamView: false,
      halfPrecisionCovariancesOnGPU: false,
      splatAlphaRemovalThreshold: 1,
      showLoadingUI: false,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [scale, scale, scale] // Scale the model to 5x its original size
    })

    //.log('Gaussian Splats 3D model loaded successfully', viewer);

    // Start the viewer
    viewer.start()
    viewer.renderer.setSize(props.width || 800, props.height || 600, true);
    viewer.camera.fov = 35;
    // Set up animation loop for emitting frame data
    const frame = () => {
      const camera = viewer.controls.object
      
      emit('frame', {
        position: camera.position,
        quaternion: camera.quaternion,
        rotation: camera.rotation,
      })
      
      animationFrameId = requestAnimationFrame(frame)
    }

    animationFrameId = requestAnimationFrame(frame)

    // Set initial camera view if available
    if (props.cameraViews?.length) {
      setCameraView(props.cameraViews[0])
    }

    emit('modelLoaded', viewer)

  } catch (error) {
    emit('modelLoadError', error)
    console.error('Error loading Gaussian Splats 3D model:', error)
  }
}

onMounted(() => {
  initViewer()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (viewer) {
    viewer.dispose()
  }
})

// Expose methods to parent component
defineExpose({
  nextView,
  previousView,
  setCameraView,
  setFOV,
  initViewer
})
</script>

<style scoped>
.gaussian-viewer {
  position: relative;
  display: inline-block;
}

.navigation-buttons {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 10;
}

.nav-button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.nav-button:hover {
  background-color: #3aa876;
}
</style>