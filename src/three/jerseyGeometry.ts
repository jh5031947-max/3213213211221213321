import * as THREE from 'three';

export interface JerseyMeshBundle {
  root: THREE.Group;
  torsoMat: THREE.MeshPhysicalMaterial;
  sleeveMat: THREE.MeshPhysicalMaterial;
  trimMat: THREE.MeshStandardMaterial;
  crestMat: THREE.MeshPhysicalMaterial;
  patchMat: THREE.MeshPhysicalMaterial;
  patchMesh: THREE.Mesh;
  dispose: () => void;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Computes exact anatomical torso point + UV coordinates.
 * u = 0..0.5 covers Front (+Z), u = 0.5..1.0 covers Back (-Z).
 */
function sampleTorsoPoint(
  u: number,
  v: number,
  radialOffset = 0
): THREE.Vector3 {
  // phi goes from PI (-X, u=0) -> PI/2 (+Z front, u=0.25) -> 0 (+X, u=0.5) -> -PI/2 (-Z back, u=0.75) -> -PI (-X, u=1)
  const phi = Math.PI * (1 - 2 * u);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const frontFactor = Math.max(0, sinP);
  const backFactor = Math.max(0, -sinP);

  // Athletic V-taper width & depth profile from hem (v=0) to neck ring (v=1)
  const waistTaper = 1 - 0.11 * Math.exp(-Math.pow((v - 0.28) / 0.18, 2));
  const hemFlare = 1 + 0.03 * Math.exp(-Math.pow(v / 0.1, 2));
  const upperLatSwell = 1 + 0.09 * smoothstep(0.38, 0.74, v);
  const shoulderCapInward = 1 - 0.58 * Math.pow(smoothstep(0.76, 1.0, v), 1.38);

  let rx = 0.375 * waistTaper * hemFlare * upperLatSwell * shoulderCapInward + radialOffset;
  let rz = 0.195 * waistTaper * hemFlare * (1 + 0.07 * smoothstep(0.36, 0.72, v)) * (1 - 0.34 * Math.pow(smoothstep(0.78, 1.0, v), 1.4)) + radialOffset;

  // Anatomical pectoral & scapula fullness
  const pecHeight = Math.exp(-Math.pow((v - 0.68) / 0.13, 2));
  const pecLobes = Math.pow(Math.sin(Math.min(1, Math.abs(cosP) / 0.72) * Math.PI), 1.2);
  const sternumGroove = Math.exp(-Math.pow(cosP / 0.16, 2)) * 0.012;
  const chestLift = frontFactor * pecHeight * (0.036 * pecLobes - sternumGroove);

  const scapulaHeight = Math.exp(-Math.pow((v - 0.72) / 0.14, 2));
  const spineGroove = Math.exp(-Math.pow(cosP / 0.17, 2)) * 0.015;
  const backLift = backFactor * scapulaHeight * (0.024 * pecLobes - spineGroove);

  // Subtle realistic garment drape folds near waist & lower ribs
  const foldZone = Math.exp(-Math.pow((v - 0.24) / 0.2, 2));
  const microFold =
    (Math.sin(phi * 5 + v * 11) * 0.0045 +
      Math.cos(phi * 8 - v * 14) * 0.0028) *
    foldZone;

  let x = cosP * rx;
  let z = sinP * (rz + chestLift + backLift + microFold);
  x += cosP * microFold * 0.7;

  // Natural curved neckline dip & sloped athletic shoulder ridge
  const baseY = -0.68 + v * 1.28;
  const centerMask = Math.exp(-Math.pow(cosP / 0.42, 2));
  const frontNeckDip =
    frontFactor * centerMask * smoothstep(0.68, 1.0, v) * 0.145;
  const backNeckDip =
    backFactor * centerMask * smoothstep(0.78, 1.0, v) * 0.042;
  const outerShoulderSlope =
    Math.pow(Math.abs(cosP), 1.6) * smoothstep(0.66, 1.0, v) * 0.055;

  const y = baseY - frontNeckDip - backNeckDip - outerShoulderSlope;

  return new THREE.Vector3(x, y, z);
}

function buildTorsoGeometry(
  segU = 72,
  segV = 56,
  radialOffset = 0,
  flipWinding = false
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      const pt = sampleTorsoPoint(u, v, radialOffset);
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(u, v);
    }
  }

  const stride = segU + 1;
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i + 1;
      const d = (j + 1) * stride + i;
      if (!flipWinding) {
        indices.push(a, b, c, a, c, d);
      } else {
        indices.push(a, c, b, a, d, c);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeTangents();
  return geo;
}

/**
 * Builds an anatomical tailored collar band following the exact neckline perimeter.
 */
function buildCollarGeometry(segU = 72, segProfile = 14): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const tubeRadius = 0.017;

  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const center = sampleTorsoPoint(u, 0.992, 0.002);
    const prev = sampleTorsoPoint((i - 0.5) / segU, 0.992, 0.002);
    const next = sampleTorsoPoint((i + 0.5) / segU, 0.992, 0.002);

    const tangent = next.clone().sub(prev).normalize();
    const outward = new THREE.Vector3(center.x, 0.15, center.z).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, outward).normalize();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    for (let j = 0; j <= segProfile; j++) {
      const a = (j / segProfile) * Math.PI * 2;
      const ca = Math.cos(a) * tubeRadius * 0.9;
      const sa = Math.sin(a) * tubeRadius * 1.25;

      const px = center.x + normal.x * ca + binormal.x * sa;
      const py = center.y + normal.y * ca + binormal.y * sa;
      const pz = center.z + normal.z * ca + binormal.z * sa;

      positions.push(px, py, pz);
      uvs.push(u, j / segProfile);
    }
  }

  const stride = segProfile + 1;
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segProfile; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, c, b, a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function computeTwistFreeFrames(
  curve: THREE.CatmullRomCurve3,
  segT: number
): { pts: THREE.Vector3[]; tangents: THREE.Vector3[]; depthDirs: THREE.Vector3[]; upDirs: THREE.Vector3[] } {
  const pts: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  const depthDirs: THREE.Vector3[] = [];
  const upDirs: THREE.Vector3[] = [];
  const worldZ = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i <= segT; i++) {
    const t = i / segT;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    // Depth axis roughly +Z, orthogonalized against arm tangent
    const depth = worldZ
      .clone()
      .addScaledVector(tangent, -worldZ.dot(tangent))
      .normalize();
    // Outer-upper sleeve normal perpendicular to tangent & depth
    const up = new THREE.Vector3().crossVectors(depth, tangent).normalize();
    if (up.y < 0) up.negate();

    pts.push(pt);
    tangents.push(tangent);
    depthDirs.push(depth);
    upDirs.push(up);
  }

  return { pts, tangents, depthDirs, upDirs };
}

/**
 * Builds a tailored curved football sleeve lofted along a relaxed athletic arm curve
 * (sloping naturally at ~35 deg rather than T-pose Roblox blocks).
 */
function buildTailoredSleeveGeometry(
  side: 1 | -1,
  radialOffset = 0,
  flipWinding = false
): {
  sleeveGeo: THREE.BufferGeometry;
  cuffGeo: THREE.BufferGeometry;
  patchAnchor: THREE.Vector3;
  patchNormal: THREE.Vector3;
} {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.255, 0.39, -0.006),
    new THREE.Vector3(side * 0.365, 0.365, 0.008),
    new THREE.Vector3(side * 0.485, 0.255, 0.024),
    new THREE.Vector3(side * 0.575, 0.125, 0.042),
  ]);

  const segT = 26;
  const segR = 36;
  const { pts, depthDirs, upDirs } = computeTwistFreeFrames(curve, segT);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segT; i++) {
    const t = i / segT;
    const pt = pts[i];
    const D = depthDirs[i];
    const U = upDirs[i];

    // Elliptical deltoid cap tapering down to tailored bicep cuff
    const radiusV = 0.168 * (1 - 0.31 * smoothstep(0.15, 1.0, t)) + radialOffset;
    const radiusH = 0.132 * (1 - 0.16 * smoothstep(0.15, 1.0, t)) + radialOffset;

    for (let j = 0; j <= segR; j++) {
      const a = (j / segR) * Math.PI * 2;
      // Subtle underarm fabric crease fold
      const underarmFactor = Math.max(0, -Math.sin(a)) * smoothstep(0.1, 0.65, t);
      const crease = Math.sin(t * 14 + a * 3) * 0.0035 * underarmFactor;

      const localUp = Math.sin(a) * (radiusV + crease);
      const localDepth = Math.cos(a) * (radiusH + crease * 0.5);

      const vx = pt.x + D.x * localDepth + U.x * localUp;
      const vy = pt.y + D.y * localDepth + U.y * localUp;
      const vz = pt.z + D.z * localDepth + U.z * localUp;

      positions.push(vx, vy, vz);
      // Map UV u cleanly around sleeve (0.25 = outer top, 0.75 = inner underarm), v = length
      uvs.push(j / segR, 1 - t);
    }
  }

  const stride = segR + 1;
  for (let i = 0; i < segT; i++) {
    for (let j = 0; j < segR; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      // Outward winding: side=1 (+T x +U = +D), side=-1 (+T x +U = -D)
      const wantFlip = side === 1 ? flipWinding : !flipWinding;
      if (!wantFlip) {
        indices.push(a, b, c, a, c, d);
      } else {
        indices.push(a, c, b, a, d, c);
      }
    }
  }

  const sleeveGeo = new THREE.BufferGeometry();
  sleeveGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  sleeveGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  sleeveGeo.setIndex(indices);
  sleeveGeo.computeVertexNormals();
  sleeveGeo.computeTangents();

  // Compute exact outer sleeve patch anchor at t = 0.62
  const patchIdx = Math.round(0.62 * segT);
  const pPt = pts[patchIdx];
  const pU = upDirs[patchIdx];
  const pR = 0.168 * (1 - 0.31 * smoothstep(0.15, 1.0, 0.62)) + 0.006;
  const patchAnchor = pPt.clone().addScaledVector(pU, pR);
  const patchNormal = pU.clone().normalize();

  // Cuff Ring at end of sleeve (t = 0.92..1.0)
  const cuffPositions: number[] = [];
  const cuffUvs: number[] = [];
  const cuffIndices: number[] = [];
  const cuffRings = 8;

  for (let i = 0; i <= cuffRings; i++) {
    const t = 0.91 + (i / cuffRings) * 0.095;
    const pt = curve.getPointAt(Math.min(1, t));
    const idx = Math.min(segT, Math.round(t * segT));
    const D = depthDirs[idx];
    const U = upDirs[idx];

    const rV = 0.118 + Math.sin((i / cuffRings) * Math.PI) * 0.006;
    const rH = 0.113 + Math.sin((i / cuffRings) * Math.PI) * 0.006;

    for (let j = 0; j <= segR; j++) {
      const a = (j / segR) * Math.PI * 2;
      const localUp = Math.sin(a) * rV;
      const localDepth = Math.cos(a) * rH;
      cuffPositions.push(
        pt.x + D.x * localDepth + U.x * localUp,
        pt.y + D.y * localDepth + U.y * localUp,
        pt.z + D.z * localDepth + U.z * localUp
      );
      cuffUvs.push(j / segR, i / cuffRings);
    }
  }

  for (let i = 0; i < cuffRings; i++) {
    for (let j = 0; j < segR; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      if (side === 1) {
        cuffIndices.push(a, b, c, a, c, d);
      } else {
        cuffIndices.push(a, c, b, a, d, c);
      }
    }
  }

  const cuffGeo = new THREE.BufferGeometry();
  cuffGeo.setAttribute('position', new THREE.Float32BufferAttribute(cuffPositions, 3));
  cuffGeo.setAttribute('uv', new THREE.Float32BufferAttribute(cuffUvs, 2));
  cuffGeo.setIndex(cuffIndices);
  cuffGeo.computeVertexNormals();

  return { sleeveGeo, cuffGeo, patchAnchor, patchNormal };
}

/**
 * Builds a slightly curved shield/emblem badge that hugs the chest surface.
 */
function buildCurvedBadgeGeometry(
  width: number,
  height: number,
  curvature = 0.012
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 10, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (width * 0.5);
    const ny = y / (height * 0.5);
    const zCurve = -(nx * nx * 0.7 + ny * ny * 0.3) * curvature;
    pos.setZ(i, zCurve);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Assembles the multi-part sculpted 3D Football Jersey Group.
 */
export function createSculptedJerseyModel(
  normalMap: THREE.Texture,
  roughnessMap: THREE.Texture
): JerseyMeshBundle {
  const root = new THREE.Group();
  root.position.set(0, 0.04, 0);

  const torsoMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    sheen: 0.42,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color('#E2E8F0'),
    normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap,
    side: THREE.FrontSide,
  });

  const sleeveMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    sheen: 0.38,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color('#E2E8F0'),
    normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    side: THREE.FrontSide,
  });

  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.94,
    metalness: 0.0,
    side: THREE.FrontSide,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.86,
    metalness: 0.04,
    normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    side: THREE.DoubleSide,
  });

  const crestMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.25,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    transparent: true,
    alphaTest: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const patchMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.36,
    metalness: 0.18,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    transparent: true,
    alphaTest: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  // 1. Torso Outer + Dark Inner Lining
  const torsoGeo = buildTorsoGeometry(72, 56, 0, false);
  const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  root.add(torsoMesh);

  const innerTorsoGeo = buildTorsoGeometry(56, 40, -0.004, true);
  const innerTorsoMesh = new THREE.Mesh(innerTorsoGeo, innerMat);
  root.add(innerTorsoMesh);

  // 2. Tailored Ribbed Collar
  const collarGeo = buildCollarGeometry(72, 14);
  const collarMesh = new THREE.Mesh(collarGeo, trimMat);
  collarMesh.castShadow = true;
  root.add(collarMesh);

  // 3. Left & Right Draped Sleeves + Inner Sleeve Linings + Contrast Cuffs
  const leftSleeve = buildTailoredSleeveGeometry(1, 0, false);
  const leftInner = buildTailoredSleeveGeometry(1, -0.004, true);
  const rightSleeve = buildTailoredSleeveGeometry(-1, 0, false);
  const rightInner = buildTailoredSleeveGeometry(-1, -0.004, true);

  const leftSleeveMesh = new THREE.Mesh(leftSleeve.sleeveGeo, sleeveMat);
  leftSleeveMesh.castShadow = true;
  leftSleeveMesh.receiveShadow = true;

  const rightSleeveMesh = new THREE.Mesh(rightSleeve.sleeveGeo, sleeveMat);
  rightSleeveMesh.castShadow = true;
  rightSleeveMesh.receiveShadow = true;

  const leftInnerMesh = new THREE.Mesh(leftInner.sleeveGeo, innerMat);
  const rightInnerMesh = new THREE.Mesh(rightInner.sleeveGeo, innerMat);

  const leftCuffMesh = new THREE.Mesh(leftSleeve.cuffGeo, trimMat);
  leftCuffMesh.castShadow = true;
  const rightCuffMesh = new THREE.Mesh(rightSleeve.cuffGeo, trimMat);
  rightCuffMesh.castShadow = true;

  root.add(
    leftSleeveMesh,
    rightSleeveMesh,
    leftInnerMesh,
    rightInnerMesh,
    leftCuffMesh,
    rightCuffMesh
  );

  // 4. Curved Woven Chest Crest Badge (Left chest = +X on front +Z)
  const crestSpot = sampleTorsoPoint(0.325, 0.695, 0.005);
  const crestGeo = buildCurvedBadgeGeometry(0.115, 0.13, 0.012);
  const crestMesh = new THREE.Mesh(crestGeo, crestMat);
  crestMesh.position.copy(crestSpot);
  crestMesh.lookAt(
    crestSpot.x * 2.1,
    crestSpot.y + 0.04,
    crestSpot.z + 1.0
  );
  root.add(crestMesh);

  // 5. Curved Right-Sleeve Patch Badge (Wearer's right deltoid = -X outer sleeve)
  const patchGeo = buildCurvedBadgeGeometry(0.088, 0.088, 0.014);
  const patchMesh = new THREE.Mesh(patchGeo, patchMat);
  patchMesh.position.copy(rightSleeve.patchAnchor);
  patchMesh.lookAt(
    rightSleeve.patchAnchor.clone().add(rightSleeve.patchNormal)
  );
  patchMesh.visible = false;
  root.add(patchMesh);

  const dispose = () => {
    torsoGeo.dispose();
    innerTorsoGeo.dispose();
    collarGeo.dispose();
    leftSleeve.sleeveGeo.dispose();
    leftSleeve.cuffGeo.dispose();
    leftInner.sleeveGeo.dispose();
    leftInner.cuffGeo.dispose();
    rightSleeve.sleeveGeo.dispose();
    rightSleeve.cuffGeo.dispose();
    rightInner.sleeveGeo.dispose();
    rightInner.cuffGeo.dispose();
    crestGeo.dispose();
    patchGeo.dispose();

    torsoMat.dispose();
    sleeveMat.dispose();
    innerMat.dispose();
    trimMat.dispose();
    crestMat.dispose();
    patchMat.dispose();
  };

  return {
    root,
    torsoMat,
    sleeveMat,
    trimMat,
    crestMat,
    patchMat,
    patchMesh,
    dispose,
  };
}
