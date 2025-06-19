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
  import * as SPLAT from 'gsplat'
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
  let scene: SPLAT.Scene
  let camera: SPLAT.Camera
  let renderer: SPLAT.WebGLRenderer
  let controls: SPLAT.OrbitControls
  let animationFrameId: number

  const emit = defineEmits(['frame', 'modelLoaded', 'modelLoadError'])

  
  const setCameraView = (view: CameraView) => {
    if (!camera) return
  
    // Update camera position using Vector3
    const position = new SPLAT.Vector3(view.position[0], view.position[1], view.position[2])
    const rotation = SPLAT.Quaternion.FromEuler(new SPLAT.Vector3(
      view.euler[0],
      view.euler[1],
      view.euler[2]
    ));

    camera.position = position;
    camera.rotation = rotation;

    camera.update();  
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
  
 


  function setFOV(camera: SPLAT.Camera, fovDegrees: number): void {
    
    // Convert FOV in degrees to radians
    const fovRadians = fovDegrees * (Math.PI / 180);
    
    // Calculate focal length from FOV
    camera.data.setSize(1044, 1044); // Set the size of the camera
    camera.update(); // Update the projection matrix
    // For a perspective projection, focal length = (width/2) / tan(FOV/2)
    const fx = (camera.data.width / 2) / Math.tan(fovRadians / 2);
    
    // Set the focal lengths
    camera.data.fx = fx;
    camera.data.fy = fx;
    camera.update();
  }
  
  const initViewer = async () => {
    if (!containerRef.value) return
  
    scene = new SPLAT.Scene()
    
    const data = new SPLAT.CameraData()
    data.setSize(props.width || 800, props.height || 600)
    data.far = 1000000;
    camera = new SPLAT.Camera(data)

   // setFOV(camera, 10) // Set FOV to 45 degrees

    // Set initial position and rotation
    camera.position = new SPLAT.Vector3(0, 0, 5)
    camera.rotation = new SPLAT.Quaternion(0, 0, 0, 1) // Identity quaternion
    
    renderer = new SPLAT.WebGLRenderer()

    //console.log('Data:', camera.data)
   // console.log('Renderer:', renderer)
   // console.log('Scene:', scene)
    // Always create orbit controls for smooth transitions, 
    // but disable interaction if cameraControls is false
    controls = new SPLAT.OrbitControls(camera, renderer.canvas)
    controls.maxZoom = 1000;
    controls.minZoom = 0.00000001;
    controls.zoomSpeed = 0;
    console.log('Controls', controls);
    // Disable user interaction if cameraControls is false
    // if (props.cameraControls === false) {
    //   controls.enabled = false
    // }
  
    // Set canvas size
    renderer.canvas.style.width = props.width + 'px'
    renderer.canvas.style.height = props.height + 'px'
    renderer.canvas.style.backgroundColor = '#242424' // Set background color to black
  
    // Add canvas to container
    containerRef.value.appendChild(renderer.canvas)
  
    renderer.setSize(props.width || 800, props.height || 600)
    try {
      // Load the splat file
      const splat = await SPLAT.Loader.LoadAsync(props.modelUrl, scene, () => {})
      console.log('Splat loaded:', splat)
      const scale = 5;
      splat.scale = new SPLAT.Vector3(scale, scale, scale) // Scale the model to 100x its original size
      splat.applyScale() // Scale the model to 100x its original size

  
      // Start animation loop
      const frame = () => {
        // Always update controls for smooth transitions
        controls.update()
        renderer.render(scene, camera)
        animationFrameId = requestAnimationFrame(frame)
        //console.log(camera.position, camera.rotation)
        emit('frame', {
          position: camera.position,
          rotation: camera.rotation.toEuler()
        })
      }
  
      animationFrameId = requestAnimationFrame(frame)
            // Set initial camera view if available
            if (props.cameraViews?.length) {
       setCameraView(props.cameraViews[0])
      }
      emit('modelLoaded', splat)
    } catch (error) {
      emit('modelLoadError', error)
      console.error('Error loading Gaussian Splatting model:', error)
    }
  }
  
  onMounted(() => {
    initViewer()
  })
  
  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    renderer?.dispose()
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

  
  .navigation-buttons {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 1rem;
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