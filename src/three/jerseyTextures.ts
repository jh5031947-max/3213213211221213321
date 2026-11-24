import * as THREE from 'three';
import { KitPattern, PatchType } from '../types';

export interface JerseyTextureSpec {
  bgColor: string;
  secondaryColor: string;
  stripeColor: string;
  textColor: string;
  numberStrokeColor: string;
  pattern: KitPattern;
  crestCode: string;
  sponsorText: string;
  isNational?: boolean;
  customName: string;
  customNumber: string;
  patchType: PatchType;
}

let cachedNormalMap: THREE.DataTexture | null = null;

/**
 * Generates a high-detail tangent-space knit fabric normal map with engineered
 * jacquard micro-pores and twin-needle seam grooves.
 */
export function getSharedFabricNormalMap(): THREE.DataTexture {
  if (cachedNormalMap) return cachedNormalMap;

  const size = 512;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    const ny = y / size;
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const idx = (y * size + x) * 4;

      // Engineered honeycomb knit micro-weave derivatives
      const freqX = nx * Math.PI * 128;
      const freqY = ny * Math.PI * 128;
      let dx = Math.cos(freqX) * Math.sin(freqY) * 0.22;
      let dy = Math.sin(freqX) * Math.cos(freqY) * 0.22;

      // Subtle vertical athletic mesh rib every 16px
      dx += Math.cos(nx * Math.PI * 48) * 0.1;

      // Subtle side-panel seam grooves (u = 0, 0.5, 1.0)
      const distSide = Math.min(nx, Math.abs(nx - 0.5), 1 - nx);
      if (distSide < 0.008) {
        const s = (distSide / 0.008) * Math.PI;
        dx += Math.sin(s) * 0.35;
      }

      // Twin-needle bottom hem groove (y near bottom = ny ~ 0.96)
      if (Math.abs(ny - 0.96) < 0.006) {
        dy += Math.sin(((ny - 0.96) / 0.006) * Math.PI) * 0.32;
      }

      const nz = Math.sqrt(Math.max(0.05, 1 - dx * dx - dy * dy));
      data[idx] = Math.round((dx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;

  cachedNormalMap = tex;
  return tex;
}

/**
 * Generates a paired roughness map (matte knit body vs semi-satin vinyl prints).
 */
export function buildJerseyRoughnessMap(
  spec: JerseyTextureSpec,
  highRes: boolean
): THREE.CanvasTexture {
  const W = highRes ? 1024 : 512;
  const H = highRes ? 512 : 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Matte breathable polyester knit baseline (~0.84)
  ctx.fillStyle = '#D6D6D6';
  ctx.fillRect(0, 0, W, H);

  // Side ventilated mesh slightly rougher
  ctx.fillStyle = '#E6E6E6';
  ctx.fillRect(0, 0, W * 0.04, H);
  ctx.fillRect(W * 0.46, 0, W * 0.08, H);
  ctx.fillRect(W * 0.96, 0, W * 0.04, H);

  // Satin vinyl sheen over front sponsor & back marking zones
  ctx.fillStyle = '#5C5C5C';
  if (spec.sponsorText || (spec.isNational && spec.customNumber)) {
    ctx.fillRect(W * 0.14, H * 0.36, W * 0.22, H * 0.16);
  }
  if (spec.customName.trim()) {
    ctx.fillRect(W * 0.62, H * 0.2, W * 0.26, H * 0.13);
  }
  if (spec.customNumber.trim()) {
    ctx.fillRect(W * 0.64, H * 0.34, W * 0.22, H * 0.36);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function drawArchedName(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  textColor: string,
  strokeColor: string,
  W: number
): void {
  const clean = text.trim().toUpperCase();
  if (!clean) return;

  const len = clean.length;
  const fontSize = Math.round(
    W * (len > 10 ? 0.025 : len > 8 ? 0.029 : len > 6 ? 0.033 : 0.037)
  );
  ctx.save();
  ctx.translate(cx, cy);
  ctx.font = `900 ${fontSize}px "Montserrat", "Noto Sans KR", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const radius = W * 0.38;
  const step = fontSize * (len > 9 ? 0.72 : 0.78);
  const totalW = (len - 1) * step;
  const startAngle = -totalW / (2 * radius);

  for (let i = 0; i < len; i++) {
    const angle = len === 1 ? 0 : startAngle + (i * step) / radius;
    ctx.save();
    ctx.translate(0, radius);
    ctx.rotate(angle);
    ctx.translate(0, -radius);

    ctx.lineWidth = Math.max(2, fontSize * 0.1);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(clean[i], 0, 0);

    ctx.fillStyle = textColor;
    ctx.fillText(clean[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawBackNumber(
  ctx: CanvasRenderingContext2D,
  numStr: string,
  cx: number,
  cy: number,
  textColor: string,
  strokeColor: string,
  crestCode: string,
  W: number
): void {
  const clean = numStr.trim();
  if (!clean) return;

  const fontSize = Math.round(W * (clean.length > 1 ? 0.145 : 0.165));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.84, 1.08);
  ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  ctx.lineWidth = Math.max(5, fontSize * 0.048);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = strokeColor;
  ctx.strokeText(clean, 0, 0);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = textColor;
  ctx.fillText(clean, 0, 0);

  // Subtle pro inline & bottom micro crest dot
  ctx.lineWidth = 2;
  ctx.strokeStyle = strokeColor;
  ctx.globalAlpha = 0.35;
  ctx.strokeText(clean, 0, 0);
  ctx.globalAlpha = 1;

  const dotY = fontSize * 0.32;
  const offsets = clean.length === 2 ? [-fontSize * 0.25, fontSize * 0.25] : [0];
  for (const ox of offsets) {
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(ox, dotY, W * 0.0055, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = `800 ${Math.round(W * 0.005)}px "Montserrat", sans-serif`;
    ctx.fillText(crestCode.slice(0, 3), ox, dotY + 1);
  }

  ctx.restore();
}

/**
 * Draws the front & back torso 2D atlas texture (u=0..0.5 Front, u=0.5..1.0 Back).
 */
export function buildTorsoAlbedoTexture(
  spec: JerseyTextureSpec,
  maxAnisotropy: number,
  highRes: boolean
): THREE.CanvasTexture {
  const W = highRes ? 2048 : 1024;
  const H = highRes ? 1024 : 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Jersey Color
  ctx.fillStyle = spec.bgColor;
  ctx.fillRect(0, 0, W, H);

  // 2. Club Kit Patterns (Front = 0..W*0.5, Back = W*0.5..W)
  if (spec.pattern === 'center-stripe') {
    // PSG Hechter center vertical band + white trim
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(W * 0.205, 0, W * 0.09, H);
    ctx.fillStyle = spec.stripeColor;
    ctx.fillRect(W * 0.214, 0, W * 0.072, H);

    // Subtle tonal back spine band
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = spec.stripeColor;
    ctx.fillRect(W * 0.725, 0, W * 0.05, H);
    ctx.restore();
  } else if (spec.pattern === 'vertical-stripes') {
    // Front & back vertical stripes
    ctx.fillStyle = spec.secondaryColor;
    const fStart = W * 0.04;
    const fEnd = W * 0.46;
    const step = W * 0.068;
    for (let x = fStart; x < fEnd; x += step) {
      ctx.fillRect(x, 0, step * 0.48, H);
    }
    // Back keeps upper shoulder/back clean or tonal stripes
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let x = W * 0.54; x < W * 0.96; x += step) {
      ctx.fillRect(x, 0, step * 0.48, H);
    }
    ctx.restore();
  } else if (spec.pattern === 'split-halves') {
    // Classic Blaugrana split halves (Front & Back)
    ctx.fillStyle = spec.secondaryColor;
    ctx.fillRect(W * 0.25, 0, W * 0.25, H);
    ctx.fillRect(W * 0.75, 0, W * 0.25, H);
    // Thin gold center piping
    ctx.fillStyle = spec.stripeColor;
    ctx.fillRect(W * 0.247, 0, W * 0.006, H);
    ctx.fillRect(W * 0.747, 0, W * 0.006, H);
  } else if (spec.pattern === 'sleeves-contrast') {
    // Spurs shoulder raglan edge piping + side gusset panels
    ctx.fillStyle = spec.secondaryColor;
    ctx.fillRect(0, 0, W * 0.036, H);
    ctx.fillRect(W * 0.464, 0, W * 0.072, H);
    ctx.fillRect(W * 0.964, 0, W * 0.036, H);

    ctx.fillStyle = spec.stripeColor;
    ctx.fillRect(W * 0.034, 0, W * 0.006, H);
    ctx.fillRect(W * 0.46, 0, W * 0.006, H);
    ctx.fillRect(W * 0.534, 0, W * 0.006, H);
    ctx.fillRect(W * 0.96, 0, W * 0.006, H);
  } else if (spec.pattern === 'tiger-wave') {
    // Korea brushstroke tiger wave across front & back
    ctx.save();
    ctx.strokeStyle = spec.secondaryColor;
    ctx.globalAlpha = 0.42;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      ctx.lineWidth = W * 0.015;
      const yB = H * (0.14 + i * 0.11);
      ctx.beginPath();
      ctx.moveTo(0, yB);
      ctx.bezierCurveTo(W * 0.25, yB - 38, W * 0.65, yB + 42, W, yB - 14);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Solid-trim subtle engineered jacquard tonal weave lines
    ctx.save();
    ctx.strokeStyle = spec.stripeColor;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 2;
    for (let y = H * 0.08; y < H * 0.92; y += H * 0.055) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Subtle Ventilated Side Mesh Shading & Stitch Detail
  const sideShadow = ctx.createLinearGradient(0, 0, W * 0.04, 0);
  sideShadow.addColorStop(0, 'rgba(0,0,0,0.16)');
  sideShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sideShadow;
  ctx.fillRect(0, 0, W * 0.04, H);

  // Subtle double-needle stitch dashed line near hem
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, H * 0.962);
  ctx.lineTo(W, H * 0.962);
  ctx.stroke();
  ctx.restore();

  // Authentic Jock Tag Badge on lower-right hem (u ~ 0.075, v ~ 0.08 -> y = H*0.92)
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(W * 0.06, H * 0.895, W * 0.036, H * 0.038);
  ctx.strokeStyle = spec.stripeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(W * 0.06, H * 0.895, W * 0.036, H * 0.038);
  ctx.fillStyle = '#00C853';
  ctx.font = `900 ${Math.round(W * 0.006)}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('AUTH', W * 0.078, H * 0.916);
  ctx.restore();

  // 4. Front Manufacturer Mark (Right Chest = u ~ 0.175 -> x = W*0.175, v ~ 0.70 -> y = H*0.30)
  ctx.save();
  ctx.fillStyle = spec.textColor;
  ctx.font = `900 ${Math.round(W * 0.014)}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PG', W * 0.175, H * 0.295);
  ctx.fillStyle = spec.stripeColor;
  ctx.fillRect(W * 0.163, H * 0.312, W * 0.024, 3);
  ctx.restore();

  // 5. Front Chest Sponsor OR National Team Chest Number (Center Front = x = W*0.25)
  if (spec.isNational && spec.customNumber.trim()) {
    ctx.save();
    ctx.font = `900 ${Math.round(W * 0.07)}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, W * 0.004);
    ctx.strokeStyle = spec.numberStrokeColor;
    ctx.strokeText(spec.customNumber.trim(), W * 0.25, H * 0.44);
    ctx.fillStyle = spec.textColor;
    ctx.fillText(spec.customNumber.trim(), W * 0.25, H * 0.44);
    ctx.restore();
  } else if (spec.sponsorText) {
    ctx.save();
    const len = spec.sponsorText.length;
    const fSize = Math.round(W * (len > 9 ? 0.021 : len > 5 ? 0.029 : 0.038));
    ctx.font = `900 ${fSize}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sponsor color contrast pill/backing only for PSG white center stripe readability if needed
    const sponsorColor =
      spec.pattern === 'center-stripe' ? '#FFFFFF' : spec.textColor;
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = sponsorColor;
    ctx.fillText(spec.sponsorText, W * 0.25, H * 0.44);
    ctx.restore();
  }

  // 6. Back Neck Micro Club Sign-Off (x = W*0.75, v ~ 0.90 -> y = H*0.10)
  ctx.save();
  ctx.fillStyle = spec.textColor;
  ctx.globalAlpha = 0.72;
  ctx.font = `800 ${Math.round(W * 0.008)}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(spec.crestCode, W * 0.75, H * 0.13);
  ctx.restore();

  // 7. Back Arched Name & Pro Number (x = W*0.75)
  if (spec.customName.trim()) {
    drawArchedName(
      ctx,
      spec.customName,
      W * 0.75,
      H * 0.265,
      spec.textColor,
      spec.numberStrokeColor,
      W
    );
  }
  if (spec.customNumber.trim()) {
    drawBackNumber(
      ctx,
      spec.customNumber,
      W * 0.75,
      H * 0.505,
      spec.textColor,
      spec.numberStrokeColor,
      spec.crestCode,
      W
    );
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Draws the sculpted sleeve albedo texture (handles raglan contrast sleeves & stripe accents).
 */
export function buildSleeveAlbedoTexture(
  spec: JerseyTextureSpec,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const sleeveBase =
    spec.pattern === 'sleeves-contrast' ? spec.secondaryColor : spec.bgColor;
  ctx.fillStyle = sleeveBase;
  ctx.fillRect(0, 0, size, size);

  // Subtle shoulder piping or adidas/nike-style top shoulder stripe
  if (
    spec.pattern === 'solid-trim' ||
    spec.pattern === 'vertical-stripes' ||
    spec.pattern === 'sleeves-contrast'
  ) {
    ctx.fillStyle = spec.stripeColor;
    // Outer upper deltoid stripe (u ~ 0.25)
    ctx.fillRect(size * 0.23, 0, size * 0.04, size);
  }

  // Subtle twin-needle cuff stitch line
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.92);
  ctx.lineTo(size, size * 0.92);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Draws a crisp transparent-background woven shield club crest texture.
 */
export function buildCrestTexture(
  spec: JerseyTextureSpec,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Classic athletic shield path
  ctx.beginPath();
  ctx.moveTo(44, 34);
  ctx.lineTo(212, 34);
  ctx.lineTo(212, 136);
  ctx.quadraticCurveTo(212, 202, 128, 232);
  ctx.quadraticCurveTo(44, 202, 44, 136);
  ctx.closePath();

  ctx.fillStyle =
    spec.bgColor.toUpperCase() === '#FFFFFF' || spec.bgColor.toUpperCase() === '#F5F5F0'
      ? spec.secondaryColor
      : spec.bgColor;
  ctx.fill();

  // Metallic embroidered outer border
  ctx.lineWidth = 10;
  ctx.strokeStyle = spec.stripeColor;
  ctx.stroke();

  // Inner satin shield ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Center club stripe accent
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(54, 44);
  ctx.lineTo(202, 44);
  ctx.lineTo(202, 134);
  ctx.quadraticCurveTo(202, 192, 128, 220);
  ctx.quadraticCurveTo(54, 192, 54, 134);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(108, 34, 40, 200);
  ctx.restore();

  // Crest Monogram
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 42px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.crestCode.slice(0, 4), 128, 132);

  // Top championship star
  ctx.fillStyle = '#FACC15';
  ctx.font = '900 22px "Montserrat", sans-serif';
  ctx.fillText('★', 128, 72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Draws a crisp circular/shield sleeve patch texture (League or UCL Starball).
 */
export function buildSleevePatchTexture(
  patchType: PatchType,
  maxAnisotropy: number
): THREE.CanvasTexture | null {
  if (patchType === 'none') return null;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  if (patchType === 'champs') {
    // UCL Starball Badge
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.fillStyle = '#0B1736';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();

    // Star ring dots
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(128 + Math.cos(a) * 74, 128 + Math.sin(a) * 74, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#38BDF8';
    ctx.font = '900 46px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UCL', 128, 130);
  } else {
    // Official League Patch
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#00C853';
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 42px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRO', 128, 114);
    ctx.fillStyle = '#00C853';
    ctx.font = '800 22px "Montserrat", sans-serif';
    ctx.fillText('OFFICIAL', 128, 156);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}
