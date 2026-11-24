import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
import { JerseyCameraPreset } from './jerseySceneRig';
import { isSoftwareWebGL } from './glProbe';

const CACHE_LIMIT = 48;
const snapshotCache = new Map<string, string>();

const BAKE_CAMERA_POS: Record<JerseyCameraPreset, [number, number, number]> = {
  front: [0.22, 0.08, 2.08],
  back: [-0.18, 0.08, -2.08],
  side: [-2.0, 0.14, 0.52],
};

interface BakerSingleton {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  jersey: JerseyMeshBundle;
  maxAniso: number;
}

let singleton: BakerSingleton | null = null;
let queuePromise: Promise<void> = Promise.resolve();

function getBaker(): BakerSingleton {
  if (singleton) return singleton;

  const isSw = isSoftwareWebGL();
  const W = 540;
  const H = 640;

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSw,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.72;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 20);

  scene.add(new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.8));
  const key = new THREE.DirectionalLight(0xfff7ed, 1.85);
  key.position.set(2.4, 3.2, 3.4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x93c5fd, 1.25);
  rim.position.set(-2.6, 1.8, -3.1);
  scene.add(rim);

  const backFill = new THREE.DirectionalLight(0xfef3c7, 0.95);
  backFill.position.set(1.8, 1.6, -3.2);
  scene.add(backFill);

  const normalMap = getSharedFabricNormalMap();
  const dummyRough = buildJerseyRoughnessMap(
    {
      bgColor: '#FFFFFF',
      secondaryColor: '#0F172A',
      stripeColor: '#00C853',
      textColor: '#0F172A',
      numberStrokeColor: '#CBD5E1',
      pattern: 'solid-trim',
      crestCode: 'PG',
      sponsorText: '',
      customName: '',
      customNumber: '',
      patchType: 'none',
    },
    false
  );
  const jersey = createSculptedJerseyModel(normalMap, dummyRough);
  scene.add(jersey.root);

  singleton = {
    renderer,
    scene,
    camera,
    jersey,
    maxAniso: renderer.capabilities.getMaxAnisotropy(),
  };
  return singleton;
}

export function bake3DJerseySnapshot(
  spec: JerseyTextureSpec,
  view: JerseyCameraPreset
): Promise<string> {
  const key = JSON.stringify([
    spec.bgColor,
    spec.secondaryColor,
    spec.stripeColor,
    spec.textColor,
    spec.numberStrokeColor,
    spec.pattern,
    spec.crestCode,
    spec.sponsorText,
    Boolean(spec.isNational),
    spec.customName,
    spec.customNumber,
    spec.patchType,
    view,
  ]);

  const cached = snapshotCache.get(key);
  if (cached) return Promise.resolve(cached);

  const runTask = () =>
    new Promise<string>((resolve) => {
      const again = snapshotCache.get(key);
      if (again) {
        resolve(again);
        return;
      }

      try {
        const b = getBaker();
        const torsoTex = buildTorsoAlbedoTexture(spec, b.maxAniso, false);
        const sleeveTex = buildSleeveAlbedoTexture(spec, b.maxAniso);
        const roughTex = buildJerseyRoughnessMap(spec, false);
        const crestTex = buildCrestTexture(spec, b.maxAniso);
        const patchTex = buildSleevePatchTexture(spec.patchType, b.maxAniso);

        b.jersey.torsoMat.map = torsoTex;
        b.jersey.torsoMat.roughnessMap = roughTex;
        b.jersey.torsoMat.needsUpdate = true;

        b.jersey.sleeveMat.map = sleeveTex;
        b.jersey.sleeveMat.needsUpdate = true;

        b.jersey.trimMat.color.set(
          spec.pattern === 'sleeves-contrast' ? spec.secondaryColor : spec.stripeColor
        );
        b.jersey.trimMat.needsUpdate = true;

        b.jersey.crestMat.map = crestTex;
        b.jersey.crestMat.needsUpdate = true;

        if (patchTex) {
          b.jersey.patchMat.map = patchTex;
          b.jersey.patchMat.needsUpdate = true;
          b.jersey.patchMesh.visible = true;
        } else {
          b.jersey.patchMesh.visible = false;
        }

        const [cx, cy, cz] = BAKE_CAMERA_POS[view];
        b.camera.position.set(cx, cy, cz);
        b.camera.lookAt(0, 0.02, 0);
        b.renderer.render(b.scene, b.camera);

        const dataUrl = b.renderer.domElement.toDataURL('image/png');

        torsoTex.dispose();
        sleeveTex.dispose();
        roughTex.dispose();
        crestTex.dispose();
        patchTex?.dispose();

        if (snapshotCache.size >= CACHE_LIMIT) {
          const oldest = snapshotCache.keys().next().value;
          if (oldest) snapshotCache.delete(oldest);
        }
        snapshotCache.set(key, dataUrl);
        resolve(dataUrl);
      } catch {
        resolve('');
      }
    });

  const next = queuePromise.then(runTask, runTask);
  queuePromise = next.then(() => undefined, () => undefined);
  return next;
}
