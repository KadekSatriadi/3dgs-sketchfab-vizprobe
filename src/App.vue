<script setup lang="ts">
import SketchfabViewer from "./components/SketchfabViewer.vue";
import GaussianViewer from "./components/GaussianViewer3js.vue";
import GoogleForm from "./components/GoogleForm.vue";
import { ref, onMounted } from "vue";
import { type CameraView } from "./types/cameraview";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import InfoModal from "./components/InfoModal.vue";

interface ViewerAPI {
  nextAnnotation: () => void;
  previousAnnotation: () => void;
  goToAnnotation: (index: number) => void;
  getAnnotationList: (callback: (err: any, annotations: any[]) => void) => void;
}

const questionnaireReady = ref(false);
const viewerRef = ref<ViewerAPI | null>(null);
const gaussianViewerRef = ref<{
  nextView: () => void;
  setCameraView: (cameraView: CameraView) => void;
  previousView: () => void;
  initViewer: () => void;
} | null>(null);

const cameraState = ref({
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  quaternion: {
    x: 0,
    y: 0,
    z: 0,
    w: 0,
  },
});

const cameraViews = ref<CameraView[]>([]);
const currentCameraView = ref<CameraView | null>(null);
const activeCameraName = ref<string | null>(null);
const sketchfabViewerReady = ref(false);
const gsviewerReady = ref(false);
const viewerReady = ref(false);

const notify = (text: string) => {
  toast(text, {
    theme: "auto",
  type: "default",
  position: "top-left",
  closeOnClick: false,
  hideProgressBar: true
  }); // ToastOptions
};

const setSketchfabReady = () => {
  sketchfabViewerReady.value = true;
  viewerReadyCheck();
};

const setGSViewerReady = () => {
  gsviewerReady.value = true;
  viewerReadyCheck();
};

const viewerReadyCheck = () => {
  if (sketchfabViewerReady.value && gsviewerReady.value) {
    viewerReady.value = true;
    notify(
      "Semua 3D model sudah siap. Silakan gunakan tombol kamera di panel Kamera."
    );
  } else {
    viewerReady.value = false;
  }
};

const disableCameraButtons = () => {
  cameraViews.value.forEach((cameraView) => {
    cameraView.visited = false;
  });
};

const enableCameraButtons = () => {
  cameraViews.value.forEach((cameraView) => {
    cameraView.visited = true;
  });
};

onMounted(() => {
  import("./assets/cameras.json").then((module) => {
    const tmp = module.default;
    const camerasData = tmp.map((camera: any) => {
      return {
        name: camera.name,
        position: camera.position,
        quaternion: camera.quaternion,
        description: camera.description,
        visited: false,
        isloading: false,
        progress: 0,
        isloaded: false,
      };
    });
    cameraViews.value = camerasData;
    cameraViews.value[0].visited = true;
    cameraViews.value[1].visited = true;
    cameraViews.value[0].isloaded = true;
    cameraViews.value[1].isloaded = false;
    currentCameraView.value = cameraViews.value[0];
    if (camerasData.length > 0) {
      activeCameraName.value = camerasData[0].name;
    }
    setCameraSketchfab(camerasData[0]);
  });
});

const setCameraSketchfab = (cameraView: CameraView) => {
  if (viewerRef.value) {
    const idx = cameraViews.value.findIndex(
      (view) => view.name === cameraView.name
    );
    if (idx === -1) {
      console.error("Camera view not found");
      return;
    }
    console.log("idx", idx);
    viewerRef.value.goToAnnotation(idx);
  }
};

const setCamera3DGS = (cameraView: CameraView) => {
  if (gaussianViewerRef.value) {
    gaussianViewerRef.value.setCameraView(cameraView);
  }
};

const enableNextCameraButton = async (idx: number): Promise<void> => {
  // Initialize loading state for the current camera
  cameraViews.value[idx].isloading = true;
  cameraViews.value[idx].progress = 0;

  // Calculate timing parameters
  const totalTime = 1000 * 15; //  in milliseconds
  const updateInterval = 10; // Update every 1 second
  const totalSteps = totalTime / updateInterval;

  // Create a promise that resolves when the loading is complete
  return new Promise<void>((resolve) => {
    let currentStep = 0;

    const loadingInterval = setInterval(() => {
      currentStep++;

      // Update the progress
      cameraViews.value[idx].progress = Math.min(
        (currentStep / totalSteps) * 100,
        100
      );

      // If we've reached the total steps, clear the interval and enable the next button
      if (currentStep >= totalSteps) {
        clearInterval(loadingInterval);
        cameraViews.value[idx].isloading = false;

        // Enable the next camera
        if (cameraViews.value[idx + 1]) {
          cameraViews.value[idx + 1].visited = true;
        }

        // Resolve the promise
        resolve();
      }
    }, updateInterval);
  });
};
const unlockcameras = () => {
  cameraViews.value.forEach((element: any) => {
    element.visited = true;
    element.isloaded = true;
  });
  questionnaireReady.value = true;
};
const setCamera = (cameraView: CameraView) => {
  currentCameraView.value = cameraView;
  activeCameraName.value = cameraView.name;
  setCamera3DGS(cameraView);
  setCameraSketchfab(cameraView);
  const idx = cameraViews.value.findIndex(
    (view) => view.name === cameraView.name
  );
  if (isAllCamerasLoaded()) {
    enableCameraButtons();
    return;
  }else if(!questionnaireReady.value === true){
    disableCameraButtons();
  }else{
    return;
  }

  if(!cameraViews.value[idx].isloaded){
  enableNextCameraButton(idx).then(() => {
    cameraViews.value[idx].isloaded = true;

    if (cameraViews.value[idx + 1]) {
      // notify(
      //   "Klik tombol Kamera " +
      //     (idx + 2) +
      //     " (" +
      //     cameraViews.value[idx + 1].name +
      //     ") di panel Kamera untuk melanjutkan."
      // );
    } else {
      notify("Semua kamera sudah dilihat. Saatnya meingisi kuisioner");
      //console.log(cameraViews.value);
      enableCameraButtons();
    }
    checkQuestionnareReady();
  });
  }

};

const isAllCamerasLoaded = () => {
  return cameraViews.value.every((cameraView) => cameraView.isloaded);
};

const checkQuestionnareReady = () => {
  const allVisited = isAllCamerasLoaded();
  questionnaireReady.value = allVisited;
};

const dumpCamera = (data: any) => {
  cameraState.value = data;
};


defineExpose({
  cameraState,
  setCamera,
  unlockcameras,
  setSketchfabReady,
});
</script>

<template>
  <section class="section">
    <div class="container">
      <InfoModal />

      <div class="columns">
        <div class="column is-two-fifth">
          <div v-if="viewerReady">
            <div>
              <div v-if="questionnaireReady">
                <h1 class="title mt-3">Kuisioner</h1>
                <p>
                  Silakan isi kuisioner. Panel Kamera berada di bawah Kuisioner
                  ini.
                </p>
                <GoogleForm class="mt-2" />
              </div>
              <div v-else>
                <p>
                  Kuisioner akan muncul di sini setelah kamera di bawah terbuka.
                </p>
              </div>
            </div>
            <h1 class="title mt-3">Kamera</h1>
            <p>Pilih posisi kamera untuk melihat model dari berbagai sudut.</p>
            <div v-for="(cameraView, idx) in cameraViews">
              <button
                class="button mt-3 is-fullwidth"
                :class="{ 'is-primary': activeCameraName === cameraView.name }"
                :disabled="!cameraView.visited"
                @click="setCamera(cameraView)"
              >
                Kamera {{ idx + 1 }} (<b>{{ cameraView.name }}</b
                >)
              </button>
              <progress
                v-if="cameraView.isloading"
                class="progress mt-1 is-small is-primary"
                :value="cameraView.progress"
                max="100"
              >
                Menuju kamera selanjutnya
              </progress>
            </div>
            <div class="mt-3">
              <article class="message is-success">
                <div class="message-body">
                  <h2 class="title">{{ currentCameraView?.name }}</h2>
                  <p class="mb-3">
                    {{ currentCameraView?.description }}
                  </p>
                  <b
                    >Klik dan tahan 3D model kemudian gerakkan mouse untuk
                    melihat bentuk 3D dengan lebih detail.
                  </b>
                </div>
              </article>
              <button
                v-if="!questionnaireReady"
                class="button is-small"
                title="Buka kunci semua kamera. Hanya gunakan jika halaman dengan tidak sengaja ter-refresh"
                @click="unlockcameras"
              >
                Unlock
              </button>
            </div>
          </div>
          <div v-else>
            <h1 class="title mt-3">Loading model.</h1>
            <h3 class="subtitle">
              Silakan tunggu, ini mungkin memakan waktu beberapa menit.
            </h3>
          </div>
        </div>
        <div class="column">
          <SketchfabViewer
            ref="viewerRef"
            modelId="e4a96f7b1b1d42f3b940c88411c1c3f9"
            :show-list="false"
            :loop="true"
            width="850px"
            height="400px"
            title="My 3D Model"
            @viewer-ready="setSketchfabReady"
          />
          <GaussianViewer
            class="viewer"
            ref="gaussianViewerRef"
            modelUrl="gs.splat"
            :width="850"
            :height="400"
            :cameraViews="cameraViews"
            :controlButtons="false"
            :cameraControls="false"
            :loop="true"
            :focalLength="25.3083684786384"
            @frame="dumpCamera"
            @model-loaded="setGSViewerReady"
            @model-load-error="(err) => {
              console.error('Model load error:', err);
              notify('Gagal memuat model 3DGS. Silakan coba click Load 3DGS.');
            }"
          />            
        </div>
      </div>
      <footer>
        <small
          >Punya pertanyaan? Silakan kontak Fadilah:
          <a href="http://wa.me/6282119479539" target="_blank"
            >http://wa.me/6282119479539</a
          >. Halaman website ini adalah instrument penelitian. Mohon untuk tidak
          menyebarluaskan.</small
        >
      </footer>
    </div>
  </section>
</template>
