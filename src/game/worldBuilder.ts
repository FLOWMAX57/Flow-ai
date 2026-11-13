import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ROAD_COORDS } from './constants';
import type { BuildingHouse, WorldPoint, ZoneKind, ZoneRing } from './types';

export interface ColliderBox {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface CarActor {
  group: THREE.Group;
  headlights: THREE.MeshBasicMaterial;
  road: number;
  dir: 1 | -1;
  horiz: boolean;
  baseSpeed: number;
  t: number;
  honkCooldown: number;
}

export interface PedestrianActor {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  axis: number;
  dir: 1 | -1;
  horiz: boolean;
  t: number;
  speed: number;
}

export interface DogActor {
  group: THREE.Group;
  tail: THREE.Mesh;
  legs: THREE.Mesh[];
  homeX: number;
  homeZ: number;
  angle: number;
  chasing: boolean;
  barkCooldown: number;
}

export interface CollectibleItem {
  group: THREE.Group;
  kind: 'coin' | 'energy';
  active: boolean;
  respawnTimer: number;
  x: number;
  z: number;
}

export interface CourierRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  pizzaProp: THREE.Group;
  parcelProp: THREE.Group;
  vipProp: THREE.Group;
  hoverboard: THREE.Group;
  scooter: THREE.Group;
  scooterLight: THREE.SpotLight;
  contactShadow: THREE.Mesh;
}

export interface BuiltWorld {
  colliders: ColliderBox[];
  houses: BuildingHouse[];
  zoneRings: Array<ZoneRing & { mesh: THREE.Mesh; innerMesh: THREE.Mesh }>;
  pizzas: WorldPoint[];
  hubPoint: WorldPoint;
  phonePoint: WorldPoint;
  gigPoint: WorldPoint;
  homePoint: WorldPoint;
  homeController: {
    updateLevel: (level: number, owned: boolean) => void;
  };
  courier: CourierRig;
  cars: CarActor[];
  pedestrians: PedestrianActor[];
  dogs: DogActor[];
  collectibles: CollectibleItem[];
  beacon: THREE.Group;
  fountainRings: THREE.Mesh[];
  lampBulbs: THREE.MeshStandardMaterial[];
  windowEmissives: THREE.MeshStandardMaterial[];
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  textures: THREE.Texture[];
  dispose: () => void;
}

export function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function makeRadialShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(10, 15, 25, 0.52)');
  grad.addColorStop(0.55, 'rgba(10, 15, 25, 0.22)');
  grad.addColorStop(1, 'rgba(10, 15, 25, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWindowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1e293b';
  g.fillRect(0, 0, 128, 128);
  for (let y = 8; y < 124; y += 20) {
    for (let x = 8; x < 124; x += 20) {
      const lit = Math.random();
      g.fillStyle = lit < 0.25 ? '#fde68a' : lit < 0.65 ? '#7dd3fc' : '#334155';
      g.fillRect(x, y, 12, 13);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.magFilter = THREE.NearestFilter;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeApartmentTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e7d7bc';
  g.fillRect(0, 0, 128, 128);
  for (let y = 10; y < 120; y += 28) {
    for (let x = 10; x < 120; x += 28) {
      g.fillStyle = '#785a3a';
      g.fillRect(x, y, 16, 18);
      g.fillStyle = Math.random() < 0.45 ? '#fde68a' : '#bae6fd';
      g.fillRect(x + 2, y + 2, 12, 14);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.magFilter = THREE.NearestFilter;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function makeSignSprite(
  title: string,
  bgColor: string,
  textColor: string,
  borderColor: string,
  maxAnisotropy: number,
): { sprite: THREE.Sprite; texture: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 1024, 256);

  // Rounded badge sign
  const r = 44;
  const x = 24;
  const y = 24;
  const w = 976;
  const h = 208;
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();

  g.fillStyle = bgColor;
  g.fill();
  g.lineWidth = 14;
  g.strokeStyle = borderColor;
  g.stroke();

  g.fillStyle = textColor;
  g.font = '900 78px Cairo, Tahoma, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(title, 512, 132);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  return { sprite, texture };
}

export function buildWorld(scene: THREE.Scene, renderer: THREE.WebGLRenderer): BuiltWorld {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const textures: THREE.Texture[] = [];

  // Environment reflection for PBR metals & glass
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTex = pmrem.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTex;
  roomEnv.dispose();
  pmrem.dispose();
  textures.push(envTex);

  scene.background = new THREE.Color(0x87cefa);
  scene.fog = new THREE.FogExp2(0x87cefa, 0.0042);

  // Balanced 3-Point Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3f6212, 0.85);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff1d6, 1.35);
  sunLight.position.set(65, 110, 50);
  sunLight.castShadow = renderer.shadowMap.enabled;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -135;
  sunLight.shadow.camera.right = 135;
  sunLight.shadow.camera.top = 135;
  sunLight.shadow.camera.bottom = -135;
  sunLight.shadow.camera.near = 15;
  sunLight.shadow.camera.far = 290;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.35);
  rimLight.position.set(-70, 55, -80);
  scene.add(rimLight);

  const shadowTex = makeRadialShadowTexture();
  const winTex = makeWindowTexture(maxAniso);
  const aptTex = makeApartmentTexture(maxAniso);
  textures.push(shadowTex, winTex, aptTex);

  const stdMat = (color: number, roughness = 0.72, metalness = 0.05, extra?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

  const lampBulbs: THREE.MeshStandardMaterial[] = [];
  const windowEmissives: THREE.MeshStandardMaterial[] = [];
  const fountainRings: THREE.Mesh[] = [];
  const colliders: ColliderBox[] = [];
  const houses: BuildingHouse[] = [];
  const zoneRings: Array<ZoneRing & { mesh: THREE.Mesh; innerMesh: THREE.Mesh }> = [];
  const pizzas: WorldPoint[] = [];

  const addBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    castShadow = true,
    receiveShadow = true,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    scene.add(mesh);
    return mesh;
  };

  // Extended natural horizon ground (never boxed in by walls)
  const grassMat = stdMat(0x5bbf42, 0.92, 0.0);
  addBox(640, 1, 640, 0, -0.5, 0, grassMat, false, true);

  // Subtle decorative outer rolling hills / grass ring
  const outerParkMat = stdMat(0x4aa835, 0.95, 0.0);
  addBox(260, 0.14, 260, 0, 0.05, 0, outerParkMat, false, true);

  // Asphalt Roads (offset >= 0.03 above ground to eliminate z-fighting)
  const asphaltMat = stdMat(0x2c3345, 0.85, 0.06);
  ROAD_COORDS.forEach((r) => {
    addBox(212, 0.12, 9, 0, 0.12, r, asphaltMat, false, true);
    addBox(9, 0.12, 212, r, 0.12, 0, asphaltMat, false, true);
  });

  // Instanced dashed lane lines & crosswalks
  const dashHoriz: WorldPoint[] = [];
  const dashVert: WorldPoint[] = [];
  const crossH: WorldPoint[] = [];
  const crossV: WorldPoint[] = [];
  ROAD_COORDS.forEach((r) => {
    for (let t = -100; t <= 100; t += 6) {
      if (ROAD_COORDS.some((q) => Math.abs(t - q) < 6.5)) continue;
      dashHoriz.push({ x: t, z: r });
      dashVert.push({ x: r, z: t });
    }
    ROAD_COORDS.forEach((q) => {
      for (let s = -3; s <= 3; s += 1.5) {
        crossH.push({ x: q + s, z: r - 6.5 });
        crossH.push({ x: q + s, z: r + 6.5 });
        crossV.push({ x: q - 6.5, z: r + s });
        crossV.push({ x: q + 6.5, z: r + s });
      }
    });
  });

  const makeInstancedMarks = (pts: WorldPoint[], w: number, d: number, color: number) => {
    const geo = new THREE.BoxGeometry(w, 0.04, d);
    const mat = new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const im = new THREE.InstancedMesh(geo, mat, pts.length);
    const dummy = new THREE.Object3D();
    pts.forEach((p, idx) => {
      dummy.position.set(p.x, 0.2, p.z);
      dummy.updateMatrix();
      im.setMatrixAt(idx, dummy.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    scene.add(im);
  };

  makeInstancedMarks(dashHoriz, 2.8, 0.36, 0xfacc15);
  makeInstancedMarks(dashVert, 0.36, 2.8, 0xfacc15);
  makeInstancedMarks(crossH, 0.9, 2.4, 0xf8fafc);
  makeInstancedMarks(crossV, 2.4, 0.9, 0xf8fafc);

  // Helpers for composite 3-12 part structures
  const createTree = (x: number, z: number, scale = 1) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4 * scale, 0.55 * scale, 3 * scale, 7),
      stdMat(0x7c4a2d, 0.9, 0.0),
    );
    trunk.position.y = 1.5 * scale;
    trunk.castShadow = true;

    const foliageColor = [0x229944, 0x2ea84f, 0x1e823b][Math.floor(Math.abs(x + z)) % 3];
    const crown1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1 * scale, 0),
      stdMat(foliageColor, 0.78, 0.0),
    );
    crown1.position.y = 4.1 * scale;
    crown1.castShadow = true;

    const crown2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.45 * scale, 0),
      stdMat(0x34b856, 0.78, 0.0),
    );
    crown2.position.set(0.7 * scale, 3.6 * scale, 0.5 * scale);
    crown2.castShadow = true;

    g.add(trunk, crown1, crown2);
    g.position.set(x, 0.25, z);
    scene.add(g);
  };

  const createLampPost = (x: number, z: number) => {
    const g = new THREE.Group();
    const poleMat = stdMat(0x334155, 0.35, 0.85);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 6.2, 8), poleMat);
    pole.position.y = 3.1;
    pole.castShadow = true;

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.16), poleMat);
    arm.position.set(0.55, 6.1, 0);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });
    lampBulbs.push(bulbMat);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 10), bulbMat);
    bulb.position.set(1.15, 5.9, 0);

    g.add(pole, arm, bulb);
    g.position.set(x, 0.22, z);
    scene.add(g);
  };

  const createZoneRing = (x: number, z: number, color: number, kind: ZoneKind, title: string) => {
    const outer = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.6, 36),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    );
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(x, 0.28, z);
    scene.add(outer);

    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, side: THREE.DoubleSide }),
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.set(x, 0.26, z);
    scene.add(inner);

    zoneRings.push({ x, z, color, kind, title, mesh: outer, innerMesh: inner });
  };

  const createRoofHouse = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    roofColor: number,
    wallColor = 0xf3e5d0,
  ) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stdMat(wallColor, 0.8, 0.05));
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.56, 4),
      stdMat(roofColor, 0.65, 0.1),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = h + h * 0.27;
    roof.castShadow = true;

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.25), stdMat(0x78350f, 0.75, 0.1));
    door.position.set(0, 1.4, d / 2 + 0.06);

    const winMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0xfde047,
      emissiveIntensity: 0.15,
      roughness: 0.2,
      metalness: 0.3,
    });
    windowEmissives.push(winMat);
    const winL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.22), winMat);
    winL.position.set(-w * 0.28, h * 0.55, d / 2 + 0.06);
    const winR = winL.clone();
    winR.position.x = w * 0.28;

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 1.1), stdMat(0x9a3412, 0.85, 0.05));
    chimney.position.set(w * 0.25, h + h * 0.3, -d * 0.2);
    chimney.castShadow = true;

    g.add(body, roof, door, winL, winR, chimney);
    g.position.set(x, 0.22, z);
    scene.add(g);
    return g;
  };

  const createTower = (x: number, z: number, h: number, w = 10, isGig = false) => {
    const g = new THREE.Group();
    const towerMat = new THREE.MeshPhysicalMaterial({
      color: isGig ? 0xfef3c7 : 0xffffff,
      map: winTex,
      roughness: isGig ? 0.18 : 0.32,
      metalness: isGig ? 0.65 : 0.3,
      clearcoat: isGig ? 0.9 : 0.4,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), towerMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;

    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.8, 1.4, w + 0.8),
      stdMat(isGig ? 0xf59e0b : 0x1e293b, 0.3, 0.8),
    );
    crown.position.y = h + 0.7;

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.5, isGig ? 8 : 4, 8),
      stdMat(isGig ? 0xfbbf24 : 0x64748b, 0.25, 0.9),
    );
    spire.position.y = h + (isGig ? 5 : 3);

    g.add(body, crown, spire);
    g.position.set(x, 0.22, z);
    scene.add(g);
  };

  // Special Landmarks
  let phonePoint: WorldPoint = { x: 0, z: 0 };
  let hubPoint: WorldPoint = { x: 0, z: 0 };
  let gigPoint: WorldPoint = { x: 0, z: 0 };
  let homePoint: WorldPoint = { x: 0, z: 0 };

  const roofPalette = [0xdc2626, 0xea580c, 0x7c3aed, 0x0d9488, 0x2563eb, 0xdb2777];
  const districtNames = ['الحي الغربي', 'حي النخيل', 'وسط المدينة', 'الحي الراقي', 'الحي الشرقي'];

  // Home dynamic builder
  let homeGroup = new THREE.Group();
  let homeBodyMesh = new THREE.Mesh();
  let homeRoofMesh = new THREE.Mesh();
  let homeBalcony = new THREE.Group();
  let homeGoldTrim = new THREE.Mesh();

  const buildHome = (cx: number, cz: number) => {
    homePoint = { x: cx, z: cz + 17 };
    homeGroup = new THREE.Group();

    homeBodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(12, 7, 10),
      stdMat(0xf3e5d0, 0.75, 0.05),
    );
    homeBodyMesh.position.y = 3.5;
    homeBodyMesh.castShadow = true;
    homeBodyMesh.receiveShadow = true;

    homeRoofMesh = new THREE.Mesh(
      new THREE.ConeGeometry(9.6, 4.2, 4),
      stdMat(0xea580c, 0.65, 0.1),
    );
    homeRoofMesh.rotation.y = Math.PI / 4;
    homeRoofMesh.position.y = 9.1;
    homeRoofMesh.castShadow = true;

    const porch = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.5, 3), stdMat(0x94a3b8, 0.8, 0.1));
    porch.position.set(0, 0.25, 6);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, 0.3), stdMat(0x78350f, 0.6, 0.1));
    door.position.set(0, 1.9, 5.1);

    homeBalcony = new THREE.Group();
    const balcFloor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 2.4), stdMat(0x475569, 0.5, 0.4));
    balcFloor.position.set(0, 8, 5.8);
    const balcRail = new THREE.Mesh(new THREE.BoxGeometry(8, 1.0, 0.2), stdMat(0xfbbf24, 0.3, 0.8));
    balcRail.position.set(0, 8.7, 6.9);
    homeBalcony.add(balcFloor, balcRail);
    homeBalcony.visible = false;

    homeGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.7, 10.6), stdMat(0xfbbf24, 0.25, 0.9));
    homeGoldTrim.position.y = 7.2;
    homeGoldTrim.visible = false;

    homeGroup.add(homeBodyMesh, homeRoofMesh, porch, door, homeBalcony, homeGoldTrim);
    homeGroup.position.set(cx, 0.22, cz);
    scene.add(homeGroup);

    const { sprite, texture } = makeSignSprite('🏠 بيتك', '#1e1b4b', '#fbbf24', '#f59e0b', maxAniso);
    textures.push(texture);
    sprite.position.set(cx, 17, cz);
    sprite.scale.set(14, 3.5, 1);
    scene.add(sprite);

    colliders.push({ x: cx, z: cz, w: 12, d: 10 });
    createZoneRing(cx - 5, cz + 17, 0xef4444, 'home_manage', 'إدارة وتطوير البيت');
    createZoneRing(cx + 5, cz + 17, 0x3b82f6, 'home_start', 'بدء اليوم');
  };

  const buildPizzaShop = (cx: number, cz: number) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 14), stdMat(0xf5deb3, 0.78, 0.05));
    base.position.y = 4;
    base.castShadow = true;
    base.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(23, 1.2, 15), stdMat(0xb91c1c, 0.55, 0.15));
    roof.position.y = 8.6;
    roof.castShadow = true;
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(9, 4, 0.4),
      stdMat(0x7dd3fc, 0.15, 0.3, { emissive: 0xfef08a, emissiveIntensity: 0.25 }),
    );
    glass.position.set(0, 3.8, 7.1);
    g.add(base, roof, glass);

    for (let idx = 0; idx < 5; idx++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.35, 3.2),
        stdMat(idx % 2 === 0 ? 0xdc2626 : 0xffffff, 0.6, 0.05),
      );
      stripe.position.set(-8 + idx * 4, 6.2, 8.3);
      g.add(stripe);
    }

    const slice = new THREE.Mesh(new THREE.ConeGeometry(2.8, 0.7, 3), stdMat(0xfbbf24, 0.45, 0.2));
    slice.rotation.x = Math.PI / 2;
    slice.position.set(0, 11.4, 0);
    g.add(slice);

    g.position.set(cx, 0.22, cz);
    scene.add(g);

    const { sprite, texture } = makeSignSprite("🍕 Terry's Pizza", '#991b1b', '#fef08a', '#fbbf24', maxAniso);
    textures.push(texture);
    sprite.position.set(cx, 15.5, cz);
    sprite.scale.set(17, 4.2, 1);
    scene.add(sprite);

    colliders.push({ x: cx, z: cz, w: 22, d: 14 });
    pizzas.push({ x: cx, z: cz + 17 });
    createZoneRing(cx, cz + 17, 0xfacc15, 'pizza', 'استلام البيتزا');
  };

  const buildPhoneShop = (cx: number, cz: number) => {
    phonePoint = { x: cx, z: cz + 17 };
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(11, 5.5, 8.5), stdMat(0x0f766e, 0.45, 0.25));
    body.position.y = 2.75;
    body.castShadow = true;
    body.receiveShadow = true;

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(12, 0.65, 3.8), stdMat(0xfacc15, 0.4, 0.3));
    canopy.position.set(0, 5.4, 4.2);

    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 2.4, 0.35),
      stdMat(0x67e8f9, 0.1, 0.4, { emissive: 0x22d3ee, emissiveIntensity: 0.3 }),
    );
    windowMesh.position.set(0, 2.8, 4.3);

    const megaPhone = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.4, 0.45), stdMat(0x0f172a, 0.25, 0.8));
    megaPhone.position.set(0, 8.2, 0);
    const megaScreen = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 3.6, 0.5),
      stdMat(0x38bdf8, 0.15, 0.2, { emissive: 0x0ea5e9, emissiveIntensity: 0.4 }),
    );
    megaScreen.position.set(0, 8.2, 0.05);

    g.add(body, canopy, windowMesh, megaPhone, megaScreen);
    g.position.set(cx, 0.22, cz);
    scene.add(g);

    const { sprite, texture } = makeSignSprite('📱 متجر الهواتف', '#0f172a', '#67e8f9', '#06b6d4', maxAniso);
    textures.push(texture);
    sprite.position.set(cx, 12.8, cz);
    sprite.scale.set(15, 3.7, 1);
    scene.add(sprite);

    colliders.push({ x: cx, z: cz, w: 11, d: 8.5 });
    createZoneRing(phonePoint.x, phonePoint.z, 0x22d3ee, 'phone', 'متجر الهواتف');
  };

  const buildParcelHub = (cx: number, cz: number) => {
    hubPoint = { x: cx, z: cz + 17 };
    const g = new THREE.Group();
    const warehouse = new THREE.Mesh(new THREE.BoxGeometry(19, 9.5, 11.5), stdMat(0x1d4ed8, 0.55, 0.25));
    warehouse.position.y = 4.75;
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;

    const roof = new THREE.Mesh(new THREE.BoxGeometry(20, 1.1, 12.5), stdMat(0xf1f5f9, 0.5, 0.2));
    roof.position.y = 9.9;

    const dockDoor = new THREE.Mesh(new THREE.BoxGeometry(7, 4.5, 0.4), stdMat(0x334155, 0.5, 0.6));
    dockDoor.position.set(0, 2.25, 5.8);

    // Decorative parcel crates beside dock
    const crateMat = stdMat(0xd97706, 0.8, 0.05);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), crateMat);
    c1.position.set(-6.5, 0.9, 6.8);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), crateMat);
    c2.position.set(-4.6, 0.75, 6.8);

    g.add(warehouse, roof, dockDoor, c1, c2);
    g.position.set(cx, 0.22, cz);
    scene.add(g);

    const { sprite, texture } = makeSignSprite('📦 مركز الطرود', '#1e3a8a', '#ffffff', '#60a5fa', maxAniso);
    textures.push(texture);
    sprite.position.set(cx, 14.5, cz);
    sprite.scale.set(16, 4, 1);
    scene.add(sprite);

    colliders.push({ x: cx, z: cz, w: 19, d: 11.5 });
    createZoneRing(hubPoint.x, hubPoint.z, 0xfacc15, 'hub', 'مركز الطرود');
  };

  const buildGigHq = (cx: number, cz: number) => {
    gigPoint = { x: cx, z: cz + 17 };
    createTower(cx, cz, 56, 14, true);

    const { sprite, texture } = makeSignSprite('🏢 GIG COMPANY', '#0f172a', '#fbbf24', '#f59e0b', maxAniso);
    textures.push(texture);
    sprite.position.set(cx, 66, cz);
    sprite.scale.set(22, 5.5, 1);
    scene.add(sprite);

    colliders.push({ x: cx, z: cz, w: 14, d: 14 });
    createZoneRing(gigPoint.x, gigPoint.z, 0xfbbf24, 'gig', 'مقر GIG Company');
  };

  const buildPark = (cx: number, cz: number) => {
    addBox(26, 0.08, 3, cx, 0.36, cz, stdMat(0xe7d3a1, 0.88, 0.0), false, true);
    addBox(3, 0.08, 26, cx, 0.36, cz, stdMat(0xe7d3a1, 0.88, 0.0), false, true);

    // Fountain
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 4.1, 1.1, 20),
      stdMat(0xcbd5e1, 0.45, 0.2),
    );
    basin.position.set(cx, 0.78, cz);
    basin.castShadow = true;
    scene.add(basin);

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 1.18, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.1, clearcoat: 1 }),
    );
    water.position.set(cx, 0.82, cz);
    scene.add(water);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.2, 24),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cx, 1.44, cz);
    scene.add(ring);
    fountainRings.push(ring);

    [
      [-9, -9],
      [-9, 9],
      [9, -9],
      [-10, 1],
      [10, -3],
      [4, -10],
    ].forEach(([tx, tz]) => createTree(cx + tx, cz + tz, 0.9 + Math.random() * 0.25));

    createLampPost(cx - 12, cz + 12);
    createLampPost(cx + 12, cz - 12);
  };

  const buildApartments = (cx: number, cz: number, district: string) => {
    [-8, 8].forEach((offset) => {
      const g = new THREE.Group();
      const aptMat = stdMat(0xffffff, 0.7, 0.1, { map: aptTex });
      const b = new THREE.Mesh(new THREE.BoxGeometry(10, 16, 24), aptMat);
      b.position.y = 8;
      b.castShadow = true;
      b.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.9, 24.6), stdMat(0xb45309, 0.65, 0.1));
      cap.position.y = 16.45;
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.3), stdMat(0x78350f, 0.7, 0.1));
      door.position.set(0, 1.4, 12.1);
      g.add(b, cap, door);
      g.position.set(cx + offset, 0.22, cz);
      scene.add(g);

      colliders.push({ x: cx + offset, z: cz, w: 10, d: 24 });
      const id = houses.length + 1;
      houses.push({ x: cx + offset, z: cz, id, label: `شقق #${id}`, district });
    });

    addBox(6, 10, 6, cx, 5.2, cz, stdMat(0xd6c3a0, 0.8, 0.05));
    colliders.push({ x: cx, z: cz, w: 6, d: 6 });

    const { sprite, texture } = makeSignSprite('🏢 شقق سكنية', '#1e293b', '#fde68a', '#f59e0b', maxAniso);
    textures.push(texture);
    sprite.position.set(cx, 21, cz);
    sprite.scale.set(12, 3, 1);
    scene.add(sprite);
  };

  // Build 5x5 city blocks
  const sidewalkMat = stdMat(0xb4b9c2, 0.88, 0.05);
  const blockGrassMat = stdMat(0x6fd152, 0.9, 0.0);

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const cx = (i - 2) * 40;
      const cz = (j - 2) * 40;
      const key = `${i}${j}`;
      const district = districtNames[i];

      addBox(32, 0.24, 32, cx, 0.14, cz, sidewalkMat, false, true);
      addBox(28, 0.28, 28, cx, 0.18, cz, blockGrassMat, false, true);

      if (key === '11') {
        buildPhoneShop(cx, cz);
        continue;
      }
      if (key === '31') {
        buildParcelHub(cx, cz);
        continue;
      }
      if (key === '33') {
        buildGigHq(cx, cz);
        continue;
      }
      if (key === '13') {
        buildHome(cx, cz);
        continue;
      }
      if (key === '22' || key === '02' || key === '42') {
        buildPark(cx, cz);
        continue;
      }
      if (key === '21' || key === '43') {
        buildPizzaShop(cx, cz);
        continue;
      }
      if ((i + j) % 3 === 0 && i < 2) {
        buildApartments(cx, cz, district);
        continue;
      }
      if ((i + j) % 3 === 0) {
        [
          [-8, -8],
          [8, -8],
          [-8, 8],
          [8, 8],
        ].forEach(([ox, oz]) => {
          createTower(cx + ox, cz + oz, 22 + Math.abs((i * 7 + j * 11 + ox) % 16), 10);
          colliders.push({ x: cx + ox, z: cz + oz, w: 10, d: 10 });
          const id = houses.length + 1;
          houses.push({ x: cx + ox, z: cz + oz, id, label: `برج #${id}`, district });
        });
        createLampPost(cx, cz + 14);
        continue;
      }

      [
        [-7.5, -7.5],
        [7.5, -7.5],
        [-7.5, 7.5],
        [7.5, 7.5],
      ].forEach(([ox, oz], idx) => {
        createRoofHouse(cx + ox, cz + oz, 9, 6, 9, roofPalette[(i * 3 + j * 5 + idx) % roofPalette.length]);
        colliders.push({ x: cx + ox, z: cz + oz, w: 9, d: 9 });
        const id = houses.length + 1;
        houses.push({ x: cx + ox, z: cz + oz, id, label: `منزل #${id}`, district });
      });
    }
  }

  // Natural perimeter tree groves around the city edge
  for (let a = -125; a <= 125; a += 16) {
    createTree(-124, a, 1.1);
    createTree(124, a, 1.1);
    createTree(a, -124, 1.1);
    createTree(a, 124, 1.1);
  }

  // Home Level Skin Controller
  const homeController = {
    updateLevel: (level: number, owned: boolean) => {
      const s = 1 + 0.35 * (level - 1);
      homeBodyMesh.scale.set(1, s, 1);
      homeBodyMesh.position.y = 3.5 * s;
      homeRoofMesh.position.y = 7 * s + 2.1;
      const bodyColors = [0xf3e5d0, 0xfde68a, 0xbbf7d0, 0xbae6fd, 0xfef08a];
      (homeBodyMesh.material as THREE.MeshStandardMaterial).color.setHex(bodyColors[level - 1] ?? 0xf3e5d0);
      homeBalcony.visible = owned && level >= 3;
      homeGoldTrim.visible = owned && level >= 5;
      homeGoldTrim.position.y = 7 * s + 0.2;
    },
  };

  // Build Composite 12+ Part Courier Hero
  const buildCourier = (): CourierRig => {
    const root = new THREE.Group();
    const bodyPivot = new THREE.Group();
    root.add(bodyPivot);

    const makePart = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      color: number,
      parent: THREE.Object3D,
      rough = 0.65,
      metal = 0.08,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stdMat(color, rough, metal));
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    };

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.45, 1.7, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.45, 1.7, 0);
    bodyPivot.add(leftLeg, rightLeg);

    [leftLeg, rightLeg].forEach((leg) => {
      makePart(0.8, 1.6, 0.85, 0, -0.8, 0, 0x1e293b, leg, 0.8, 0.05);
      makePart(0.9, 0.4, 1.25, 0, -1.5, 0.18, 0xf8fafc, leg, 0.5, 0.15);
    });

    // Torso, backpack, head, cap
    makePart(2.1, 1.9, 1.25, 0, 2.65, 0, 0x0d9488, bodyPivot, 0.65, 0.08);
    makePart(2.0, 2.1, 1.0, 0, 2.75, -1.05, 0xf97316, bodyPivot, 0.45, 0.15);
    makePart(1.55, 1.55, 1.45, 0, 4.25, 0, 0xf1c9a0, bodyPivot, 0.75, 0.02);
    makePart(0.22, 0.28, 0.12, -0.38, 4.35, 0.74, 0x0f172a, bodyPivot);
    makePart(0.22, 0.28, 0.12, 0.38, 4.35, 0.74, 0x0f172a, bodyPivot);
    makePart(1.75, 0.75, 1.65, 0, 5.15, 0, 0xf59e0b, bodyPivot, 0.45, 0.1);
    makePart(1.4, 0.18, 0.9, 0, 4.9, 1.05, 0xf59e0b, bodyPivot, 0.45, 0.1);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-1.35, 3.2, 0);
    makePart(0.58, 1.35, 0.58, 0, -0.45, 0.35, 0x0d9488, leftArm).rotation.x = -0.85;
    bodyPivot.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(1.35, 3.2, 0);
    makePart(0.58, 1.35, 0.58, 0, -0.4, 0.35, 0x0d9488, rightArm).rotation.x = -1.1;
    makePart(0.42, 0.72, 0.08, 0, -0.25, 1.05, 0x22d3ee, rightArm, 0.2, 0.6);
    bodyPivot.add(rightArm);

    // Carried Props
    const pizzaProp = new THREE.Group();
    makePart(2.0, 0.28, 1.8, -0.2, 2.35, 1.35, 0xfef3c7, pizzaProp, 0.7, 0.05);
    makePart(0.7, 0.06, 0.7, -0.2, 2.52, 1.35, 0xdc2626, pizzaProp);
    pizzaProp.visible = false;
    bodyPivot.add(pizzaProp);

    const parcelProp = new THREE.Group();
    makePart(1.45, 1.15, 1.35, -0.2, 2.6, 1.35, 0xd97706, parcelProp, 0.85, 0.02);
    makePart(1.48, 0.2, 0.24, -0.2, 2.6, 1.35, 0xfef08a, parcelProp);
    parcelProp.visible = false;
    bodyPivot.add(parcelProp);

    const vipProp = new THREE.Group();
    makePart(1.5, 1.05, 0.5, -0.2, 2.5, 1.3, 0x1e293b, vipProp, 0.25, 0.85);
    makePart(0.5, 0.16, 0.55, -0.2, 2.5, 1.3, 0xfbbf24, vipProp, 0.2, 0.9);
    vipProp.visible = false;
    bodyPivot.add(vipProp);

    // Hoverboard attachment
    const hoverboard = new THREE.Group();
    makePart(1.3, 0.22, 3.2, 0, 0.35, 0, 0x06b6d4, hoverboard, 0.25, 0.7);
    makePart(0.9, 0.14, 0.7, 0, 0.2, 1.2, 0x22d3ee, hoverboard);
    makePart(0.9, 0.14, 0.7, 0, 0.2, -1.2, 0x22d3ee, hoverboard);
    hoverboard.visible = false;
    root.add(hoverboard);

    // Delivery Scooter attachment
    const scooter = new THREE.Group();
    makePart(1.1, 0.45, 3.4, 0, 0.65, 0, 0xef4444, scooter, 0.25, 0.6);
    makePart(0.9, 1.6, 0.55, 0, 1.45, 1.2, 0xf8fafc, scooter, 0.3, 0.4);
    makePart(1.7, 0.18, 0.22, 0, 2.25, 1.15, 0x1e293b, scooter, 0.3, 0.8);
    makePart(1.2, 1.1, 1.2, 0, 1.45, -1.25, 0xf59e0b, scooter, 0.45, 0.2);
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 12);
    const wheelMat = stdMat(0x0f172a, 0.85, 0.1);
    const wFront = new THREE.Mesh(wheelGeo, wheelMat);
    wFront.rotation.z = Math.PI / 2;
    wFront.position.set(0, 0.48, 1.25);
    const wBack = wFront.clone();
    wBack.position.z = -1.25;
    const headLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    );
    headLamp.position.set(0, 1.9, 1.5);
    const scooterLight = new THREE.SpotLight(0xfef08a, 0, 26, Math.PI / 5, 0.5, 1.5);
    scooterLight.position.set(0, 2.0, 1.5);
    scooterLight.target.position.set(0, 0, 12);
    scooter.add(wFront, wBack, headLamp, scooterLight, scooterLight.target);
    scooter.visible = false;
    root.add(scooter);

    // Contact shadow plane grounded under player
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.75 }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.25;
    root.add(contactShadow);

    root.position.set(0, 0.22, 20);
    scene.add(root);

    return {
      root,
      bodyPivot,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      pizzaProp,
      parcelProp,
      vipProp,
      hoverboard,
      scooter,
      scooterLight,
      contactShadow,
    };
  };

  const courier = buildCourier();

  // Traffic Cars Pool (16 composite vehicles)
  const carColors = [0xef4444, 0x8b5cf6, 0xfacc15, 0xf8fafc, 0x06b6d4, 0xf97316];
  const cars: CarActor[] = [];
  for (let n = 0; n < 16; n++) {
    const g = new THREE.Group();
    const paint = new THREE.MeshPhysicalMaterial({
      color: carColors[n % carColors.length],
      roughness: 0.35,
      metalness: 0.55,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 4.5), paint);
    body.position.y = 0.85;
    body.castShadow = true;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 2.2), stdMat(0x1e293b, 0.2, 0.4));
    cabin.position.set(0, 1.72, -0.2);
    cabin.castShadow = true;

    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10);
    const wheelMat = stdMat(0x111827, 0.85, 0.1);
    [
      [-1.15, 0.42, 1.35],
      [1.15, 0.42, 1.35],
      [-1.15, 0.42, -1.35],
      [1.15, 0.42, -1.35],
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      g.add(w);
    });

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.12), hlMat);
    hlL.position.set(-0.7, 0.85, 2.26);
    const hlR = hlL.clone();
    hlR.position.x = 0.7;

    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.12), tlMat);
    tlL.position.set(-0.7, 0.85, -2.26);
    const tlR = tlL.clone();
    tlR.position.x = 0.7;

    g.add(body, cabin, hlL, hlR, tlL, tlR);
    scene.add(g);

    cars.push({
      group: g,
      headlights: hlMat,
      road: ROAD_COORDS[n % ROAD_COORDS.length],
      dir: n % 2 === 0 ? 1 : -1,
      horiz: n % 4 < 2,
      baseSpeed: 9 + (n % 5) * 1.8,
      t: -96 + ((n * 23) % 192),
      honkCooldown: 0,
    });
  }

  // Pedestrian NPCs
  const pedestrians: PedestrianActor[] = [];
  const npcColors = [0x3b82f6, 0xec4899, 0xf59e0b, 0x8b5cf6, 0x10b981];
  for (let n = 0; n < 12; n++) {
    const g = new THREE.Group();
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.25, 0.6), stdMat(npcColors[n % npcColors.length], 0.75, 0.05));
    shirt.position.y = 1.65;
    shirt.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), stdMat(0xf1c9a0, 0.75, 0.02));
    head.position.y = 2.68;
    head.castShadow = true;

    const legGeo = new THREE.BoxGeometry(0.35, 1.0, 0.45);
    const legMat = stdMat(0x1e293b, 0.8, 0.05);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.24, 0.5, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.24, 0.5, 0);

    g.add(shirt, head, leftLeg, rightLeg);
    scene.add(g);

    pedestrians.push({
      group: g,
      leftLeg,
      rightLeg,
      axis: ROAD_COORDS[n % ROAD_COORDS.length] + (n % 2 === 0 ? 5.6 : -5.6),
      dir: n % 3 === 0 ? 1 : -1,
      horiz: n % 2 === 0,
      t: -92 + n * 16,
      speed: 3.4 + (n % 3) * 0.7,
    });
  }

  // Dogs Pool (8 composite dogs placed around parks & streets — chase hot pizza in Lv.2+!)
  const dogSpawns: WorldPoint[] = [
    { x: 0, z: 0 },
    { x: -80, z: 0 },
    { x: 80, z: 0 },
    { x: 0, z: -40 },
    { x: 80, z: 40 },
    { x: -40, z: 40 },
    { x: 40, z: -40 },
    { x: -40, z: -40 },
  ];
  const dogs: DogActor[] = dogSpawns.map((sp, idx) => {
    const g = new THREE.Group();
    const furColor = idx % 2 === 0 ? 0xb45309 : 0x78350f;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 1.65), stdMat(furColor, 0.85, 0.02));
    body.position.set(0, 0.85, 0);
    body.castShadow = true;

    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.25, 0.3), stdMat(0xef4444, 0.5, 0.2));
    collar.position.set(0, 1.0, 0.65);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.68, 0.72), stdMat(furColor, 0.85, 0.02));
    head.position.set(0, 1.35, 0.9);
    head.castShadow = true;

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.42), stdMat(0x451a03, 0.7, 0.05));
    snout.position.set(0, 1.24, 1.35);

    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.25), stdMat(0x451a03, 0.85, 0.02));
    earL.position.set(-0.4, 1.35, 0.85);
    const earR = earL.clone();
    earR.position.x = 0.4;

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), stdMat(furColor, 0.85, 0.02));
    tail.position.set(0, 1.3, -0.88);
    tail.rotation.x = -0.5;

    const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.24);
    const legMat = stdMat(furColor, 0.85, 0.02);
    const legs: THREE.Mesh[] = [];
    [
      [-0.28, 0.32, 0.55],
      [0.28, 0.32, 0.55],
      [-0.28, 0.32, -0.55],
      [0.28, 0.32, -0.55],
    ].forEach(([lx, ly, lz]) => {
      const lm = new THREE.Mesh(legGeo, legMat);
      lm.position.set(lx, ly, lz);
      g.add(lm);
      legs.push(lm);
    });

    g.add(body, collar, head, snout, earL, earR, tail);
    g.position.set(sp.x, 0.22, sp.z);
    scene.add(g);

    return {
      group: g,
      tail,
      legs,
      homeX: sp.x,
      homeZ: sp.z,
      angle: idx * 1.1,
      chasing: false,
      barkCooldown: 0,
    };
  });

  // Collectible Coins & Energy Espresso scattered at parks & crosswalks
  const collectiblePoints: Array<{ x: number; z: number; kind: 'coin' | 'energy' }> = [
    { x: 0, z: 12, kind: 'coin' },
    { x: -20, z: 20, kind: 'energy' },
    { x: 20, z: -20, kind: 'coin' },
    { x: -60, z: -20, kind: 'coin' },
    { x: 60, z: 20, kind: 'energy' },
    { x: -80, z: 12, kind: 'coin' },
    { x: 80, z: -12, kind: 'coin' },
    { x: -20, z: -60, kind: 'energy' },
    { x: 20, z: 60, kind: 'coin' },
    { x: 60, z: -60, kind: 'coin' },
    { x: -60, z: 60, kind: 'coin' },
    { x: 0, z: -80, kind: 'energy' },
    { x: 100, z: 20, kind: 'coin' },
    { x: -100, z: -20, kind: 'coin' },
  ];

  const coinMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    metalness: 0.92,
    roughness: 0.16,
    clearcoat: 0.8,
  });
  const energyMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.5,
  });

  const collectibles: CollectibleItem[] = collectiblePoints.map((pt) => {
    const g = new THREE.Group();
    if (pt.kind === 'coin') {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.22, 16), coinMat);
      disc.rotation.x = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 8, 18), coinMat);
      g.add(disc, rim);
    } else {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.45, 1.25, 12), energyMat);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.2, 12), stdMat(0xf8fafc, 0.3, 0.2));
      lid.position.y = 0.7;
      g.add(cup, lid);
    }
    g.position.set(pt.x, 1.6, pt.z);
    scene.add(g);
    return { group: g, kind: pt.kind, active: true, respawnTimer: 0, x: pt.x, z: pt.z };
  });

  // Objective 3D Beacon
  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 42, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 21;
  const ringMarker = new THREE.Mesh(
    new THREE.RingGeometry(3.1, 4.1, 32),
    new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ringMarker.rotation.x = -Math.PI / 2;
  ringMarker.position.y = 0.32;
  beacon.add(beam, ringMarker);
  beacon.visible = false;
  scene.add(beacon);

  const dispose = () => {
    textures.forEach((t) => t.dispose());
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  };

  return {
    colliders,
    houses,
    zoneRings,
    pizzas,
    hubPoint,
    phonePoint,
    gigPoint,
    homePoint,
    homeController,
    courier,
    cars,
    pedestrians,
    dogs,
    collectibles,
    beacon,
    fountainRings,
    lampBulbs,
    windowEmissives,
    hemiLight,
    sunLight,
    rimLight,
    textures,
    dispose,
  };
}
