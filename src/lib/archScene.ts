// Decorative 3D background — a wine/cream arch scene rendered with three.js
// (loaded from the CDN, matching the original r128 API the scene was
// authored against). Untyped on purpose: THREE comes from a global script
// tag, not an npm/type-checked import. Shared by the login page and the
// dashboard, each mounting it on their own <canvas>.
/* eslint-disable @typescript-eslint/no-explicit-any */

export function initArchScene(canvas: HTMLCanvasElement): () => void {
  const THREE = (window as any).THREE;
  if (!THREE) return () => {};

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer: any;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return () => {};
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const target = new THREE.Vector3(0, 1.7, 0);

  // ---------- Environment lighting (soft "softboxes" for reflections) ----------
  (function () {
    const pm = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(30, 16, 30),
        new THREE.MeshBasicMaterial({ color: 0x9c8f8b, side: THREE.BackSide })
      )
    );
    function panel(w: number, h: number, x: number, y: number, z: number, ry: number, k: number) {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      m.color.multiplyScalar(k);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, z);
      p.rotation.y = ry;
      env.add(p);
    }
    panel(10, 6, -9, 6, 6, Math.PI / 3, 6);
    panel(8, 4, 8, 5, 8, -Math.PI / 3, 3.5);
    panel(12, 3, 0, 12, 0, 0, 4);
    scene.environment = pm.fromScene(env, 0.04).texture;
    pm.dispose();
  })();

  // ---------- Lights ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9a9a5, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3ea, 1.0);
  sun.position.set(-6, 10, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -9;
  sc.right = 9;
  sc.top = 9;
  sc.bottom = -9;
  sc.near = 1;
  sc.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // ---------- Materials ----------
  const M = {
    wine: new THREE.MeshStandardMaterial({ color: 0x5b1a2c, roughness: 0.5, metalness: 0.05 }),
    blush: new THREE.MeshStandardMaterial({ color: 0xe7cbc4, roughness: 0.62, metalness: 0.0 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xf1e9e2, roughness: 0.7, metalness: 0.0 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb8935a, roughness: 0.28, metalness: 1.0 }),
    pearl: new THREE.MeshPhysicalMaterial({
      color: 0xf8f1ea,
      roughness: 0.14,
      metalness: 0.0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
  };
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.2 });

  // ---------- Geometry helpers ----------
  function archGeo(W: number, H: number, T: number, D: number) {
    const R = W / 2,
      r = R - T,
      s = new THREE.Shape();
    s.moveTo(-R, 0);
    s.lineTo(-r, 0);
    s.lineTo(-r, H - R);
    s.absarc(0, H - R, r, Math.PI, 0, true);
    s.lineTo(r, 0);
    s.lineTo(R, 0);
    s.lineTo(R, H - R);
    s.absarc(0, H - R, R, 0, Math.PI, false);
    s.lineTo(-R, 0);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: D,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 40,
    });
    g.translate(0, 0, -D / 2);
    return g;
  }
  function rr(w: number, h: number, r: number) {
    const s = new THREE.Shape(),
      x = -w / 2,
      y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function slabGeo(w: number, d: number, h: number, r: number) {
    const g = new THREE.ExtrudeGeometry(rr(w, d, r), {
      depth: h,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 10,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }
  function mesh(geo: any, mat: any, x: number, y: number, z: number) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  const items: { obj: any; delay: number; mode: string }[] = [];
  function add(obj: any, delay: number, mode: string) {
    scene.add(obj);
    items.push({ obj, delay, mode });
    return obj;
  }

  // floor: invisible, receives shadows only
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), shadowMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // brass ring on the floor
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.9, 3.95, 128), M.brass);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  scene.add(ring);

  // large arch (wine)
  const arch1 = mesh(archGeo(3.2, 4.4, 0.8, 0.8), M.wine, 0, 0, -1.3);
  add(arch1, 0, "y");

  // small arch (blush)
  const arch2 = mesh(archGeo(2.2, 3.0, 0.52, 0.5), M.blush, -2.75, 0, 0.35);
  arch2.rotation.y = 0.38;
  add(arch2, 140, "y");

  // fluted column
  const col = new THREE.Group();
  col.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.18, 40), M.cream, 0, 0.09, 0));
  const shaft = mesh(new THREE.CylinderGeometry(0.4, 0.43, 3.2, 18, 1), M.cream, 0, 1.78, 0);
  shaft.material = M.cream.clone();
  shaft.material.flatShading = true;
  shaft.material.needsUpdate = true;
  col.add(shaft);
  col.add(mesh(new THREE.CylinderGeometry(0.58, 0.5, 0.22, 40), M.cream, 0, 3.49, 0));
  col.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 40), M.cream, 0, 3.65, 0));
  col.position.set(3.1, 0, -0.5);
  add(col, 260, "y");

  // pedestal and pearl sphere in the archway
  const ped = new THREE.Group();
  ped.add(mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.12, 48), M.cream, 0, 0.06, 0));
  ped.add(mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.5, 48), M.cream, 0, 0.37, 0));
  ped.position.set(0, 0, -0.45);
  add(ped, 380, "y");

  const pearl = mesh(new THREE.SphereGeometry(0.58, 64, 64), M.pearl, 0, 1.55, -0.45);
  add(pearl, 520, "u");

  // brass torus ring
  const torusWrap = new THREE.Group();
  const torus = mesh(new THREE.TorusGeometry(0.78, 0.065, 32, 120), M.brass, 0, 0, 0);
  torusWrap.add(torus);
  torusWrap.position.set(1.75, 1.25, 1.55);
  add(torusWrap, 640, "u");

  // stack of material sample tiles
  const tiles = new THREE.Group();
  const t1 = mesh(slabGeo(1.6, 1.1, 0.14, 0.05), M.cream, 0, 0, 0);
  const t2 = mesh(slabGeo(1.25, 0.85, 0.14, 0.05), M.wine, 0.05, 0.15, 0.02);
  t2.rotation.y = 0.45;
  const t3 = mesh(slabGeo(0.8, 0.6, 0.12, 0.04), M.blush, -0.02, 0.3, 0.0);
  t3.rotation.y = -0.25;
  tiles.add(t1, t2, t3);
  tiles.position.set(-1.0, 0, 2.15);
  add(tiles, 760, "y");

  // ---------- Theme ----------
  function isDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function applyTheme() {
    const d = isDark();
    M.wine.color.set(d ? 0x8f2f4d : 0x5b1a2c);
    shadowMat.opacity = d ? 0.55 : 0.2;
    hemi.intensity = d ? 0.38 : 0.55;
    sun.intensity = d ? 0.85 : 1.0;
    renderer.toneMappingExposure = d ? 0.95 : 1.05;
  }
  applyTheme();
  const darkModeQuery = matchMedia("(prefers-color-scheme: dark)");
  darkModeQuery.addEventListener("change", applyTheme);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // ---------- Camera and sizing ----------
  const dir = new THREE.Vector3(0.46, 0.283, 0.841).normalize();
  let dist = 12.5;
  function resize() {
    const width = window.innerWidth,
      height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    dist = Math.max(12.5, 7.4 / (2 * tanV * camera.aspect));
    if (width > 820) {
      camera.setViewOffset(width, height, width * 0.13, 0, width, height);
    } else {
      camera.setViewOffset(width, height, 0, height * 0.17, width, height);
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- Cursor parallax ----------
  let mx = 0,
    my = 0,
    cx = 0,
    cy = 0;
  function handlePointerMove(e: PointerEvent) {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("pointermove", handlePointerMove);

  // ---------- Render loop ----------
  const t0 = performance.now();
  function ease(x: number) {
    return 1 - Math.pow(1 - x, 3);
  }
  const base = new THREE.Vector3();

  let frameId = 0;
  let disposed = false;

  function frame(now: number) {
    if (disposed) return;
    const t = (now - t0) / 1000;
    cx += (mx - cx) * 0.05;
    cy += (my - cy) * 0.05;
    const drift = reduce ? 0 : Math.sin(t * 0.18) * 0.35;

    base.copy(target).addScaledVector(dir, dist);
    camera.position.set(base.x + (reduce ? 0 : cx * 1.1) + drift, base.y - (reduce ? 0 : cy * 0.5), base.z);
    camera.lookAt(target);

    items.forEach(function (it) {
      let s = reduce ? 1 : ease(Math.min(1, Math.max(0, (now - t0 - it.delay) / 1100)));
      s = Math.max(s, 0.0001);
      if (it.mode === "y") it.obj.scale.set(1, s, 1);
      else it.obj.scale.setScalar(s);
    });

    if (!reduce) {
      pearl.position.y = 1.55 + Math.sin(t * 0.9) * 0.07;
      torusWrap.rotation.y = t * 0.35;
      torusWrap.rotation.x = Math.sin(t * 0.5) * 0.12;
      torusWrap.position.y = 1.25 + Math.sin(t * 0.8 + 1) * 0.06;
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return function cleanup() {
    disposed = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", handlePointerMove);
    darkModeQuery.removeEventListener("change", applyTheme);
    themeObserver.disconnect();
    renderer.dispose();
  };
}
