import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { isSoftwareWebGL, afterSoftwareDraw } from './glProbe';
import { createSculptedJerseyModel, JerseyMeshBundle } from './jerseyGeometry';
import {
  buildCrestTexture,
  buildJerseyRoughnessMap,
  buildSleeveAlbedoTexture,
  buildSleevePatchTexture,
  buildTorsoAlbedoTexture,
  getSharedFabricNormalMap,
  JerseyTextureSpec,
} from './jerseyTextures';

export type JerseyCameraPreset = 'front' | 'back' | 'side';

const CAMERA_PRESET_POS: Record<JerseyCameraPreset, [number, number, number]> = {
  front: [0.18, 0.08, 2.18],
  back: [-0.14, 0.08, -2.18],
  side: [-2.05, 0.16, 0.56],
};

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 122);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export interface JerseyStudioRig {
  setCameraPreset: (preset: JerseyCameraPreset, immediate?: boolean) => void;
  updateSpec: (spec: JerseyTextureSpec) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

export function createJerseyStudioRig(
  container: HTMLElement,
  options: {
    interactive: boolean;
    highRes: boolean;
    initialView: JerseyCameraPreset;
    initialSpec: JerseyTextureSpec;
  }
): JerseyStudioRig {
  const isSoftwareGl = isSoftwareWebGL();
  const width = Math.max(container.clientWidth || 320, 120);
  const height = Math.max(container.clientHeight || 360, 120);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(
    isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  );
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070c16, 0.045);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.72;
  pmremGenerator.dispose();

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
  const [ix, iy, iz] = CAMERA_PRESET_POS[options.initialView];
  camera.position.set(ix, iy, iz);
  camera.lookAt(0, 0.02, 0);

  // Balanced 3-Point Warm/Cool Studio Rig
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.78);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.85);
  keyLight.position.set(2.4, 3.2, 3.4);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.camera.left = -1.5;
    keyLight.shadow.camera.right = 1.5;
    keyLight.shadow.camera.top = 1.5;
    keyLight.shadow.camera.bottom = -1.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.25);
  rimLight.position.set(-2.6, 1.8, -3.1);
  scene.add(rimLight);

  const backFillLight = new THREE.DirectionalLight(0xfef3c7, 0.95);
  backFillLight.position.set(1.8, 1.6, -3.2);
  scene.add(backFillLight);

  // Soft Grounding Contact Shadow beneath Kit
  const shadowTex = createContactShadowTexture();
  const shadowPlaneGeo = new THREE.PlaneGeometry(1.45, 1.15);
  const shadowPlaneMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, -0.73, 0);
  scene.add(shadowPlane);

  // Sculpted 3D Football Jersey Model
  const normalMap = getSharedFabricNormalMap();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  let activeRoughMap = buildJerseyRoughnessMap(options.initialSpec, options.highRes);
  const jersey: JerseyMeshBundle = createSculptedJerseyModel(
    normalMap,
    activeRoughMap
  );
  scene.add(jersey.root);

  let activeTorsoTex: THREE.CanvasTexture | null = null;
  let activeSleeveTex: THREE.CanvasTexture | null = null;
  let activeCrestTex: THREE.CanvasTexture | null = null;
  let activePatchTex: THREE.CanvasTexture | null = null;

  const applyTextures = (spec: JerseyTextureSpec) => {
    const nextTorso = buildTorsoAlbedoTexture(spec, maxAniso, options.highRes);
    const nextSleeve = buildSleeveAlbedoTexture(spec, maxAniso);
    const nextRough = buildJerseyRoughnessMap(spec, options.highRes);
    const nextCrest = buildCrestTexture(spec, maxAniso);
    const nextPatch = buildSleevePatchTexture(spec.patchType, maxAniso);

    jersey.torsoMat.map = nextTorso;
    jersey.torsoMat.roughnessMap = nextRough;
    jersey.torsoMat.needsUpdate = true;

    jersey.sleeveMat.map = nextSleeve;
    jersey.sleeveMat.needsUpdate = true;

    jersey.trimMat.color.set(
      spec.pattern === 'sleeves-contrast' ? spec.secondaryColor : spec.stripeColor
    );
    jersey.trimMat.needsUpdate = true;

    jersey.crestMat.map = nextCrest;
    jersey.crestMat.needsUpdate = true;

    if (nextPatch) {
      jersey.patchMat.map = nextPatch;
      jersey.patchMat.needsUpdate = true;
      jersey.patchMesh.visible = true;
    } else {
      jersey.patchMesh.visible = false;
    }

    activeTorsoTex?.dispose();
    activeSleeveTex?.dispose();
    activeRoughMap?.dispose();
    activeCrestTex?.dispose();
    activePatchTex?.dispose();

    activeTorsoTex = nextTorso;
    activeSleeveTex = nextSleeve;
    activeRoughMap = nextRough;
    activeCrestTex = nextCrest;
    activePatchTex = nextPatch;
  };

  applyTextures(options.initialSpec);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.02, 0);
  controls.enablePan = false;
  controls.enableZoom = options.interactive;
  controls.enableRotate = options.interactive;
  controls.minDistance = 1.35;
  controls.maxDistance = 3.4;
  controls.minPolarAngle = Math.PI * 0.22;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.enableDamping = !isSoftwareGl && options.interactive;
  controls.dampingFactor = 0.07;

  // Coalesced On-Demand Rendering + Smooth Exponential Camera Damping
  let disposed = false;
  let frameId = 0;
  let timerId = 0;
  let renderBusy = false;
  let renderDirty = false;
  let transitionActive = false;
  const targetCamPos = new THREE.Vector3(ix, iy, iz);
  const lastFrameTime = { val: performance.now() };

  const registerTimer = (id: number) => {
    timerId = id;
  };

  const requestRender = () => {
    if (disposed) return;
    if (renderBusy) {
      renderDirty = true;
      return;
    }
    renderBusy = true;

    frameId = requestAnimationFrame(() => {
      if (disposed) return;
      renderDirty = false;

      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime.val) / 1000));
      lastFrameTime.val = now;

      let needsMoreFrames = false;

      if (transitionActive) {
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          targetCamPos.x,
          8.5,
          dt
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          targetCamPos.y,
          8.5,
          dt
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          targetCamPos.z,
          8.5,
          dt
        );
        if (camera.position.distanceTo(targetCamPos) < 0.008) {
          camera.position.copy(targetCamPos);
          transitionActive = false;
        } else {
          needsMoreFrames = true;
        }
      }

      if (controls.update()) {
        needsMoreFrames = true;
      }

      renderer.render(scene, camera);

      const done = () => {
        renderBusy = false;
        if (!disposed && (renderDirty || needsMoreFrames)) {
          requestRender();
        }
      };

      if (isSoftwareGl) {
        afterSoftwareDraw(renderer, done, registerTimer);
      } else {
        done();
      }
    });
  };

  controls.addEventListener('start', () => {
    transitionActive = false;
  });
  controls.addEventListener('change', requestRender);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }
  requestRender();

  return {
    setCameraPreset(preset, immediate = false) {
      const [tx, ty, tz] = CAMERA_PRESET_POS[preset];
      targetCamPos.set(tx, ty, tz);
      if (immediate || isSoftwareGl) {
        transitionActive = false;
        camera.position.copy(targetCamPos);
        camera.lookAt(0, 0.02, 0);
        controls.update();
      } else {
        transitionActive = true;
      }
      requestRender();
    },

    updateSpec(spec) {
      applyTextures(spec);
      requestRender();
    },

    resize(newW, newH) {
      if (disposed || newW <= 0 || newH <= 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH, false);
      requestRender();
    },

    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      controls.dispose();
      jersey.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      shadowTex.dispose();
      activeTorsoTex?.dispose();
      activeSleeveTex?.dispose();
      activeRoughMap?.dispose();
      activeCrestTex?.dispose();
      activePatchTex?.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
