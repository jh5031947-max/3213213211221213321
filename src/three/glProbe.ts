import * as THREE from 'three';

let cachedSoftwareFlag: boolean | null = null;

/**
 * Single-pass GPU renderer string probe per Three.js skill specification.
 * Immediately frees its temporary probe context after detection.
 */
export function isSoftwareWebGL(): boolean {
  if (cachedSoftwareFlag !== null) return cachedSoftwareFlag;
  if (typeof document === 'undefined') {
    cachedSoftwareFlag = false;
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareFlag = true;
      return true;
    }

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    cachedSoftwareFlag = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      gpu
    );
  } catch {
    cachedSoftwareFlag = false;
  }

  return cachedSoftwareFlag;
}

/**
 * Waits for CPU/software GPU command completion via WebGL2 fenceSync before
 * scheduling the next draw on software-rendered devices.
 */
export function afterSoftwareDraw(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  registerTimer: (id: number) => void
): void {
  try {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      registerTimer(window.setTimeout(cb, 80));
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        registerTimer(window.setTimeout(poll, 5));
      } else {
        if (sync) gl.deleteSync(sync);
        registerTimer(window.setTimeout(cb, 80));
      }
    };
    registerTimer(window.setTimeout(poll, 5));
  } catch {
    registerTimer(window.setTimeout(cb, 80));
  }
}
