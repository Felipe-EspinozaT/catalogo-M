/**
 * Maqueta 3D — Complemento offline con Three.js (Fases 1 a 4)
 * Estilo clay / plástico mate con iluminación de estudio suave, 1 unidad = 1 mm,
 * generadores paramétricos, bloques estructurales, colisión AABB, cables 3D y persistencia/exportación.
 */

import * as THREE from 'three';
import { OrbitControls } from '/static/vendor/OrbitControls.js';
import { TransformControls } from '/static/vendor/TransformControls.js';
import { STLLoader } from '/static/vendor/loaders/STLLoader.js';
import { GLTFLoader } from '/static/vendor/loaders/GLTFLoader.js';
import { STLExporter } from '/static/vendor/exporters/STLExporter.js';
import { GLTFExporter } from '/static/vendor/exporters/GLTFExporter.js';

const CLAY_PALETTE = [
  '#d8dce3',
  '#2b4157',
  '#1e6b7b',
  '#2c5e3b',
  '#b83b3b',
  '#d9822b',
  '#e0b43b',
  '#3a3f47',
  '#6c5b7b',
  '#f0ece1',
];

const WIRE_COLORS = [
  '#e04f4f',
  '#22262c',
  '#f0c03e',
  '#4ea1ff',
  '#4ec970',
  '#eceff4',
  '#f0883e',
  '#a371f7',
];

const m3dEls = {
  view: document.getElementById('maqueta3DView'),
  btnClose: document.getElementById('btnM3dClose'),
  btnMove: document.getElementById('btnM3dMove'),
  btnRotate: document.getElementById('btnM3dRotate'),
  btnWire: document.getElementById('btnM3dWire'),
  btnRotY: document.getElementById('btnM3dRotY'),
  btnRotX: document.getElementById('btnM3dRotX'),
  snapSelect: document.getElementById('m3dSnapSelect'),
  btnCamIso: document.getElementById('btnM3dCamIso'),
  btnCamTop: document.getElementById('btnM3dCamTop'),
  btnCamFront: document.getElementById('btnM3dCamFront'),
  btnHitbox: document.getElementById('btnM3dHitbox'),
  collisionStatus: document.getElementById('m3dCollisionStatus'),
  btnClear: document.getElementById('btnM3dClear'),
  wireBar: document.getElementById('m3dWireBar'),
  wireColors: document.getElementById('m3dWireColors'),
  wireArch: document.getElementById('m3dWireArch'),
  wireRadius: document.getElementById('m3dWireRadius'),
  wireHint: document.getElementById('m3dWireHint'),
  btnWireCancel: document.getElementById('btnM3dWireCancel'),
  btnTabCatalog: document.getElementById('btnM3dTabCatalog'),
  btnTabStruct: document.getElementById('btnM3dTabStruct'),
  btnTabFiles: document.getElementById('btnM3dTabFiles'),
  panelCatalog: document.getElementById('m3dPanelCatalog'),
  panelStruct: document.getElementById('m3dPanelStruct'),
  panelFiles: document.getElementById('m3dPanelFiles'),
  search: document.getElementById('m3dSearch'),
  catFilter: document.getElementById('m3dCatFilter'),
  catalogList: document.getElementById('m3dCatalogList'),
  btnPresetCar2WD: document.getElementById('btnPresetCar2WD'),
  btnPresetBug: document.getElementById('btnPresetBug'),
  stChassisW: document.getElementById('stChassisW'),
  stChassisD: document.getElementById('stChassisD'),
  stChassisH: document.getElementById('stChassisH'),
  stChassisColor: document.getElementById('stChassisColor'),
  btnAddChassis: document.getElementById('btnAddChassis'),
  stWheelDia: document.getElementById('stWheelDia'),
  stWheelW: document.getElementById('stWheelW'),
  stWheelColor: document.getElementById('stWheelColor'),
  btnAddWheel: document.getElementById('btnAddWheel'),
  stPostDia: document.getElementById('stPostDia'),
  stPostH: document.getElementById('stPostH'),
  btnAddPost: document.getElementById('btnAddPost'),
  stBreadboardSize: document.getElementById('stBreadboardSize'),
  btnAddBreadboard: document.getElementById('btnAddBreadboard'),
  stBoxW: document.getElementById('stBoxW'),
  stBoxD: document.getElementById('stBoxD'),
  stBoxH: document.getElementById('stBoxH'),
  stBoxColor: document.getElementById('stBoxColor'),
  btnAddBox: document.getElementById('btnAddBox'),
  projName: document.getElementById('m3dProjName'),
  btnSaveDb: document.getElementById('btnM3dSaveDb'),
  savedList: document.getElementById('m3dSavedList'),
  importScale: document.getElementById('m3dImportScale'),
  btnUploadModel: document.getElementById('btnM3dUploadModel'),
  libraryList: document.getElementById('m3dLibraryList'),
  btnExportJson: document.getElementById('btnM3dExportJson'),
  btnImportJson: document.getElementById('btnM3dImportJson'),
  btnExportGlb: document.getElementById('btnM3dExportGlb'),
  btnExportStl: document.getElementById('btnM3dExportStl'),
  hiddenModel3dInput: document.getElementById('hiddenModel3dInput'),
  hiddenJsonInput: document.getElementById('hiddenJsonInput'),
  canvasWrap: document.getElementById('m3dCanvasWrap'),
  inspectorEmpty: document.getElementById('m3dInspectorEmpty'),
  inspectorProps: document.getElementById('m3dInspectorProps'),
  selName: document.getElementById('m3dSelName'),
  selDims: document.getElementById('m3dSelDims'),
  selCollision: document.getElementById('m3dSelCollision'),
  posX: document.getElementById('m3dPosX'),
  posY: document.getElementById('m3dPosY'),
  posZ: document.getElementById('m3dPosZ'),
  rotX: document.getElementById('m3dRotX'),
  rotY: document.getElementById('m3dRotY'),
  rotZ: document.getElementById('m3dRotZ'),
  colorSwatches: document.getElementById('m3dColorSwatches'),
  btnDropFloor: document.getElementById('btnM3dDropFloor'),
  btnDuplicate: document.getElementById('btnM3dDuplicate'),
  btnDelete: document.getElementById('btnM3dDelete'),
  sceneCount: document.getElementById('m3dSceneCount'),
  sceneList: document.getElementById('m3dSceneList'),
  wireCount: document.getElementById('m3dWireCount'),
  wireList: document.getElementById('m3dWireList'),
};

const m3dState = {
  initialized: false,
  isOpen: false,
  scene: null,
  camera: null,
  renderer: null,
  orbit: null,
  transform: null,
  raycaster: new THREE.Raycaster(),
  pointerDownPos: null,
  toolMode: 'translate', // 'translate' | 'rotate' | 'wire'
  placedObjects: [], // { uid, name, dims, group, hitbox, colliding, meta }
  wires: [], // { id, fromUid, fromLocal, toUid, toLocal, color, arch, radius, group }
  nextWireId: 1,
  wireColor: '#e04f4f',
  pendingWire: null, // { fromUid, fromLocal, markerMesh }
  selectedUid: null,
  showHitboxes: true,
  snapMm: 5,
  nextUid: 1,
  animFrameId: null,
};

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ==================== Materiales Clay e Iluminación ==================== */

function clayMat(hex, roughness = 0.82, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness,
    metalness,
  });
}

function enableShadows(root) {
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

function defaultHeightForCategory(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('esp32')) return 12;
  if (c.includes('bater')) return 16;
  if (c.includes('distancia')) return 14;
  if (c.includes('servo')) return 28;
  if (c.includes('paso')) return 38;
  if (c.includes('motor')) return 20;
  if (c.includes('driver')) return 16;
  if (c.includes('resistencia')) return 3;
  if (c.includes('regulador')) return 12;
  if (c.includes('básica') || c.includes('discretos')) return 10;
  return 10;
}

function parseDimensions3D(dimStr, categoria = '') {
  const raw = String(dimStr || '').trim();
  const isRound = /ø/i.test(raw);
  const firstVariant = raw.split('/')[0];
  // Colapsar rangos como 25-37 o 150-250 al promedio para no duplicar dimensiones
  const normalized = firstVariant.replace(
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g,
    (_, a, b) => String((Number(a) + Number(b)) / 2)
  );
  const nums = (normalized.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n > 0);

  let w = 30;
  let d = 20;
  let h = defaultHeightForCategory(categoria);

  if (isRound) {
    if (nums.length === 1) {
      w = nums[0];
      d = nums[0];
      h = nums[0];
    } else if (nums.length >= 2) {
      w = nums[0];
      d = nums[0];
      h = nums[1];
    }
  } else if (nums.length >= 3) {
    w = nums[0];
    d = nums[1];
    h = nums[2];
  } else if (nums.length === 2) {
    w = nums[0];
    d = nums[1];
  } else if (nums.length === 1) {
    w = nums[0];
    d = nums[0];
    h = nums[0];
  }

  return {
    w: Math.max(2, w),
    d: Math.max(2, d),
    h: Math.max(2, h),
    rawW: w,
    rawD: d,
    rawH: h,
    isRound,
    rawLabel: raw || `${w} × ${d} × ${h} mm`,
  };
}

function createHitboxWireframe(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const edges = new THREE.EdgesGeometry(geo);
  geo.dispose();
  const mat = new THREE.LineBasicMaterial({
    color: 0x6b768a,
    transparent: true,
    opacity: 0.75,
  });
  const wire = new THREE.LineSegments(edges, mat);
  wire.name = '__hitbox';
  wire.position.set(0, h / 2, 0);
  wire.userData.isHitbox = true;
  wire.raycast = () => {}; // Excluir del raycaster
  return wire;
}

/* ==================== Generadores Paramétricos Estilo Clay ==================== */

function getCategoryColor(cat = '', modelo = '') {
  const c = cat.toLowerCase();
  const m = modelo.toLowerCase();
  if (m.includes('arduino')) return '#1e6b7b';
  if (m.includes('l298n')) return '#b83b3b';
  if (m.includes('amarillo tt')) return '#e0b43b';
  if (c.includes('esp32')) return '#2b4157';
  if (c.includes('bater')) return '#d9822b';
  if (c.includes('distancia')) return '#28527a';
  if (c.includes('servo')) return '#323740';
  if (c.includes('paso')) return '#4a505a';
  if (c.includes('motor')) return '#8f98a6';
  if (c.includes('driver')) return '#2c5e3b';
  if (c.includes('resistencia')) return '#d8c39e';
  if (c.includes('regulador')) return '#2c4d75';
  if (c.includes('básica') || c.includes('discretos')) return '#c24d4d';
  return '#3b5b52';
}

function buildComponentGroup(comp, dims, customColor = null) {
  const group = new THREE.Group();
  const { w, d, h, isRound } = dims;
  const cat = (comp.categoria || '').toLowerCase();
  const mod = (comp.modelo || '').toLowerCase();
  const baseColor = customColor || getCategoryColor(comp.categoria, comp.modelo);
  const primaryMat = clayMat(baseColor);
  const primaryMaterials = [primaryMat];

  const addBox = (bw, bh, bd, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };

  const addCyl = (rt, rb, ch, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, ch, 24), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    group.add(mesh);
    return mesh;
  };

  if (cat.includes('esp32') || mod.includes('arduino')) {
    const pcbH = Math.min(2.2, h * 0.25);
    addBox(w, pcbH, d, primaryMat, 0, pcbH / 2, 0);
    // Blindaje RF o MCU
    const shieldW = mod.includes('arduino') ? w * 0.36 : w * 0.34;
    const shieldD = d * 0.54;
    const shieldH = Math.max(2, h * 0.32);
    const chipMat = mod.includes('arduino') ? clayMat('#22262c', 0.7) : clayMat('#b8c0cc', 0.45, 0.35);
    addBox(shieldW, shieldH, shieldD, chipMat, -w * 0.16, pcbH + shieldH / 2, 0);
    // Conector USB en un extremo
    const usbW = Math.min(11, w * 0.18);
    const usbH = Math.max(3.2, h * 0.45);
    const usbD = Math.min(11, d * 0.42);
    addBox(usbW, usbH, usbD, clayMat('#cfd5de', 0.4, 0.4), w / 2 - usbW / 2 + 0.5, pcbH + usbH / 2, 0);
    // Tiras de pines laterales doradas
    const pinH = Math.max(2, h * 0.42);
    const pinMat = clayMat('#d4af37', 0.45, 0.35);
    addBox(w * 0.78, pinH, 2.2, pinMat, 0, pcbH + pinH / 2, d / 2 - 2);
    addBox(w * 0.78, pinH, 2.2, pinMat, 0, pcbH + pinH / 2, -d / 2 + 2);
  } else if (cat.includes('bater')) {
    if (mod.includes('18650')) {
      // Cilindro acostado a lo largo de X
      const r = d / 2;
      addCyl(r, r, w * 0.96, primaryMat, 0, r, 0, 0, 0, Math.PI / 2);
      addCyl(r * 0.4, r * 0.4, 2, clayMat('#d0d5dd', 0.4, 0.3), w * 0.49, r, 0, 0, 0, Math.PI / 2);
    } else {
      addBox(w, h, d, primaryMat, 0, h / 2, 0);
      addBox(w * 0.7, 0.8, d * 0.65, clayMat('#f0ece1', 0.85), 0, h + 0.4, 0);
      // Cables cortos
      addCyl(1.4, 1.4, 12, clayMat('#d14545'), w / 2 + 5, h * 0.6, -d * 0.18, 0, 0, Math.PI / 2);
      addCyl(1.4, 1.4, 12, clayMat('#22262c'), w / 2 + 5, h * 0.6, d * 0.18, 0, 0, Math.PI / 2);
    }
  } else if (cat.includes('distancia')) {
    if (mod.includes('hc-sr04')) {
      const pcbD = Math.max(2, d * 0.15);
      addBox(w, h, pcbD, primaryMat, 0, h / 2, -d / 2 + pcbD / 2);
      const r = Math.min(h * 0.38, w * 0.18);
      const cylLen = d - pcbD;
      const metal = clayMat('#c5ccd6', 0.45, 0.35);
      addCyl(r, r, cylLen, metal, -w * 0.25, h * 0.52, pcbD / 2, Math.PI / 2, 0, 0);
      addCyl(r, r, cylLen, metal, w * 0.25, h * 0.52, pcbD / 2, Math.PI / 2, 0, 0);
    } else if (isRound) {
      const r = w / 2;
      addCyl(r, r, h * 0.45, clayMat('#242830'), 0, h * 0.225, 0);
      addCyl(r * 0.72, r * 0.72, h * 0.55, primaryMat, 0, h * 0.725, 0);
    } else {
      addBox(w, h, d, primaryMat, 0, h / 2, 0);
      addCyl(Math.min(w, h) * 0.25, Math.min(w, h) * 0.25, 2.5, clayMat('#181a1f', 0.3), 0, h / 2, d / 2 + 1, Math.PI / 2, 0, 0);
    }
  } else if (cat.includes('servo')) {
    const bodyH = h * 0.72;
    addBox(w, bodyH, d, primaryMat, 0, bodyH / 2, 0);
    // Orejas laterales
    addBox(w * 1.28, 2.4, d * 0.9, primaryMat, 0, bodyH * 0.75, 0);
    // Torreta y cuerno blanco
    const gearR = Math.min(w, d) * 0.32;
    addCyl(gearR, gearR, h * 0.2, primaryMat, -w * 0.2, bodyH + h * 0.1, 0);
    addBox(w * 0.55, 2.4, d * 0.38, clayMat('#f0ece1'), -w * 0.12, h - 1.2, 0);
  } else if (cat.includes('paso')) {
    if (isRound) {
      const r = w / 2;
      addCyl(r, r, h * 0.75, clayMat('#c5ccd6', 0.5, 0.3), 0, h * 0.375, 0);
      addBox(w * 1.3, 2, d * 0.4, primaryMat, 0, h * 0.7, 0);
      addCyl(2.5, 2.5, h * 0.25, clayMat('#e5e8ef', 0.4, 0.4), 0, h * 0.875, 0);
    } else {
      const bodyH = h * 0.78;
      addBox(w, bodyH, d, primaryMat, 0, bodyH / 2, 0);
      addBox(w * 0.92, 3, d * 0.92, clayMat('#cfd5de', 0.5, 0.3), 0, bodyH + 1.5, 0);
      addCyl(2.5, 2.5, h * 0.22, clayMat('#e6ebf2', 0.35, 0.5), 0, bodyH + h * 0.11, 0);
    }
  } else if (cat.includes('motor')) {
    if (isRound) {
      const r = d / 2;
      addCyl(r, r, w * 0.82, primaryMat, -w * 0.08, r, 0, 0, 0, Math.PI / 2);
      addCyl(Math.max(1.8, r * 0.18), Math.max(1.8, r * 0.18), w * 0.18, clayMat('#e6ebf2', 0.4, 0.4), w * 0.41, r, 0, 0, 0, Math.PI / 2);
    } else {
      addBox(w * 0.8, h, d, primaryMat, -w * 0.08, h / 2, 0);
      addCyl(2.2, 2.2, w * 0.24, clayMat('#f0ece1'), w * 0.38, h / 2, 0, 0, 0, Math.PI / 2);
      if (mod.includes('tt')) {
        addCyl(2.2, 2.2, d * 1.35, clayMat('#f0ece1'), w * 0.16, h / 2, 0, Math.PI / 2, 0, 0);
      }
    }
  } else if (cat.includes('driver')) {
    const pcbH = Math.min(2.5, h * 0.2);
    addBox(w, pcbH, d, primaryMat, 0, pcbH / 2, 0);
    // Disipador central con aletas
    const hsH = h - pcbH;
    const hsMat = clayMat('#aeb6c2', 0.5, 0.35);
    addBox(w * 0.46, hsH, d * 0.46, hsMat, 0, pcbH + hsH / 2, 0);
    // Borneras laterales
    addBox(w * 0.22, Math.min(8, hsH * 0.6), d * 0.5, clayMat('#2c6fb8'), -w * 0.36, pcbH + Math.min(4, hsH * 0.3), 0);
    addBox(w * 0.22, Math.min(8, hsH * 0.6), d * 0.5, clayMat('#2c6fb8'), w * 0.36, pcbH + Math.min(4, hsH * 0.3), 0);
  } else if (cat.includes('regulador')) {
    const pcbH = 2;
    addBox(w, pcbH, d, primaryMat, 0, pcbH / 2, 0);
    const compH = Math.max(3, h - pcbH);
    addBox(w * 0.28, compH, d * 0.45, clayMat('#2a2e35'), -w * 0.12, pcbH + compH / 2, 0);
    addBox(w * 0.18, compH * 0.85, d * 0.22, clayMat('#2a6eb8'), w * 0.25, pcbH + compH * 0.42, d * 0.22);
    addCyl(Math.min(w, d) * 0.14, Math.min(w, d) * 0.14, compH, clayMat('#2a2e35'), -w * 0.35, pcbH + compH / 2, 0);
  } else if (cat.includes('resistencia')) {
    addCyl(h / 2, h / 2, w * 0.65, primaryMat, 0, h / 2, 0, 0, 0, Math.PI / 2);
    addCyl(0.6, 0.6, w, clayMat('#cfd5de', 0.4, 0.4), 0, h / 2, 0, 0, 0, Math.PI / 2);
  } else if (cat.includes('básica') || cat.includes('discretos')) {
    if (mod.includes('led')) {
      const r = w / 2;
      addCyl(r, r, h * 0.65, primaryMat, 0, h * 0.325, 0);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), primaryMat);
      dome.position.set(0, h * 0.65, 0);
      group.add(dome);
    } else if (mod.includes('potenciómetro')) {
      const r = w / 2;
      addCyl(r, r, h * 0.45, clayMat('#8b93a1', 0.5, 0.3), 0, h * 0.225, 0);
      addCyl(r * 0.45, r * 0.45, h * 0.55, primaryMat, 0, h * 0.725, 0);
    } else if (mod.includes('mosfet') || mod.includes('triac')) {
      addBox(w, h * 0.6, d, clayMat('#25282e'), 0, h * 0.3, 0);
      addBox(w * 0.85, h * 0.4, 1.8, clayMat('#cfd5de', 0.4, 0.4), 0, h * 0.8, -d * 0.3);
    } else if (isRound) {
      const r = w / 2;
      addCyl(r, r, h, primaryMat, 0, h / 2, 0);
    } else {
      addBox(w, h, d, primaryMat, 0, h / 2, 0);
    }
  } else {
    // Otros Sensores y Actuadores
    addBox(w, h * 0.7, d, primaryMat, 0, h * 0.35, 0);
    addBox(w * 0.6, h * 0.3, d * 0.6, clayMat('#1f2329'), 0, h * 0.85, 0);
  }

  enableShadows(group);
  const hitbox = createHitboxWireframe(w, h, d);
  group.add(hitbox);

  return { group, hitbox, primaryMaterials, baseColor };
}

/* ==================== Bloques Estructurales ==================== */

function buildStructureGroup(kind, spec) {
  const group = new THREE.Group();
  const primaryMat = clayMat(spec.color || '#d8dce3');
  const primaryMaterials = [primaryMat];
  let w = spec.w || 40;
  let d = spec.d || 30;
  let h = spec.h || 20;

  if (kind === 'chassis' || kind === 'box') {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), primaryMat);
    mesh.position.set(0, h / 2, 0);
    group.add(mesh);
  } else if (kind === 'wheel') {
    const dia = spec.dia || 65;
    const width = spec.width || 26;
    w = dia;
    h = dia;
    d = width;
    const r = dia / 2;
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 28), primaryMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(0, r, 0);
    group.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.56, r * 0.56, width + 0.8, 20),
      clayMat('#e0b43b')
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, r, 0);
    group.add(rim);
  } else if (kind === 'post') {
    const dia = spec.dia || 6;
    const ph = spec.h || 25;
    w = dia;
    d = dia;
    h = ph;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, ph, 16), primaryMat);
    post.position.set(0, ph / 2, 0);
    group.add(post);
  } else if (kind === 'breadboard') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), primaryMat);
    base.position.set(0, h / 2, 0);
    group.add(base);
    // Canal central y rieles de alimentación
    const groove = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 1, 3), clayMat('#c5c0b4'));
    groove.position.set(0, h + 0.1, 0);
    group.add(groove);
    const railRed = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.6, 1.4), clayMat('#d14545'));
    railRed.position.set(0, h + 0.1, -d * 0.4);
    group.add(railRed);
    const railBlue = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.6, 1.4), clayMat('#3578d4'));
    railBlue.position.set(0, h + 0.1, d * 0.4);
    group.add(railBlue);
  }

  enableShadows(group);
  const hitbox = createHitboxWireframe(w, h, d);
  group.add(hitbox);

  return {
    group,
    hitbox,
    primaryMaterials,
    baseColor: spec.color || '#d8dce3',
    dims: { w, d, h, rawW: w, rawD: d, rawH: h, isRound: kind === 'wheel' || kind === 'post', rawLabel: `${w} × ${d} × ${h} mm` },
  };
}

/* ==================== Inicialización Escena Three.js ==================== */

function initScene() {
  if (m3dState.initialized) return;
  m3dState.initialized = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#252932');

  const rect = m3dEls.canvasWrap.getBoundingClientRect();
  const width = Math.max(300, rect.width || window.innerWidth - 550);
  const height = Math.max(300, rect.height || window.innerHeight - 60);

  const camera = new THREE.PerspectiveCamera(34, width / height, 1, 3000);
  camera.position.set(170, 165, 185);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  m3dEls.canvasWrap.insertBefore(renderer.domElement, m3dEls.canvasWrap.firstChild);

  // Suelo mate y grilla (10 mm por cuadro)
  const floorGeo = new THREE.PlaneGeometry(600, 600);
  const floorMat = clayMat('#2f343f', 0.92, 0.02);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  floor.receiveShadow = true;
  floor.raycast = () => {};
  scene.add(floor);

  const grid = new THREE.GridHelper(400, 40, 0x5c6678, 0x3b4250);
  grid.raycast = () => {};
  scene.add(grid);

  // Iluminación de estudio suave
  const hemiLight = new THREE.HemisphereLight(0xf6f8ff, 0x3a3f4b, 1.2);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.5);
  keyLight.position.set(140, 230, 150);
  keyLight.castShadow = true;
  keyLight.shadow.camera.left = -220;
  keyLight.shadow.camera.right = 220;
  keyLight.shadow.camera.top = 220;
  keyLight.shadow.camera.bottom = -220;
  keyLight.shadow.camera.near = 20;
  keyLight.shadow.camera.far = 700;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc8deff, 0.55);
  fillLight.position.set(-150, 110, -130);
  scene.add(fillLight);

  // Controles de cámara y transformación
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.target.set(0, 10, 0);
  orbit.update();

  const transform = new TransformControls(camera, renderer.domElement);
  transform.setTranslationSnap(m3dState.snapMm || null);
  transform.setRotationSnap(m3dState.snapMm ? THREE.MathUtils.degToRad(15) : null);

  transform.addEventListener('dragging-changed', (e) => {
    orbit.enabled = !e.value;
  });

  transform.addEventListener('objectChange', () => {
    syncInspectorFromSelected();
    updateAllWires();
    updateCollisions();
  });

  scene.add(transform);

  m3dState.scene = scene;
  m3dState.camera = camera;
  m3dState.renderer = renderer;
  m3dState.orbit = orbit;
  m3dState.transform = transform;

  // ResizeObserver
  const ro = new ResizeObserver(() => resizeCanvas());
  ro.observe(m3dEls.canvasWrap);

  // Raycasting para seleccionar piezas o conectar cables
  renderer.domElement.addEventListener('pointerdown', (e) => {
    m3dState.pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!m3dState.pointerDownPos || m3dState.transform.dragging) return;
    const dx = e.clientX - m3dState.pointerDownPos.x;
    const dy = e.clientY - m3dState.pointerDownPos.y;
    m3dState.pointerDownPos = null;
    if (Math.hypot(dx, dy) > 4 || e.button !== 0) return;

    const r = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    m3dState.raycaster.setFromCamera(ndc, camera);
    const roots = m3dState.placedObjects.map((o) => o.group);
    const hits = m3dState.raycaster.intersectObjects(roots, true);

    if (m3dState.toolMode === 'wire') {
      if (hits.length === 0) return;
      let cur = hits[0].object;
      while (cur && cur.userData.m3dUid === undefined) {
        cur = cur.parent;
      }
      if (!cur || cur.userData.m3dUid === undefined) return;
      const entry = m3dState.placedObjects.find((o) => o.uid === cur.userData.m3dUid);
      if (!entry) return;
      handleWireClick(entry, hits[0].point);
      return;
    }

    if (hits.length === 0) {
      selectObject(null);
      return;
    }
    let cur = hits[0].object;
    while (cur && cur.userData.m3dUid === undefined) {
      cur = cur.parent;
    }
    if (cur && cur.userData.m3dUid !== undefined) {
      selectObject(cur.userData.m3dUid);
    }
  });

  renderColorSwatches();
  renderWireColors();
  startRenderLoop();
}

function resizeCanvas() {
  if (!m3dState.renderer || !m3dState.camera) return;
  const rect = m3dEls.canvasWrap.getBoundingClientRect();
  const w = Math.max(100, rect.width);
  const h = Math.max(100, rect.height);
  m3dState.camera.aspect = w / h;
  m3dState.camera.updateProjectionMatrix();
  m3dState.renderer.setSize(w, h);
}

function startRenderLoop() {
  const tick = () => {
    m3dState.animFrameId = requestAnimationFrame(tick);
    if (!m3dState.isOpen) return;
    m3dState.orbit.update();
    m3dState.renderer.render(m3dState.scene, m3dState.camera);
  };
  tick();
}

/* ==================== Gestión de Objetos en Escena ==================== */

function registerObject({ name, dims, group, hitbox, primaryMaterials, baseColor, meta = {} }, pos = { x: 0, y: 0, z: 0 }) {
  const uid = m3dState.nextUid++;
  group.userData.m3dUid = uid;
  group.position.set(pos.x, pos.y, pos.z);
  hitbox.visible = m3dState.showHitboxes;

  m3dState.scene.add(group);
  const entry = {
    uid,
    name,
    dims,
    group,
    hitbox,
    primaryMaterials,
    color: baseColor,
    colliding: false,
    meta,
  };
  m3dState.placedObjects.push(entry);
  selectObject(uid);
  updateCollisions();
  renderSceneList();
  return entry;
}

function addComponentToScene(comp, pos = null) {
  initScene();
  const dims = parseDimensions3D(comp.dimensiones, comp.categoria);
  const built = buildComponentGroup(comp, dims);
  const offset = (m3dState.placedObjects.length % 5) * 12;
  const p = pos || { x: offset - 20, y: 0, z: offset - 20 };
  return registerObject(
    {
      name: comp.modelo,
      dims,
      group: built.group,
      hitbox: built.hitbox,
      primaryMaterials: built.primaryMaterials,
      baseColor: built.baseColor,
      meta: { kind: 'component', comp },
    },
    p
  );
}

function addStructureToScene(kind, name, spec, pos = { x: 0, y: 0, z: 0 }) {
  initScene();
  const built = buildStructureGroup(kind, spec);
  return registerObject(
    {
      name,
      dims: built.dims,
      group: built.group,
      hitbox: built.hitbox,
      primaryMaterials: built.primaryMaterials,
      baseColor: built.baseColor,
      meta: { kind: 'structure', structKind: kind, spec },
    },
    pos
  );
}

function selectObject(uid) {
  m3dState.selectedUid = uid;
  const entry = m3dState.placedObjects.find((o) => o.uid === uid) || null;
  if (entry) {
    if (m3dState.toolMode !== 'wire') {
      m3dState.transform.attach(entry.group);
    }
    m3dEls.inspectorEmpty.classList.add('hidden');
    m3dEls.inspectorProps.classList.remove('hidden');
    m3dEls.selName.textContent = entry.name;
    m3dEls.selDims.textContent = `Hitbox: ${entry.dims.w.toFixed(1)} × ${entry.dims.d.toFixed(1)} × ${entry.dims.h.toFixed(1)} mm`;
    syncInspectorFromSelected();
  } else {
    m3dState.transform.detach();
    m3dEls.inspectorEmpty.classList.remove('hidden');
    m3dEls.inspectorProps.classList.add('hidden');
  }
  refreshHitboxColors();
  renderSceneList();
}

function syncInspectorFromSelected() {
  const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
  if (!entry) return;
  const { position, rotation } = entry.group;
  m3dEls.posX.value = position.x.toFixed(1);
  m3dEls.posY.value = position.y.toFixed(1);
  m3dEls.posZ.value = position.z.toFixed(1);
  m3dEls.rotX.value = Math.round(THREE.MathUtils.radToDeg(rotation.x));
  m3dEls.rotY.value = Math.round(THREE.MathUtils.radToDeg(rotation.y));
  m3dEls.rotZ.value = Math.round(THREE.MathUtils.radToDeg(rotation.z));
  m3dEls.selCollision.classList.toggle('hidden', !entry.colliding);
}

/* ==================== Colisiones AABB (Hitbox) ==================== */

function computeWorldHitbox(entry) {
  entry.group.updateMatrixWorld(true);
  const { w, h, d } = entry.dims;
  const hw = w / 2;
  const hd = d / 2;
  const corners = [
    new THREE.Vector3(-hw, 0, -hd),
    new THREE.Vector3(hw, 0, -hd),
    new THREE.Vector3(-hw, 0, hd),
    new THREE.Vector3(hw, 0, hd),
    new THREE.Vector3(-hw, h, -hd),
    new THREE.Vector3(hw, h, -hd),
    new THREE.Vector3(-hw, h, hd),
    new THREE.Vector3(hw, h, hd),
  ];
  const box = new THREE.Box3();
  for (const pt of corners) {
    pt.applyMatrix4(entry.group.matrixWorld);
    box.expandByPoint(pt);
  }
  // Margen negativo de 0.15 mm para no dar falso positivo cuando una pieza apoya al ras sobre otra
  box.expandByScalar(-0.15);
  return box;
}

function updateCollisions() {
  const objs = m3dState.placedObjects;
  const boxes = objs.map((o) => ({ entry: o, box: computeWorldHitbox(o) }));
  for (const o of objs) o.colliding = false;

  let pairCount = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxes[i].box.intersectsBox(boxes[j].box)) {
        boxes[i].entry.colliding = true;
        boxes[j].entry.colliding = true;
        pairCount++;
      }
    }
  }

  if (pairCount === 0) {
    m3dEls.collisionStatus.textContent = '✓ Sin colisiones';
    m3dEls.collisionStatus.className = 'm3d-badge-ok';
  } else {
    m3dEls.collisionStatus.textContent = `⚠ ${pairCount} colisión${pairCount === 1 ? '' : 'es'}`;
    m3dEls.collisionStatus.className = 'm3d-badge-warn';
  }

  const sel = objs.find((o) => o.uid === m3dState.selectedUid);
  if (sel) {
    m3dEls.selCollision.classList.toggle('hidden', !sel.colliding);
  }

  refreshHitboxColors();
  renderSceneList();
}

function refreshHitboxColors() {
  for (const entry of m3dState.placedObjects) {
    entry.hitbox.visible = m3dState.showHitboxes || entry.colliding || entry.uid === m3dState.selectedUid;
    if (entry.colliding) {
      entry.hitbox.material.color.setHex(0xff4d4f);
      entry.hitbox.material.opacity = 0.95;
    } else if (entry.uid === m3dState.selectedUid) {
      entry.hitbox.material.color.setHex(0x4ea1ff);
      entry.hitbox.material.opacity = 0.95;
    } else {
      entry.hitbox.material.color.setHex(0x6b768a);
      entry.hitbox.material.opacity = 0.6;
    }
  }
}

/* ==================== UI Catálogo Lateral e Inspector ==================== */

function renderCatalogSidebar() {
  const { componentes = [], categorias = [] } = window.getCatalogData ? window.getCatalogData() : {};

  // Poblar filtro de categorías manteniendo selección
  const prevCat = m3dEls.catFilter.value;
  m3dEls.catFilter.innerHTML =
    '<option value="">Todas las categorías</option>' +
    categorias.map((c) => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
  if (categorias.includes(prevCat)) m3dEls.catFilter.value = prevCat;

  const q = m3dEls.search.value.trim().toLowerCase();
  const cat = m3dEls.catFilter.value;

  const filtered = componentes.filter((c) => {
    if (cat && c.categoria !== cat) return false;
    if (!q) return true;
    return `${c.modelo} ${c.categoria} ${c.dimensiones}`.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    m3dEls.catalogList.innerHTML = '<div class="m3d-empty-msg">Sin coincidencias.</div>';
    return;
  }

  m3dEls.catalogList.innerHTML = filtered
    .map(
      (c) => `
      <button type="button" class="m3d-comp-item" data-add-comp="${c.id}">
        <div class="m3d-comp-name">${escHtml(c.modelo)}</div>
        <div class="m3d-comp-meta">${escHtml(c.categoria)} · ${escHtml(c.dimensiones || 'Sin dim.')}</div>
      </button>`
    )
    .join('');
}

function renderSceneList() {
  m3dEls.sceneCount.textContent = String(m3dState.placedObjects.length);
  if (m3dState.placedObjects.length === 0) {
    m3dEls.sceneList.innerHTML = '<div class="m3d-empty-msg">Escena vacía.</div>';
    return;
  }
  m3dEls.sceneList.innerHTML = m3dState.placedObjects
    .map((o) => {
      const cls = ['m3d-scene-item'];
      if (o.uid === m3dState.selectedUid) cls.push('active');
      if (o.colliding) cls.push('colliding');
      return `
        <button type="button" class="${cls.join(' ')}" data-select-uid="${o.uid}">
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escHtml(o.name)}</span>
          <span>${o.colliding ? '⚠' : ''}</span>
        </button>`;
    })
    .join('');
}

function renderColorSwatches() {
  m3dEls.colorSwatches.innerHTML = CLAY_PALETTE.map(
    (hex) => `<button type="button" class="m3d-swatch" data-color="${hex}" style="background:${hex}" title="${hex}"></button>`
  ).join('');
}

function disposeGroupResources(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

function deleteSelected() {
  const idx = m3dState.placedObjects.findIndex((o) => o.uid === m3dState.selectedUid);
  if (idx === -1) return;
  const [removed] = m3dState.placedObjects.splice(idx, 1);
  removeWiresForUid(removed.uid);
  if (m3dState.pendingWire && m3dState.pendingWire.fromUid === removed.uid) {
    cancelPendingWire();
  }
  m3dState.transform.detach();
  m3dState.scene.remove(removed.group);
  disposeGroupResources(removed.group);
  selectObject(null);
  updateCollisions();
  renderSceneList();
}

function clearScene() {
  cancelPendingWire();
  for (const w of m3dState.wires) {
    m3dState.scene.remove(w.group);
    disposeGroupResources(w.group);
  }
  m3dState.wires = [];
  m3dState.transform.detach();
  for (const obj of m3dState.placedObjects) {
    m3dState.scene.remove(obj.group);
    disposeGroupResources(obj.group);
  }
  m3dState.placedObjects = [];
  selectObject(null);
  updateCollisions();
  renderSceneList();
  renderWireList();
}

function setToolMode(mode) {
  m3dState.toolMode = mode;
  m3dEls.btnMove.classList.toggle('active', mode === 'translate');
  m3dEls.btnRotate.classList.toggle('active', mode === 'rotate');
  m3dEls.btnWire.classList.toggle('active', mode === 'wire');
  m3dEls.wireBar.classList.toggle('hidden', mode !== 'wire');

  if (mode === 'wire') {
    if (m3dState.transform) m3dState.transform.detach();
    m3dEls.wireHint.textContent = 'Clic en componente origen...';
  } else {
    cancelPendingWire();
    if (m3dState.transform) {
      m3dState.transform.setMode(mode);
      const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
      if (entry) m3dState.transform.attach(entry.group);
    }
  }
}

/* ==================== Sistema de Cables Visuales 3D (Fase 3) ==================== */

function renderWireColors() {
  m3dEls.wireColors.innerHTML = WIRE_COLORS.map(
    (hex) =>
      `<button type="button" class="m3d-swatch${hex === m3dState.wireColor ? ' active' : ''}" data-wire-color="${hex}" style="background:${hex}" title="${hex}"></button>`
  ).join('');
}

function cancelPendingWire() {
  if (m3dState.pendingWire) {
    if (m3dState.pendingWire.markerMesh && m3dState.scene) {
      m3dState.scene.remove(m3dState.pendingWire.markerMesh);
      disposeGroupResources(m3dState.pendingWire.markerMesh);
    }
    m3dState.pendingWire = null;
  }
  if (m3dEls.wireHint) {
    m3dEls.wireHint.textContent = 'Clic en componente origen...';
  }
}

function handleWireClick(entry, worldPoint) {
  entry.group.updateMatrixWorld(true);
  const localPt = entry.group.worldToLocal(worldPoint.clone());

  if (!m3dState.pendingWire) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 12, 12),
      clayMat(m3dState.wireColor, 0.5, 0.1)
    );
    marker.position.copy(worldPoint);
    marker.raycast = () => {};
    m3dState.scene.add(marker);
    m3dState.pendingWire = {
      fromUid: entry.uid,
      fromLocal: { x: localPt.x, y: localPt.y, z: localPt.z },
      markerMesh: marker,
    };
    m3dEls.wireHint.textContent = 'Origen fijado · Clic en destino (Esc cancela)';
    return;
  }

  const arch = Math.max(2, Number(m3dEls.wireArch.value) || 22);
  const radius = Math.max(0.3, Number(m3dEls.wireRadius.value) || 0.9);
  addWire({
    fromUid: m3dState.pendingWire.fromUid,
    fromLocal: m3dState.pendingWire.fromLocal,
    toUid: entry.uid,
    toLocal: { x: localPt.x, y: localPt.y, z: localPt.z },
    color: m3dState.wireColor,
    arch,
    radius,
  });
  cancelPendingWire();
}

function addWire({ fromUid, fromLocal, toUid, toLocal, color = '#e04f4f', arch = 22, radius = 0.9 }) {
  const wire = {
    id: m3dState.nextWireId++,
    fromUid,
    fromLocal: { ...fromLocal },
    toUid,
    toLocal: { ...toLocal },
    color,
    arch,
    radius,
    group: new THREE.Group(),
  };
  m3dState.scene.add(wire.group);
  m3dState.wires.push(wire);
  rebuildWireMesh(wire);
  renderWireList();
  return wire;
}

function rebuildWireMesh(wire) {
  const fromEntry = m3dState.placedObjects.find((o) => o.uid === wire.fromUid);
  const toEntry = m3dState.placedObjects.find((o) => o.uid === wire.toUid);

  while (wire.group.children.length > 0) {
    const ch = wire.group.children[0];
    wire.group.remove(ch);
    disposeGroupResources(ch);
  }
  if (!fromEntry || !toEntry) return;

  fromEntry.group.updateMatrixWorld(true);
  toEntry.group.updateMatrixWorld(true);

  const p0 = new THREE.Vector3(wire.fromLocal.x, wire.fromLocal.y, wire.fromLocal.z).applyMatrix4(
    fromEntry.group.matrixWorld
  );
  const p3 = new THREE.Vector3(wire.toLocal.x, wire.toLocal.y, wire.toLocal.z).applyMatrix4(
    toEntry.group.matrixWorld
  );

  const peakY = Math.max(p0.y, p3.y) + wire.arch;
  const p1 = new THREE.Vector3(
    THREE.MathUtils.lerp(p0.x, p3.x, 0.22),
    peakY,
    THREE.MathUtils.lerp(p0.z, p3.z, 0.22)
  );
  const p2 = new THREE.Vector3(
    THREE.MathUtils.lerp(p0.x, p3.x, 0.78),
    peakY,
    THREE.MathUtils.lerp(p0.z, p3.z, 0.78)
  );

  const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
  const tubeGeo = new THREE.TubeGeometry(curve, 28, wire.radius, 10, false);
  const tubeMat = clayMat(wire.color, 0.65, 0.05);
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
  tubeMesh.castShadow = true;
  tubeMesh.receiveShadow = true;
  tubeMesh.raycast = () => {};
  wire.group.add(tubeMesh);

  const capMat = clayMat('#22262c', 0.7, 0.1);
  const capGeo = new THREE.SphereGeometry(wire.radius * 1.65, 10, 10);
  const cap0 = new THREE.Mesh(capGeo, capMat);
  cap0.position.copy(p0);
  cap0.castShadow = true;
  cap0.raycast = () => {};
  const cap1 = new THREE.Mesh(capGeo, capMat);
  cap1.position.copy(p3);
  cap1.castShadow = true;
  cap1.raycast = () => {};
  wire.group.add(cap0, cap1);
}

function updateAllWires() {
  for (const w of m3dState.wires) {
    rebuildWireMesh(w);
  }
}

function removeWiresForUid(uid) {
  const keep = [];
  for (const w of m3dState.wires) {
    if (w.fromUid === uid || w.toUid === uid) {
      m3dState.scene.remove(w.group);
      disposeGroupResources(w.group);
    } else {
      keep.push(w);
    }
  }
  m3dState.wires = keep;
  renderWireList();
}

function deleteWireById(wireId) {
  const idx = m3dState.wires.findIndex((w) => w.id === wireId);
  if (idx === -1) return;
  const [removed] = m3dState.wires.splice(idx, 1);
  m3dState.scene.remove(removed.group);
  disposeGroupResources(removed.group);
  renderWireList();
}

function renderWireList() {
  m3dEls.wireCount.textContent = String(m3dState.wires.length);
  if (m3dState.wires.length === 0) {
    m3dEls.wireList.innerHTML = '<div class="m3d-empty-msg">Sin cables aún.</div>';
    return;
  }
  m3dEls.wireList.innerHTML = m3dState.wires
    .map((w) => {
      const a = m3dState.placedObjects.find((o) => o.uid === w.fromUid);
      const b = m3dState.placedObjects.find((o) => o.uid === w.toUid);
      const label = `${a ? a.name : '?'} → ${b ? b.name : '?'}`;
      return `
        <div class="m3d-wire-item">
          <input type="color" class="m3d-wire-color-input" data-wire-recolor="${w.id}" value="${escHtml(w.color)}" title="Cambiar color" />
          <span class="m3d-item-label" title="${escHtml(label)}">${escHtml(label)}</span>
          <button type="button" class="m3d-mini-btn del" data-wire-del="${w.id}" title="Eliminar cable">&times;</button>
        </div>`;
    })
    .join('');
}

/* ==================== Importación .GLB / .STL (Fase 4) ==================== */

async function loadExternalModelToScene(url, name, ext, scale = 1, pos = { x: 0, y: 0, z: 0 }, color = '#d8dce3') {
  initScene();
  const cleanExt = ext.toLowerCase();
  const group = new THREE.Group();
  const primaryMaterials = [];

  if (cleanExt === '.stl') {
    const loader = new STLLoader();
    const geometry = await loader.loadAsync(url);
    geometry.computeVertexNormals();
    const mat = clayMat(color);
    primaryMaterials.push(mat);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.scale.setScalar(scale);

    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    mesh.position.set(-center.x, -box.min.y, -center.z);
    group.add(mesh);
  } else {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;
    model.scale.setScalar(scale);

    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.set(-center.x, -box.min.y, -center.z);
    model.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) primaryMaterials.push(...obj.material);
        else primaryMaterials.push(obj.material);
      }
    });
    group.add(model);
  }

  enableShadows(group);
  const finalBox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  finalBox.getSize(size);
  const w = Math.max(2, size.x);
  const h = Math.max(2, size.y);
  const d = Math.max(2, size.z);

  const hitbox = createHitboxWireframe(w, h, d);
  group.add(hitbox);

  return registerObject(
    {
      name,
      dims: {
        w,
        d,
        h,
        rawW: w,
        rawD: d,
        rawH: h,
        isRound: false,
        rawLabel: `${w.toFixed(1)} × ${d.toFixed(1)} × ${h.toFixed(1)} mm`,
      },
      group,
      hitbox,
      primaryMaterials,
      baseColor: color,
      meta: { kind: 'external', url, ext: cleanExt, scale },
    },
    pos
  );
}

async function refreshModel3dLibrary() {
  try {
    const res = await fetch('/api/modelos3d');
    if (!res.ok) return;
    const items = await res.json();
    if (items.length === 0) {
      m3dEls.libraryList.innerHTML = '<div class="m3d-empty-msg">Sin modelos subidos.</div>';
      return;
    }
    m3dEls.libraryList.innerHTML = items
      .map(
        (m) => `
        <div class="m3d-lib-item">
          <span class="m3d-item-label" title="${escHtml(m.filename)}">${escHtml(m.filename)}</span>
          <button type="button" class="m3d-mini-btn" data-add-ext-url="${escHtml(m.url)}" data-add-ext-name="${escHtml(m.filename)}" data-add-ext-type="${escHtml(m.ext)}">+ Insertar</button>
        </div>`
      )
      .join('');
  } catch (_) {}
}

async function uploadExternalModel(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/modelos3d', { method: 'POST', body: form });
  if (!res.ok) {
    let msg = 'Error al subir modelo 3D';
    try {
      const err = await res.json();
      if (err.detail) msg = err.detail;
    } catch (_) {}
    alert(msg);
    return;
  }
  const uploaded = await res.json();
  await refreshModel3dLibrary();
  const scale = Math.max(0.01, Number(m3dEls.importScale.value) || 1);
  await loadExternalModelToScene(uploaded.url, uploaded.filename, uploaded.ext, scale);
}

/* ==================== Persistencia BD / .JSON y Exportación .GLB / .STL ==================== */

function serializeScene() {
  return {
    version: 1,
    objects: m3dState.placedObjects.map((o) => {
      let cleanMeta;
      if (o.meta.kind === 'component') {
        const c = o.meta.comp;
        cleanMeta = {
          kind: 'component',
          compId: c.id,
          comp: {
            id: c.id,
            modelo: c.modelo,
            categoria: c.categoria,
            dimensiones: c.dimensiones,
          },
        };
      } else if (o.meta.kind === 'structure') {
        cleanMeta = {
          kind: 'structure',
          structKind: o.meta.structKind,
          spec: { ...o.meta.spec },
        };
      } else {
        cleanMeta = { ...o.meta };
      }

      return {
        uid: o.uid,
        name: o.name,
        pos: { x: o.group.position.x, y: o.group.position.y, z: o.group.position.z },
        rot: { x: o.group.rotation.x, y: o.group.rotation.y, z: o.group.rotation.z },
        color: o.color,
        meta: cleanMeta,
      };
    }),
    wires: m3dState.wires.map((w) => ({
      fromUid: w.fromUid,
      fromLocal: { ...w.fromLocal },
      toUid: w.toUid,
      toLocal: { ...w.toLocal },
      color: w.color,
      arch: w.arch,
      radius: w.radius,
    })),
  };
}

async function loadSceneData(data) {
  initScene();
  clearScene();
  const { componentes = [] } = window.getCatalogData ? window.getCatalogData() : {};
  const uidMap = new Map();

  for (const item of data.objects || []) {
    let created = null;
    const meta = item.meta || {};
    const pos = item.pos || { x: 0, y: 0, z: 0 };

    if (meta.kind === 'component') {
      const comp = componentes.find((c) => c.id === meta.compId) || meta.comp;
      if (comp) created = addComponentToScene(comp, pos);
    } else if (meta.kind === 'structure') {
      created = addStructureToScene(meta.structKind, item.name, { ...meta.spec, color: item.color }, pos);
    } else if (meta.kind === 'external' && meta.url) {
      try {
        created = await loadExternalModelToScene(
          meta.url,
          item.name,
          meta.ext || '.glb',
          meta.scale || 1,
          pos,
          item.color || '#d8dce3'
        );
      } catch (err) {
        console.warn('No se pudo cargar modelo externo:', meta.url, err);
      }
    }

    if (created) {
      if (item.rot) {
        created.group.rotation.set(item.rot.x || 0, item.rot.y || 0, item.rot.z || 0);
      }
      if (item.color) {
        created.color = item.color;
        for (const mat of created.primaryMaterials) {
          mat.color.set(item.color);
        }
      }
      uidMap.set(item.uid, created.uid);
    }
  }

  for (const w of data.wires || []) {
    const fromNew = uidMap.get(w.fromUid);
    const toNew = uidMap.get(w.toUid);
    if (fromNew !== undefined && toNew !== undefined) {
      addWire({
        fromUid: fromNew,
        fromLocal: w.fromLocal,
        toUid: toNew,
        toLocal: w.toLocal,
        color: w.color || '#e04f4f',
        arch: w.arch || 22,
        radius: w.radius || 0.9,
      });
    }
  }

  selectObject(null);
  updateAllWires();
  updateCollisions();
  renderSceneList();
  renderWireList();
}

async function refreshSavedProjects() {
  try {
    const res = await fetch('/api/maquetas');
    if (!res.ok) return;
    const list = await res.json();
    if (list.length === 0) {
      m3dEls.savedList.innerHTML = '<div class="m3d-empty-msg">Sin maquetas guardadas.</div>';
      return;
    }
    m3dEls.savedList.innerHTML = list
      .map(
        (p) => `
        <div class="m3d-saved-item">
          <span class="m3d-item-label" title="${escHtml(p.nombre)}">${escHtml(p.nombre)}</span>
          <button type="button" class="m3d-mini-btn" data-load-proj="${p.id}">Cargar</button>
          <button type="button" class="m3d-mini-btn del" data-del-proj="${p.id}" title="Eliminar">&times;</button>
        </div>`
      )
      .join('');
  } catch (_) {}
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildCleanExportGroup() {
  const exportGroup = new THREE.Group();
  exportGroup.name = 'Maqueta3D_Export';

  for (const entry of m3dState.placedObjects) {
    const sub = new THREE.Group();
    sub.name = entry.name;
    sub.position.copy(entry.group.position);
    sub.quaternion.copy(entry.group.quaternion);
    sub.scale.copy(entry.group.scale);

    for (const child of entry.group.children) {
      if (!child.userData.isHitbox) {
        sub.add(child.clone(true));
      }
    }
    exportGroup.add(sub);
  }

  for (const wire of m3dState.wires) {
    exportGroup.add(wire.group.clone(true));
  }
  return exportGroup;
}

function getExportBaseName() {
  const raw = (m3dEls.projName.value || 'maqueta_mecatronica').trim();
  return raw.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'maqueta_mecatronica';
}

function setCameraView(kind) {
  if (!m3dState.camera || !m3dState.orbit) return;
  if (kind === 'iso') {
    m3dState.camera.position.set(170, 165, 185);
    m3dState.orbit.target.set(0, 10, 0);
  } else if (kind === 'top') {
    m3dState.camera.position.set(0, 290, 0.1);
    m3dState.orbit.target.set(0, 0, 0);
  } else if (kind === 'front') {
    m3dState.camera.position.set(0, 65, 250);
    m3dState.orbit.target.set(0, 20, 0);
  }
  m3dState.orbit.update();
}

/* ==================== Plantillas Rápidas ==================== */

function spawnPresetCar2WD() {
  clearScene();
  // Chasis 150 x 100 x 4 mm elevado 25 mm sobre el suelo
  addStructureToScene('chassis', 'Chasis Carro 2WD', { w: 150, d: 100, h: 4, color: '#d8dce3' }, { x: 0, y: 25, z: 0 });
  // 2 ruedas Ø 65 x 26 mm apoyadas en Y=0
  addStructureToScene('wheel', 'Rueda Izquierda', { dia: 65, width: 26, color: '#3a3f47' }, { x: -25, y: 0, z: -65 });
  addStructureToScene('wheel', 'Rueda Derecha', { dia: 65, width: 26, color: '#3a3f47' }, { x: -25, y: 0, z: 65 });

  const { componentes = [] } = window.getCatalogData ? window.getCatalogData() : {};
  const esp = componentes.find((c) => c.modelo.toLowerCase().includes('esp32'));
  const drv = componentes.find((c) => c.modelo.toLowerCase().includes('l298n')) || componentes.find((c) => c.categoria === 'Drivers');
  if (esp) addComponentToScene(esp, { x: 32, y: 29, z: 0 });
  if (drv) addComponentToScene(drv, { x: -32, y: 29, z: 0 });
}

function spawnPresetBug() {
  clearScene();
  addStructureToScene('chassis', 'Placa Cucaracha', { w: 45, d: 45, h: 3, color: '#2b4157' }, { x: 0, y: 10, z: 0 });
  const posts = [
    [-18, 0, -18],
    [18, 0, -18],
    [-18, 0, 18],
    [18, 0, 18],
  ];
  posts.forEach(([px, py, pz], i) => {
    addStructureToScene('post', `Pata/Poste ${i + 1}`, { dia: 5, h: 10, color: '#d9822b' }, { x: px, y: py, z: pz });
  });
  const { componentes = [] } = window.getCatalogData ? window.getCatalogData() : {};
  const micro = componentes.find((c) => c.modelo.toLowerCase().includes('xiao') || c.modelo.toLowerCase().includes('supermini'));
  if (micro) addComponentToScene(micro, { x: 0, y: 13, z: 0 });
}

/* ==================== Eventos UI ==================== */

function setSidebarTab(tab) {
  m3dEls.btnTabCatalog.classList.toggle('active', tab === 'catalog');
  m3dEls.btnTabStruct.classList.toggle('active', tab === 'struct');
  m3dEls.btnTabFiles.classList.toggle('active', tab === 'files');
  m3dEls.panelCatalog.classList.toggle('hidden', tab !== 'catalog');
  m3dEls.panelStruct.classList.toggle('hidden', tab !== 'struct');
  m3dEls.panelFiles.classList.toggle('hidden', tab !== 'files');
}

m3dEls.btnClose.addEventListener('click', () => {
  m3dState.isOpen = false;
  m3dEls.view.classList.add('hidden');
});

m3dEls.btnTabCatalog.addEventListener('click', () => setSidebarTab('catalog'));
m3dEls.btnTabStruct.addEventListener('click', () => setSidebarTab('struct'));
m3dEls.btnTabFiles.addEventListener('click', () => {
  setSidebarTab('files');
  refreshSavedProjects();
  refreshModel3dLibrary();
});

m3dEls.search.addEventListener('input', renderCatalogSidebar);
m3dEls.catFilter.addEventListener('change', renderCatalogSidebar);

m3dEls.catalogList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-comp]');
  if (!btn) return;
  const id = Number(btn.dataset.addComp);
  const { componentes = [] } = window.getCatalogData ? window.getCatalogData() : {};
  const comp = componentes.find((c) => c.id === id);
  if (comp) addComponentToScene(comp);
});

m3dEls.sceneList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-select-uid]');
  if (btn) selectObject(Number(btn.dataset.selectUid));
});

m3dEls.btnMove.addEventListener('click', () => setToolMode('translate'));
m3dEls.btnRotate.addEventListener('click', () => setToolMode('rotate'));
m3dEls.btnWire.addEventListener('click', () => setToolMode('wire'));
m3dEls.btnWireCancel.addEventListener('click', () => setToolMode('translate'));

m3dEls.wireColors.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-wire-color]');
  if (!btn) return;
  m3dState.wireColor = btn.dataset.wireColor;
  renderWireColors();
  if (m3dState.pendingWire?.markerMesh) {
    m3dState.pendingWire.markerMesh.material.color.set(m3dState.wireColor);
  }
});

m3dEls.wireList.addEventListener('input', (e) => {
  const id = e.target.dataset?.wireRecolor;
  if (!id) return;
  const wire = m3dState.wires.find((w) => w.id === Number(id));
  if (!wire) return;
  wire.color = e.target.value;
  rebuildWireMesh(wire);
});

m3dEls.wireList.addEventListener('click', (e) => {
  const id = e.target.dataset?.wireDel;
  if (id) deleteWireById(Number(id));
});

m3dEls.btnRotY.addEventListener('click', () => {
  const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
  if (!entry) return;
  entry.group.rotation.y += Math.PI / 2;
  syncInspectorFromSelected();
  updateAllWires();
  updateCollisions();
});

m3dEls.btnRotX.addEventListener('click', () => {
  const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
  if (!entry) return;
  entry.group.rotation.x += Math.PI / 2;
  syncInspectorFromSelected();
  updateAllWires();
  updateCollisions();
});

m3dEls.snapSelect.addEventListener('change', () => {
  m3dState.snapMm = Number(m3dEls.snapSelect.value) || 0;
  if (m3dState.transform) {
    m3dState.transform.setTranslationSnap(m3dState.snapMm || null);
    m3dState.transform.setRotationSnap(m3dState.snapMm ? THREE.MathUtils.degToRad(15) : null);
  }
});

m3dEls.btnCamIso.addEventListener('click', () => setCameraView('iso'));
m3dEls.btnCamTop.addEventListener('click', () => setCameraView('top'));
m3dEls.btnCamFront.addEventListener('click', () => setCameraView('front'));

m3dEls.btnHitbox.addEventListener('click', () => {
  m3dState.showHitboxes = !m3dState.showHitboxes;
  m3dEls.btnHitbox.classList.toggle('active', m3dState.showHitboxes);
  refreshHitboxColors();
});

m3dEls.btnClear.addEventListener('click', () => {
  if (m3dState.placedObjects.length === 0 && m3dState.wires.length === 0) return;
  if (confirm('¿Limpiar todos los objetos y cables de la maqueta 3D?')) clearScene();
});

// Estructuras y Plantillas
m3dEls.btnPresetCar2WD.addEventListener('click', spawnPresetCar2WD);
m3dEls.btnPresetBug.addEventListener('click', spawnPresetBug);

m3dEls.btnAddChassis.addEventListener('click', () => {
  addStructureToScene('chassis', 'Chasis / Placa', {
    w: Math.max(5, Number(m3dEls.stChassisW.value) || 140),
    d: Math.max(5, Number(m3dEls.stChassisD.value) || 90),
    h: Math.max(1, Number(m3dEls.stChassisH.value) || 4),
    color: m3dEls.stChassisColor.value || '#d8dce3',
  });
});

m3dEls.btnAddWheel.addEventListener('click', () => {
  addStructureToScene('wheel', 'Rueda', {
    dia: Math.max(8, Number(m3dEls.stWheelDia.value) || 65),
    width: Math.max(4, Number(m3dEls.stWheelW.value) || 26),
    color: m3dEls.stWheelColor.value || '#3a3f47',
  });
});

m3dEls.btnAddPost.addEventListener('click', () => {
  addStructureToScene('post', 'Poste / Separador', {
    dia: Math.max(2, Number(m3dEls.stPostDia.value) || 6),
    h: Math.max(4, Number(m3dEls.stPostH.value) || 25),
    color: '#d8dce3',
  });
});

m3dEls.btnAddBreadboard.addEventListener('click', () => {
  const size = m3dEls.stBreadboardSize.value;
  const presets = {
    mini: { w: 45, d: 35, h: 9, label: 'Protoboard Mini' },
    half: { w: 82, d: 55, h: 9, label: 'Protoboard 400 pts' },
    full: { w: 165, d: 55, h: 9, label: 'Protoboard 830 pts' },
  };
  const p = presets[size] || presets.half;
  addStructureToScene('breadboard', p.label, { w: p.w, d: p.d, h: p.h, color: '#f0ece1' });
});

m3dEls.btnAddBox.addEventListener('click', () => {
  addStructureToScene('box', 'Bloque', {
    w: Math.max(2, Number(m3dEls.stBoxW.value) || 40),
    d: Math.max(2, Number(m3dEls.stBoxD.value) || 30),
    h: Math.max(2, Number(m3dEls.stBoxH.value) || 20),
    color: m3dEls.stBoxColor.value || '#c9cfd8',
  });
});

// Inspector inputs
[m3dEls.posX, m3dEls.posY, m3dEls.posZ].forEach((inp) => {
  inp.addEventListener('input', () => {
    const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
    if (!entry) return;
    entry.group.position.set(
      Number(m3dEls.posX.value) || 0,
      Number(m3dEls.posY.value) || 0,
      Number(m3dEls.posZ.value) || 0
    );
    updateAllWires();
    updateCollisions();
  });
});

[m3dEls.rotX, m3dEls.rotY, m3dEls.rotZ].forEach((inp) => {
  inp.addEventListener('input', () => {
    const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
    if (!entry) return;
    entry.group.rotation.set(
      THREE.MathUtils.degToRad(Number(m3dEls.rotX.value) || 0),
      THREE.MathUtils.degToRad(Number(m3dEls.rotY.value) || 0),
      THREE.MathUtils.degToRad(Number(m3dEls.rotZ.value) || 0)
    );
    updateAllWires();
    updateCollisions();
  });
});

m3dEls.colorSwatches.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-color]');
  if (!btn) return;
  const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
  if (!entry) return;
  const hex = btn.dataset.color;
  entry.color = hex;
  for (const mat of entry.primaryMaterials) {
    mat.color.set(hex);
  }
});

m3dEls.btnDropFloor.addEventListener('click', () => {
  const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
  if (!entry) return;
  entry.group.position.y = 0;
  syncInspectorFromSelected();
  updateAllWires();
  updateCollisions();
});

m3dEls.btnDuplicate.addEventListener('click', async () => {
  const entry = m3dState.placedObjects.find((o) => o.uid === m3dState.selectedUid);
  if (!entry) return;
  const pos = {
    x: entry.group.position.x + 15,
    y: entry.group.position.y,
    z: entry.group.position.z + 15,
  };
  let dup = null;
  if (entry.meta.kind === 'component') {
    dup = addComponentToScene(entry.meta.comp, pos);
  } else if (entry.meta.kind === 'structure') {
    dup = addStructureToScene(entry.meta.structKind, entry.name, { ...entry.meta.spec, color: entry.color }, pos);
  } else if (entry.meta.kind === 'external') {
    dup = await loadExternalModelToScene(
      entry.meta.url,
      entry.name,
      entry.meta.ext,
      entry.meta.scale,
      pos,
      entry.color
    );
  }
  if (dup) {
    dup.group.rotation.copy(entry.group.rotation);
    for (const mat of dup.primaryMaterials) mat.color.set(entry.color);
    syncInspectorFromSelected();
    updateCollisions();
  }
});

m3dEls.btnDelete.addEventListener('click', deleteSelected);

// Fase 4: Persistencia BD, Biblioteca .GLB/.STL y Exportación
m3dEls.btnSaveDb.addEventListener('click', async () => {
  const nombre = m3dEls.projName.value.trim() || `Maqueta_${new Date().toISOString().slice(0, 10)}`;
  m3dEls.projName.value = nombre;
  try {
    const res = await fetch('/api/maquetas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, data: serializeScene() }),
    });
    if (!res.ok) throw new Error('No se pudo guardar en BD');
    await refreshSavedProjects();
  } catch (err) {
    alert(err.message);
  }
});

m3dEls.savedList.addEventListener('click', async (e) => {
  const loadId = e.target.dataset?.loadProj;
  if (loadId) {
    const res = await fetch(`/api/maquetas/${loadId}`);
    if (!res.ok) return;
    const proj = await res.json();
    m3dEls.projName.value = proj.nombre;
    await loadSceneData(proj.data);
    return;
  }
  const delId = e.target.dataset?.delProj;
  if (delId) {
    if (!confirm('¿Eliminar esta maqueta guardada?')) return;
    await fetch(`/api/maquetas/${delId}`, { method: 'DELETE' });
    await refreshSavedProjects();
  }
});

m3dEls.btnUploadModel.addEventListener('click', () => {
  m3dEls.hiddenModel3dInput.value = '';
  m3dEls.hiddenModel3dInput.click();
});

m3dEls.hiddenModel3dInput.addEventListener('change', async () => {
  const file = m3dEls.hiddenModel3dInput.files?.[0];
  if (file) await uploadExternalModel(file);
});

m3dEls.libraryList.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-add-ext-url]');
  if (!btn) return;
  const scale = Math.max(0.01, Number(m3dEls.importScale.value) || 1);
  await loadExternalModelToScene(
    btn.dataset.addExtUrl,
    btn.dataset.addExtName,
    btn.dataset.addExtType,
    scale
  );
});

m3dEls.btnExportJson.addEventListener('click', () => {
  const payload = JSON.stringify(serializeScene(), null, 2);
  downloadBlob(new Blob([payload], { type: 'application/json' }), `${getExportBaseName()}.maqueta.json`);
});

m3dEls.btnImportJson.addEventListener('click', () => {
  m3dEls.hiddenJsonInput.value = '';
  m3dEls.hiddenJsonInput.click();
});

m3dEls.hiddenJsonInput.addEventListener('change', async () => {
  const file = m3dEls.hiddenJsonInput.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    await loadSceneData(parsed);
  } catch (err) {
    alert('Archivo .JSON inválido: ' + err.message);
  }
});

m3dEls.btnExportGlb.addEventListener('click', () => {
  if (m3dState.placedObjects.length === 0) return;
  const exportGroup = buildCleanExportGroup();
  const exporter = new GLTFExporter();
  exporter.parse(
    exportGroup,
    (result) => {
      const blob = new Blob([result], { type: 'model/gltf-binary' });
      downloadBlob(blob, `${getExportBaseName()}.glb`);
    },
    (err) => {
      alert('Error exportando .GLB: ' + (err?.message || err));
    },
    { binary: true }
  );
});

m3dEls.btnExportStl.addEventListener('click', () => {
  if (m3dState.placedObjects.length === 0) return;
  const exportGroup = buildCleanExportGroup();
  const exporter = new STLExporter();
  const result = exporter.parse(exportGroup, { binary: true });
  downloadBlob(new Blob([result.buffer], { type: 'application/octet-stream' }), `${getExportBaseName()}.stl`);
});

// Atajos de teclado dentro de Maqueta 3D
window.addEventListener('keydown', (e) => {
  if (!m3dState.isOpen) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  if (e.key === 'g' || e.key === 'G') {
    setToolMode('translate');
  } else if (e.key === 'r' || e.key === 'R') {
    setToolMode('rotate');
  } else if (e.key === 'c' || e.key === 'C') {
    setToolMode('wire');
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelected();
  } else if (e.key === 'Escape') {
    if (m3dState.pendingWire) {
      cancelPendingWire();
    } else if (m3dState.toolMode === 'wire') {
      setToolMode('translate');
    } else {
      selectObject(null);
    }
  }
});

// API pública para app.js
window.Maqueta3D = {
  open() {
    m3dEls.view.classList.remove('hidden');
    m3dState.isOpen = true;
    initScene();
    renderCatalogSidebar();
    renderWireColors();
    renderWireList();
    refreshSavedProjects();
    refreshModel3dLibrary();
    resizeCanvas();
  },
  refreshCatalog() {
    renderCatalogSidebar();
  },
};
