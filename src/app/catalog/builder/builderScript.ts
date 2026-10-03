// Interactive 3D wardrobe-section builder — ported from the standalone
// "Соберите гардеробную" mockup, kept as close to the original vanilla JS
// as possible (it only ever needs to run once, on this one page) since it's
// a large, already-working, imperative three.js app. Two changes from the
// original: (1) product photos point at /products/* instead of embedded
// base64, reusing the same files the catalog uses; (2) the order modal
// posts to /api/shop/order (same endpoint the cart checkout uses) instead
// of a copy-text-then-open-a-placeholder-username Telegram flow.
/* eslint-disable @typescript-eslint/no-explicit-any */

export function initBuilder(): () => void {
  if (typeof window === "undefined") return () => {};
  const THREE = (window as any).THREE;
  if (!THREE) return () => {};

  function $(id: string) {
    return document.getElementById(id)!;
  }

  /* ================= ДАННЫЕ ИЗ ПРАЙС-ЛИСТА ================= */
  const STACK_LIMIT = 1100; // мм высоты под ящики

  const IMG: Record<string, string> = {
    "TL-8-06": "/products/trousers_rack.jpg",
    "TL-14-06": "/products/leather_basket.jpg",
    "TL-13-06": "/products/underwear_basket.jpg",
    "TL-6-06": "/products/flat_basket.jpg",
    "TL-3-06": "/products/shelf_light.jpg",
    "TL-10-06": "/products/dividing_box.jpg",
    "TL-15-06": "/products/jewelry_box_tl15.jpg",
    "TL-7-06": "/products/jewelry_box_tl7.jpg",
    "KY-3-06": "/products/rod_oval.jpg",
    "KY-6-06": "/products/rod_round.png",
    "KY-5-06": "/products/rod_square.png",
    "H-S8439": "/products/handle_small.jpg",
    "H-33": "/products/handle_33.jpg",
    "H-26": "/products/handle_26.jpg",
    "H-27": "/products/handle_27.jpg",
    "H-34": "/products/handle_34.jpg",
  };
  const RACKIMG: Record<string, string> = {
    side: "/products/shoe_rack_side.jpg",
    "360": "/products/shoe_rack_360.jpg",
  };
  const BIG: Record<string, string> = {
    "d:TL-8": "/products/trousers_rack.jpg",
    "d:TL-14": "/products/leather_basket.jpg",
    "d:TL-13": "/products/underwear_basket.jpg",
    "d:TL-6": "/products/flat_basket.jpg",
    "d:TL-3": "/products/shelf_light.jpg",
    "d:TL-10": "/products/dividing_box.jpg",
    "d:TL-15": "/products/jewelry_box_tl15.jpg",
    "d:TL-7": "/products/jewelry_box_tl7.jpg",
    "r:leather": "/products/rod_oval.jpg",
    "r:braid": "/products/rod_round.png",
    "r:metal": "/products/rod_square.png",
    "h:S-8439": "/products/handle_small.jpg",
    "h:33": "/products/handle_33.jpg",
    "h:26": "/products/handle_26.jpg",
    "h:27": "/products/handle_27.jpg",
    "h:34": "/products/handle_34.jpg",
    "k:side": "/products/shoe_rack_side.jpg",
    "k:360": "/products/shoe_rack_360.jpg",
  };

  interface DrawerDef {
    id: string;
    name: string;
    h: number;
    kind: string;
    p: Record<number, number>;
    noHandle?: boolean;
  }
  const DRAWERS: DrawerDef[] = [
    { id: "TL-8", name: "Выдвижная стойка для брюк", h: 106, kind: "trousers", p: { 564: 94600, 864: 117800 } },
    { id: "TL-14", name: "Кожаная корзина", h: 265, kind: "basket", p: { 564: 101000, 864: 120600 } },
    { id: "TL-13", name: "Корзина для белья", h: 185, kind: "compart", p: { 564: 101800, 864: 121400 } },
    { id: "TL-6", name: "Плоская корзина", h: 106, kind: "flat", p: { 564: 81700, 864: 103500 } },
    { id: "TL-3", name: "Полка с подсветкой", h: 36, kind: "shelf", p: { 564: 53500, 864: 62200 }, noHandle: true },
    { id: "TL-10", name: "Разделительный лоток", h: 106, kind: "grid", p: { 564: 80300, 864: 100000 } },
    {
      id: "TL-15",
      name: "Шкатулка для украшений, с кольцедержателем",
      h: 106,
      kind: "jewel1",
      p: { 564: 103200, 864: 122800 },
    },
    { id: "TL-7", name: "Шкатулка для украшений", h: 106, kind: "jewel2", p: { 564: 106700, 864: 126400 } },
  ] as const;
  const ROD_SUFFIX: Record<number, string> = { 500: "06", 600: "07", 700: "08", 800: "09", 900: "10", 1100: "12" };
  const ROD_LENGTHS = [500, 600, 700, 800, 900, 1100];
  const RODS = [
    {
      id: "leather",
      fam: "KY-3",
      name: "Штанга потолочная, кожа",
      short: "Кожа",
      p: { 500: 11300, 600: 12300, 700: 13000, 800: 14300, 900: 15000, 1100: 16400 },
    },
    {
      id: "braid",
      fam: "KY-6",
      name: "Штанга потолочная, кожа плетёная круглая",
      short: "Кожа плетёная",
      p: { 500: 14100, 600: 15100, 700: 15800, 800: 17200, 900: 17900, 1100: 19300 },
    },
    {
      id: "metal",
      fam: "KY-5",
      name: "Штанга потолочная, металл квадратная",
      short: "Металл",
      p: { 500: 14100, 600: 15100, 700: 15800, 800: 17200, 900: 17900, 1100: 19300 },
    },
  ] as const;
  const HANDLES = [
    { id: "S-8439", art: "S-8439", name: "Малая ручка S-8439", short: "S-8439", len: 30, price: 3700, shape: "tab" },
    {
      id: "33",
      art: "33#",
      name: "Ручка полукруглая №33",
      short: "№33 полукруглая",
      len: 219,
      price: 5900,
      shape: "half",
    },
    { id: "26", art: "26#", name: "Ручка №26", short: "№26", len: 180, price: 3900, shape: "bar" },
    { id: "27", art: "27#", name: "Ручка №27", short: "№27", len: 184, price: 4800, shape: "pull" },
    { id: "34", art: "34#", name: "Ручка №34", short: "№34", len: 180, price: 5900, shape: "tee" },
  ] as const;
  const HANDLE_IMG: Record<string, string> = { "S-8439": "H-S8439", "33": "H-33", "26": "H-26", "27": "H-27", "34": "H-34" };
  const RACKS = [
    {
      id: "side",
      art: "F-18-12",
      name: "Боковая вращающаяся стойка для обуви",
      short: "Боковая",
      price: 196100,
      dim: "500×350×1910–2185 мм",
    },
    {
      id: "360",
      art: "F-10-12A",
      name: "Вращающаяся стойка для обуви 360°",
      short: "360°",
      price: 246900,
      dim: "730×350×1910–2185 мм",
    },
  ] as const;

  /* ================= УТИЛИТЫ ================= */
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU") + " ₸";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function byId<T extends { id: string }>(a: readonly T[], id: string | null): T | null {
    for (let i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function isDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* ================= СОСТОЯНИЕ ================= */
  let uid = 1;
  function mk(code: string) {
    return { id: "d" + uid++, code, open: true, pull: 0 };
  }
  const state: {
    width: 564 | 864;
    rod: string | null;
    rodLen: number;
    handle: string | null;
    rack: string | null;
    clothes: boolean;
    drawers: { id: string; code: string; open: boolean; pull: number }[];
  } = {
    width: 564,
    rod: "leather",
    rodLen: 500,
    handle: null,
    rack: null,
    clothes: true,
    drawers: [mk("TL-15"), mk("TL-10"), mk("TL-13"), mk("TL-14")], // сверху вниз
  };
  const secW = () => (state.width === 564 ? 0.6 : 0.9);
  const allowedLens = () => {
    const max = secW() * 1000;
    return ROD_LENGTHS.filter((l) => l <= max);
  };
  const stackMM = () => state.drawers.reduce((s, d) => s + byId(DRAWERS, d.code)!.h + 12, 0);
  const dArt = (it: (typeof DRAWERS)[number]) => it.id + (state.width === 564 ? "-06" : "-09");
  const dPrice = (it: (typeof DRAWERS)[number]) => it.p[state.width];
  const rArt = (r: (typeof RODS)[number]) => r.fam + "-" + ROD_SUFFIX[state.rodLen];
  const rPrice = (r: (typeof RODS)[number]) => (r.p as any)[state.rodLen];
  const handleCount = () => state.drawers.filter((d) => !byId(DRAWERS, d.code)!.noHandle).length;

  /* ================= 3D ================= */
  const stage = $("stage"),
    canvas = $("gl") as HTMLCanvasElement;
  let renderer: any = null,
    scene: any,
    camera: any,
    assembly: any,
    wardrobe: any,
    rackGroup: any = null,
    platform: any,
    hemi: any,
    sun: any;
  let drawerGroups: Record<string, any> = {},
    fronts: any[] = [],
    MAT: any = {},
    rackSpin = false;
  const matCache: Record<string, any> = {};
  const D = 0.55,
    H = 2.4,
    PLINTH = 0.1,
    PULL = 0.26;

  function mat(hex: string, r?: number, m?: number) {
    const k = hex + "|" + r + "|" + (m || 0);
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: r == null ? 0.8 : r, metalness: m || 0 });
    return matCache[k];
  }
  function box(w: number, h: number, d: number, m: any, x: number, y: number, z: number) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  }
  function cyl(r: number, len: number, m: any, axis: string, x: number, y: number, z: number, seg?: number) {
    const g = new THREE.CylinderGeometry(r, r, len, seg || 18);
    if (axis === "x") g.rotateZ(Math.PI / 2);
    else if (axis === "z") g.rotateX(Math.PI / 2);
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  }
  function clearGroup(g: any) {
    g.traverse((o: any) => {
      if (o.geometry) o.geometry.dispose();
    });
    while (g.children.length) g.remove(g.children[0]);
  }

  /* оплётка штанги — процедурная текстура */
  function weaveTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    x.fillStyle = "#b07c56";
    x.fillRect(0, 0, 128, 128);
    x.strokeStyle = "rgba(70,38,22,.55)";
    x.lineWidth = 3;
    for (let i = -128; i < 256; i += 16) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i + 128, 128);
      x.stroke();
      x.beginPath();
      x.moveTo(i + 128, 0);
      x.lineTo(i, 128);
      x.stroke();
    }
    x.strokeStyle = "rgba(255,230,200,.22)";
    x.lineWidth = 1.5;
    for (let j = -128; j < 256; j += 16) {
      x.beginPath();
      x.moveTo(j + 6, 0);
      x.lineTo(j + 134, 128);
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  function initGL() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      $("fail").style.display = "flex";
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

    (function () {
      const pm = new THREE.PMREMGenerator(renderer),
        env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), new THREE.MeshBasicMaterial({ color: 0x8a7e7a, side: THREE.BackSide })));
      function panel(w: number, h: number, x: number, y: number, z: number, ry: number, k: number) {
        const m = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        m.color.multiplyScalar(k);
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        p.position.set(x, y, z);
        p.rotation.y = ry;
        env.add(p);
      }
      panel(8, 5, -7, 5, 5, Math.PI / 3, 4.5);
      panel(6, 4, 7, 4, 7, -Math.PI / 3, 2.5);
      panel(10, 3, 0, 10, 0, 0, 3);
      scene.environment = pm.fromScene(env, 0.04).texture;
      pm.dispose();
    })();

    hemi = new THREE.HemisphereLight(0xffffff, 0xb9aaa5, 0.3);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff3ea, 1.0);
    sun.position.set(-2.8, 5, 4);
    sun.target.position.set(0, 1.1, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -3.2;
    sc.right = 3.2;
    sc.top = 3.5;
    sc.bottom = -1;
    sc.near = 1;
    sc.far = 14;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.012;
    scene.add(sun);
    scene.add(sun.target);

    MAT = {
      carc: mat("#e4dbd3", 0.85),
      back: mat("#cdc2b9", 0.9),
      plinth: mat("#3a3336", 0.7),
      graphite: mat("#232022", 0.42, 0.55),
      alu: mat("#cfcfd2", 0.3, 1.0),
      aluDark: mat("#4b4b4f", 0.45, 0.8),
      gray: mat("#8c8c90", 0.5, 0.7),
      strip: mat("#d9d0ca", 0.35, 0.6),
      led: new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd699, emissiveIntensity: 1.8, roughness: 0.4 }),
      shelfBrown: mat("#6a3f33", 0.7),
      rodLeather: mat("#5d3d37", 0.62),
      rodMetal: mat("#d9d9dc", 0.28, 0.95),
      platform: new THREE.MeshStandardMaterial({ color: 0xefe8e3, roughness: 1 }),
    };
    MAT.rodBraid = new THREE.MeshStandardMaterial({ color: 0xffffff, map: weaveTexture(), roughness: 0.6 });
    const gcols = ["#d9cfc4", "#8a8f86", "#c4a495", "#3f3a3d", "#e8e1d6", "#a99186", "#6d5b5e", "#b7b2a6"];
    MAT.garments = gcols.map((c) => mat(c, 0.92));

    platform = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.03, 96), MAT.platform);
    platform.position.y = -0.015;
    platform.receiveShadow = true;
    scene.add(platform);

    assembly = new THREE.Group();
    scene.add(assembly);
    wardrobe = new THREE.Group();
    assembly.add(wardrobe);
    applyTheme();
    return true;
  }
  function applyTheme() {
    if (!renderer) return;
    const d = isDark();
    MAT.platform.color.set(d ? 0x2c2428 : 0xefe8e3);
    hemi.intensity = d ? 0.22 : 0.3;
    sun.intensity = d ? 0.85 : 1.0;
    renderer.toneMappingExposure = d ? 0.95 : 1.0;
  }

  /* ---------- ящики: палитра по фото каталога ---------- */
  const FRONT: Record<string, string> = {
    flat: "#b3a29c",
    basket: "#6c5c55",
    compart: "#9a817a",
    trousers: "#ab9d97",
    grid: "#aa9e99",
    jewel1: "#9c8178",
    jewel2: "#aa9689",
    shelf: "#b5a8a4",
  };
  const LINER: Record<string, string> = {
    flat: "#8f8482",
    basket: "#7d6d65",
    compart: "#8c7068",
    trousers: "#6f625d",
    grid: "#a79e9b",
    jewel1: "#9b7e75",
    jewel2: "#a99a8e",
    shelf: "#b5a8a4",
  };
  const DIV: Record<string, string> = { compart: "#7b6059", grid: "#1f1d1f", jewel1: "#876c64", jewel2: "#8f7d72" };

  function dividers(g: any, m: any, x0: number, x1: number, zc: number, dl: number, hh: number, cols: number, rows: number) {
    const w = x1 - x0;
    for (let i = 1; i < cols; i++) g.add(box(0.005, hh, dl, m, x0 + (w * i) / cols, 0.02 + hh / 2, zc));
    for (let j = 1; j < rows; j++) g.add(box(w, hh, 0.005, m, x0 + w / 2, 0.02 + hh / 2, zc - dl / 2 + (dl * j) / rows));
  }
  function ribbed(g: any, x: number, z: number, w: number, l: number, hh: number, base: string, line: string) {
    g.add(box(w, hh, l, mat(base, 0.9), x, 0.02 + hh / 2, z));
    const n = 6;
    for (let i = 0; i < n; i++) g.add(box(w * 0.9, 0.004, 0.004, mat(line, 0.9), x, 0.02 + hh + 0.002, z - l / 2 + (l * (i + 0.5)) / n));
  }

  function buildDrawer(it: (typeof DRAWERS)[number], W: number, id: string) {
    const g = new THREE.Group(),
      h = it.h / 1000,
      Dd = 0.47,
      fw = W - 0.006,
      k = it.kind,
      zc = -(0.02 + Dd / 2);
    const front = box(fw, h, 0.02, mat(FRONT[k], 0.82), 0, h / 2, -0.01);
    front.userData.drawerId = id;
    g.add(front);
    fronts.push(front);
    g.add(box(fw, 0.007, 0.0215, MAT.strip, 0, h - 0.0035, -0.01));
    const liner = mat(LINER[k], 0.92);
    const iw = W - 0.052,
      x0 = -iw / 2,
      x1 = iw / 2,
      dl = Dd - 0.04;

    if (k === "shelf") {
      g.add(box(W - 0.03, 0.012, Dd, liner, 0, 0.02, zc));
      g.add(box(W - 0.03, 0.016, 0.008, MAT.graphite, 0, 0.02, -(0.02 + Dd) + 0.004));
      g.add(box(0.008, 0.016, Dd, MAT.graphite, -(W / 2 - 0.019), 0.02, zc));
      g.add(box(0.008, 0.016, Dd, MAT.graphite, W / 2 - 0.019, 0.02, zc));
      g.add(box(W - 0.05, 0.003, 0.006, MAT.led, 0, 0.029, -0.034));
    } else {
      const dark = k === "flat" || k === "basket" || k === "trousers" || k === "grid";
      const wm = dark ? MAT.graphite : liner,
        wallH = h - 0.012,
        hh = wallH - 0.012;
      g.add(box(W - 0.03, 0.012, Dd, wm, 0, 0.014, zc));
      g.add(box(0.012, wallH, Dd, wm, -(W / 2 - 0.02), 0.008 + wallH / 2, zc));
      g.add(box(0.012, wallH, Dd, wm, W / 2 - 0.02, 0.008 + wallH / 2, zc));
      g.add(box(W - 0.03, wallH, 0.012, wm, 0, 0.008 + wallH / 2, -(0.02 + Dd) + 0.006));
      if (dark) {
        g.add(box(W - 0.05, 0.004, Dd - 0.03, liner, 0, 0.022, zc));
        if (k === "flat" || k === "basket" || k === "trousers") {
          for (let s = -1; s <= 1; s += 2)
            g.add(box(0.004, wallH - 0.008, Dd - 0.03, liner, s * (W / 2 - 0.02 - 0.008), 0.012 + (wallH - 0.008) / 2, zc));
          g.add(box(W - 0.05, wallH - 0.008, 0.004, liner, 0, 0.012 + (wallH - 0.008) / 2, -(0.02 + Dd) + 0.014));
        }
      }
      const dm = mat(DIV[k] || "#222", 0.7);
      if (k === "trousers") {
        const n = 9;
        for (let i = 0; i < n; i++) g.add(cyl(0.0065, iw, MAT.graphite, "x", 0, h - 0.03, -0.07 - i * 0.045, 10));
        g.add(box(iw, 0.004, 0.02, MAT.alu, 0, h - 0.034, -0.035));
      } else if (k === "compart") {
        const lw = iw * 0.62;
        dividers(g, dm, x0, x0 + lw, zc, dl, hh, 3, 2);
        g.add(box(0.005, hh, dl, dm, x0 + lw, 0.02 + hh / 2, zc));
      } else if (k === "grid") {
        dividers(g, dm, x0, x1, zc, dl, hh, W > 0.7 ? 9 : 6, 3);
      } else if (k === "jewel1") {
        dividers(g, dm, x0, x1, zc, dl, hh, W > 0.7 ? 7 : 5, 2);
        ribbed(g, -0.06, -0.14, 0.06, 0.09, 0.02, "#b09a91", "#7d655c");
        ribbed(g, 0.06, -0.14, 0.06, 0.09, 0.02, "#b09a91", "#7d655c");
      } else if (k === "jewel2") {
        dividers(g, dm, x0 + 0.1, x1, zc, dl, hh, W > 0.7 ? 6 : 4, 3);
        const rr = mat("#b9a898", 0.9);
        for (let b = 0; b < 4; b++) g.add(cyl(0.012, 0.28, rr, "z", x0 + 0.03 + b * 0.022, 0.032, -0.26, 10));
        g.add(box(0.04, 0.022, 0.04, MAT.graphite, x1 - 0.05, 0.03, -0.06));
        g.add(box(0.04, 0.022, 0.04, MAT.graphite, x1 - 0.1, 0.03, -0.06));
      }
    }
    if (state.handle && !it.noHandle) g.add(makeHandle(byId(HANDLES, state.handle)!, h));
    return g;
  }

  /* ---------- ручки (по фото) ---------- */
  function makeHandle(hd: (typeof HANDLES)[number], h: number) {
    const g = new THREE.Group(),
      L = hd.len / 1000;
    g.position.set(0, h > 0.2 ? h - 0.05 : h * 0.55, 0);
    const pocket = (w: number, hh: number) => g.add(box(w, hh, 0.003, MAT.graphite, 0, 0, 0.0015));
    if (hd.shape === "tab") {
      g.add(box(0.03, 0.006, 0.02, MAT.gray, 0, 0.002, 0.012));
      g.add(box(0.03, 0.018, 0.004, MAT.gray, 0, -0.006, 0.022));
    } else if (hd.shape === "half") {
      pocket(L + 0.016, 0.05);
      const c = cyl(0.018, L, mat("#8e7b72", 0.85), "x", 0, -0.002, 0.012, 22);
      c.scale.set(1, 1, 0.7);
      g.add(c);
    } else if (hd.shape === "bar") {
      g.add(box(L, 0.016, 0.014, MAT.alu, 0, 0, 0.027));
      g.add(box(0.012, 0.016, 0.024, MAT.alu, -(L / 2 - 0.006), 0, 0.012));
      g.add(box(0.012, 0.016, 0.024, MAT.alu, L / 2 - 0.006, 0, 0.012));
    } else if (hd.shape === "pull") {
      pocket(L + 0.012, 0.034);
      g.add(box(L - 0.01, 0.012, 0.012, mat("#b9b5b1", 0.4, 0.7), 0, 0.003, 0.008));
      for (let r = 0; r < 4; r++) g.add(box(L - 0.012, 0.0015, 0.0015, MAT.gray, 0, -0.004 + r * 0.0035, 0.0145));
    } else {
      pocket(L + 0.016, 0.05);
      g.add(box(0.016, 0.04, 0.014, mat("#b8805d", 0.8), 0, 0, 0.01));
      g.add(box(0.034, 0.012, 0.014, mat("#b8805d", 0.8), 0, 0.014, 0.01));
      g.add(box(L - 0.02, 0.01, 0.008, mat("#b8805d", 0.8), 0, -0.012, 0.008));
    }
    return g;
  }

  /* ---------- штанга ---------- */
  function buildRod(kind: string, rl: number) {
    const g = new THREE.Group(),
      y = H - 0.06,
      body = rl - 0.04;
    let mesh: any;
    if (kind === "metal") {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(body, 0.03, 0.026), MAT.rodMetal);
    } else {
      const cg = new THREE.CylinderGeometry(0.0155, 0.0155, body, 28);
      cg.rotateZ(Math.PI / 2);
      if (kind === "braid") {
        const m = MAT.rodBraid.clone();
        m.map = MAT.rodBraid.map.clone();
        m.map.needsUpdate = true;
        m.map.repeat.set(body / 0.05, 3);
        mesh = new THREE.Mesh(cg, m);
        g.userData.owned = m;
      } else {
        mesh = new THREE.Mesh(cg, MAT.rodLeather);
        mesh.scale.set(1, 0.78, 1.15);
      }
    }
    mesh.position.set(0, y, 0);
    mesh.castShadow = true;
    g.add(mesh);
    const bm = kind === "metal" ? MAT.aluDark : kind === "braid" ? MAT.alu : MAT.gray;
    for (let s = -1; s <= 1; s += 2) {
      g.add(box(0.022, 0.085, 0.05, bm, s * (rl / 2 - 0.011), H - 0.0425, 0));
      g.add(box(0.022, 0.02, 0.07, bm, s * (rl / 2 - 0.011), H - 0.01, 0));
    }
    return g;
  }

  /* ---------- одежда ---------- */
  function garmentGeo(L: number, Wd: number) {
    const s = new THREE.Shape(),
      a = Wd / 2;
    s.moveTo(-0.04, -0.02);
    s.lineTo(-a, -0.07);
    s.lineTo(-a - 0.02, -0.3);
    s.lineTo(-a + 0.045, -0.32);
    s.lineTo(-a + 0.05, -L);
    s.lineTo(a - 0.05, -L);
    s.lineTo(a - 0.045, -0.32);
    s.lineTo(a + 0.02, -0.3);
    s.lineTo(a, -0.07);
    s.lineTo(0.04, -0.02);
    s.lineTo(-0.04, -0.02);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false });
    g.translate(0, 0, -0.01);
    g.rotateY(Math.PI / 2);
    return g;
  }

  /* ---------- стойка для обуви ---------- */
  function buildRack(kind: string) {
    const g = new THREE.Group(),
      w = kind === "360" ? 0.73 : 0.5,
      d = 0.35,
      hg = 2.0;
    const fm = kind === "360" ? MAT.alu : MAT.graphite;
    g.add(box(w, 0.03, d, fm, 0, 0.015, 0));
    g.add(box(w, 0.03, d, fm, 0, hg + 0.015, 0));
    const px = kind === "360" ? [-1, 1] : [-1],
      pz = kind === "360" ? [-1, 1] : [0];
    px.forEach((sx) => {
      pz.forEach((sz) => {
        g.add(box(0.03, hg, 0.03, fm, sx * (w / 2 - 0.02), hg / 2 + 0.03, sz * (d / 2 - 0.02)));
      });
    });
    const n = 9;
    for (let i = 0; i < n; i++) {
      const y = 0.2 + i * 0.19,
        sh = box(w - 0.07, 0.012, d - 0.05, MAT.shelfBrown, 0, y, 0);
      sh.rotation.x = -0.2;
      g.add(sh);
      g.add(box(w - 0.06, 0.014, 0.012, fm, 0, y - 0.02, d / 2 - 0.045));
    }
    g.userData.w = w;
    return g;
  }

  /* ---------- сборка секции ---------- */
  function build() {
    if (!renderer) return;
    clearGroup(wardrobe);
    if (rackGroup) {
      assembly.remove(rackGroup);
      clearGroup(rackGroup);
      rackGroup = null;
    }
    drawerGroups = {};
    fronts = [];
    const W = secW(),
      t = 0.018;
    wardrobe.userData.W = W;

    wardrobe.add(box(t, H, D, MAT.carc, -(W / 2 + t / 2), H / 2, 0));
    wardrobe.add(box(t, H, D, MAT.carc, W / 2 + t / 2, H / 2, 0));
    wardrobe.add(box(W + 2 * t, t, D, MAT.carc, 0, H + t / 2, 0));
    wardrobe.add(box(W, H, 0.01, MAT.back, 0, H / 2, -D / 2 + 0.005));
    wardrobe.add(box(W + 2 * t, PLINTH, D - 0.03, MAT.plinth, 0, PLINTH / 2, -0.015));

    let y = PLINTH + 0.01;
    for (let i = state.drawers.length - 1; i >= 0; i--) {
      const d = state.drawers[i],
        it = byId(DRAWERS, d.code)!;
      const g = buildDrawer(it, W, d.id);
      g.position.set(0, y, D / 2 + d.pull);
      wardrobe.add(g);
      drawerGroups[d.id] = g;
      y += it.h / 1000 + 0.012;
    }

    if (state.rod) {
      const rl = state.rodLen / 1000,
        rodY = H - 0.06;
      wardrobe.add(buildRod(state.rod, rl));
      if (state.clothes) {
        const variants = [
          { L: 0.72, Wd: 0.4 },
          { L: 0.98, Wd: 0.36 },
          { L: 1.0, Wd: 0.44 },
          { L: 0.8, Wd: 0.38 },
        ];
        const geos = variants.map((v) => garmentGeo(v.L, v.Wd));
        const n = Math.floor((rl - 0.1) / 0.058);
        for (let k = 0; k < n; k++) {
          const gm = new THREE.Mesh(geos[(k * 7 + 1) % 4], MAT.garments[(k * 5 + 2) % MAT.garments.length]);
          gm.position.set(-((n - 1) * 0.058) / 2 + k * 0.058, rodY - 0.012, 0);
          gm.castShadow = true;
          gm.receiveShadow = true;
          wardrobe.add(gm);
        }
      }
    }

    const left = -(W / 2 + t);
    let right = W / 2 + t;
    if (state.rack) {
      rackGroup = buildRack(state.rack);
      const rw = rackGroup.userData.w,
        gap = 0.14;
      rackGroup.position.set(right + gap + rw / 2, 0, 0);
      assembly.add(rackGroup);
      right = right + gap + rw;
      rackSpin = state.rack === "360";
    } else rackSpin = false;
    const total = right - left,
      cx = (left + right) / 2;
    assembly.position.x = -cx;
    wardrobe.userData.total = total;
    const sc = Math.max(1, (total / 2 + 0.9) / 2.1);
    platform.scale.set(sc, 1, sc);
    frame();
  }

  /* ================= КАМЕРА ================= */
  const HOME = { theta: 0.5, phi: 1.3, radius: 6 };
  const view: any = { theta: 0.5, phi: 1.3, radius: 6, target: null };
  const goal: any = { theta: 0.5, phi: 1.3, radius: 6, target: null };
  let reelMode = false;
  function frame() {
    if (!renderer) return;
    const Wt = wardrobe.userData.total || 0.7,
      tn = Math.tan((camera.fov * Math.PI) / 360);
    const rv = 2.75 / (2 * tn),
      rh = (Wt + 1.0) / (2 * tn * camera.aspect);
    HOME.radius = Math.max(rv, rh) * 1.04;
    goal.radius = HOME.radius;
  }
  function placeCamera() {
    const s = Math.sin(view.phi);
    camera.position.set(
      view.target.x + view.radius * s * Math.sin(view.theta),
      view.target.y + view.radius * Math.cos(view.phi),
      view.target.z + view.radius * s * Math.cos(view.theta)
    );
    camera.lookAt(view.target);
  }
  function resize() {
    if (!renderer) return;
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frame();
  }

  /* ================= ВЗАИМОДЕЙСТВИЕ ================= */
  const pts = new Map<number, { x: number; y: number }>();
  let moved = 0,
    pinchD = 0,
    dragging = false;
  function setupPointer() {
    const rc = new THREE.Raycaster(),
      ndc = new THREE.Vector2();
    function hit(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ndc, camera);
      const res = rc.intersectObjects(fronts, false);
      return res.length ? res[0].object.userData.drawerId : null;
    }
    function pdist() {
      const a = Array.from(pts.values());
      return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
    }
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      dragging = true;
      if (pts.size === 2) pinchD = pdist();
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = pts.get(e.pointerId);
      if (!p) {
        canvas.style.cursor = hit(e) ? "pointer" : "";
        return;
      }
      const dx = e.clientX - p.x,
        dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pts.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy);
        goal.theta = clamp(goal.theta - dx * 0.006, -1.4, 1.4);
        goal.phi = clamp(goal.phi - dy * 0.005, 0.8, 1.5);
      } else if (pts.size === 2) {
        const dd = pdist();
        goal.radius = clamp((goal.radius * pinchD) / dd, 2.6, 11);
        pinchD = dd;
        moved += 10;
      }
    });
    canvas.addEventListener("pointerup", (e) => {
      const single = pts.size === 1;
      pts.delete(e.pointerId);
      if (!pts.size) dragging = false;
      if (single && moved < 6) {
        const id = hit(e);
        if (id) {
          const d = state.drawers.filter((x) => x.id === id)[0];
          if (d) {
            d.open = !d.open;
            syncTools();
          }
        }
      }
    });
    canvas.addEventListener("pointercancel", (e) => {
      pts.delete(e.pointerId);
      if (!pts.size) dragging = false;
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        goal.radius = clamp(goal.radius * Math.exp(e.deltaY * 0.001), 2.6, 11);
      },
      { passive: false }
    );
  }

  /* ================= РЕЖИМ ДЛЯ РИЛСА ================= */
  let reelTimer: any = null,
    reelTimeouts: any[] = [];
  function reelCycle() {
    reelTimeouts.forEach(clearTimeout);
    reelTimeouts = [];
    state.drawers.forEach((d) => (d.open = false));
    state.drawers
      .slice()
      .reverse()
      .forEach((d, i) => {
        reelTimeouts.push(
          setTimeout(() => {
            d.open = true;
          }, 700 + i * 520)
        );
      });
  }
  function enterReel() {
    reelMode = true;
    document.body.classList.add("reel");
    state.clothes = true;
    build();
    syncTools();
    reelCycle();
    reelTimer = setInterval(reelCycle, 8200);
    setTimeout(resize, 30);
  }
  function exitReel() {
    reelMode = false;
    document.body.classList.remove("reel");
    clearInterval(reelTimer);
    reelTimeouts.forEach(clearTimeout);
    reelTimeouts = [];
    state.drawers.forEach((d) => (d.open = true));
    syncTools();
    goal.theta = HOME.theta;
    goal.phi = HOME.phi;
    setTimeout(resize, 30);
  }

  /* ================= ЦЕНА И ЗАКАЗ ================= */
  function totals() {
    let sum = 0,
      cnt = 0;
    if (state.rod) {
      sum += rPrice(byId(RODS, state.rod)!);
      cnt++;
    }
    state.drawers.forEach((d) => {
      sum += dPrice(byId(DRAWERS, d.code)!);
      cnt++;
    });
    if (state.handle) {
      const n = handleCount();
      sum += byId(HANDLES, state.handle)!.price * n;
      cnt += n;
    }
    if (state.rack) {
      sum += byId(RACKS, state.rack)!.price;
      cnt++;
    }
    return { sum, cnt };
  }
  interface OrderItem {
    sku: string;
    group: string;
    size: string;
    unitPrice: number;
    qty: number;
  }
  function orderText() {
    const L = ["Здравствуйте! Хочу заказать секцию гардеробной.", "Ширина секции: " + state.width + " мм", ""];
    if (state.rod) {
      const r = byId(RODS, state.rod)!;
      L.push("• " + r.name + ", " + state.rodLen + " мм (Арт. " + rArt(r) + ") — " + fmt(rPrice(r)));
    }
    const counts: Record<string, number> = {},
      order: string[] = [];
    state.drawers.forEach((d) => {
      if (!counts[d.code]) {
        counts[d.code] = 0;
        order.push(d.code);
      }
      counts[d.code]++;
    });
    order.forEach((c) => {
      const it = byId(DRAWERS, c)!;
      L.push("• " + it.name + " (Арт. " + dArt(it) + ") × " + counts[c] + " — " + fmt(dPrice(it) * counts[c]));
    });
    if (state.handle) {
      const hd = byId(HANDLES, state.handle)!,
        n = handleCount();
      L.push("• " + hd.name + " (Арт. " + hd.art + ") × " + n + " — " + fmt(hd.price * n));
    }
    if (state.rack) {
      const rk = byId(RACKS, state.rack)!;
      L.push("• " + rk.name + " (Арт. " + rk.art + "), под заказ — " + fmt(rk.price));
    }
    L.push("");
    L.push("Итого: " + fmt(totals().sum));
    return L.join("\n");
  }
  function orderItems(): OrderItem[] {
    const items: OrderItem[] = [];
    if (state.rod) {
      const r = byId(RODS, state.rod)!;
      items.push({ sku: rArt(r), group: r.name, size: state.rodLen + " мм", unitPrice: rPrice(r), qty: 1 });
    }
    const counts: Record<string, number> = {},
      order: string[] = [];
    state.drawers.forEach((d) => {
      if (!counts[d.code]) {
        counts[d.code] = 0;
        order.push(d.code);
      }
      counts[d.code]++;
    });
    order.forEach((c) => {
      const it = byId(DRAWERS, c)!;
      items.push({ sku: dArt(it), group: it.name, size: state.width + " мм", unitPrice: dPrice(it), qty: counts[c] });
    });
    if (state.handle) {
      const hd = byId(HANDLES, state.handle)!,
        n = handleCount();
      items.push({ sku: hd.art, group: hd.name, size: hd.len + " мм", unitPrice: hd.price, qty: n });
    }
    if (state.rack) {
      const rk = byId(RACKS, state.rack)!;
      items.push({ sku: rk.art, group: rk.name, size: rk.dim, unitPrice: rk.price, qty: 1 });
    }
    return items;
  }

  /* ================= ИНТЕРФЕЙС ================= */
  function chip(label: string, act: string, v: string | number, on: boolean) {
    return (
      '<button type="button" class="chip" data-act="' +
      act +
      '" data-v="' +
      v +
      '" data-key="' +
      act +
      "|" +
      v +
      '" aria-pressed="' +
      (on ? "true" : "false") +
      '">' +
      label +
      "</button>"
    );
  }
  function chipI(label: string, act: string, v: string, on: boolean, src: string | undefined, zk: string) {
    return (
      '<span class="chip pic' +
      (on ? " on" : "") +
      '">' +
      (src
        ? '<button type="button" class="zb" data-zoom="' +
          zk +
          '" aria-label="Увеличить фото" title="Увеличить фото"><img src="' +
          src +
          '" alt=""></button>'
        : "") +
      '<button type="button" class="cb" data-act="' +
      act +
      '" data-v="' +
      v +
      '" data-key="' +
      act +
      "|" +
      v +
      '" aria-pressed="' +
      (on ? "true" : "false") +
      '">' +
      label +
      "</button></span>"
    );
  }
  function th(src: string | undefined, zk: string) {
    return src
      ? '<button type="button" class="zb" data-zoom="' +
          zk +
          '" aria-label="Увеличить фото" title="Увеличить фото"><img class="th" src="' +
          src +
          '" alt="" width="58" height="58"></button>'
      : "";
  }
  function dImg(it: (typeof DRAWERS)[number]) {
    return IMG[it.id + "-06"];
  }

  function render() {
    const active = document.activeElement as HTMLElement | null,
      key = active && active.getAttribute && active.getAttribute("data-key");

    $("r-width").innerHTML =
      '<div class="seg">' +
      chip("564 мм", "width", 564, state.width === 564) +
      chip("864 мм", "width", 864, state.width === 864) +
      '</div><div class="cap">Ширина выдвижных элементов каталога.</div>';

    let rh =
      '<div class="seg">' +
      chip("Без штанги", "rod", "none", !state.rod) +
      RODS.map((r) => chipI(r.short, "rod", r.id, state.rod === r.id, IMG[r.fam + "-06"], "r:" + r.id)).join("") +
      "</div>";
    if (state.rod) {
      const r = byId(RODS, state.rod)!;
      rh +=
        '<div class="seg" style="margin-top:10px">' +
        allowedLens()
          .map((l) => chip(l + " мм", "rodlen", l, state.rodLen === l))
          .join("") +
        '</div><div class="cap">' +
        r.name +
        " · Арт. " +
        rArt(r) +
        " · " +
        fmt(rPrice(r)) +
        "</div>";
    }
    $("r-rod").innerHTML = rh;

    const used = stackMM(),
      pct = clamp((used / STACK_LIMIT) * 100, 0, 100);
    $("r-meter").innerHTML =
      '<div class="cap" style="margin:-4px 0 8px">Занято ' +
      used +
      " из " +
      STACK_LIMIT +
      ' мм высоты</div><div class="meter"><i style="width:' +
      pct +
      '%"></i></div>';

    let sh: string;
    if (!state.drawers.length) {
      sh = '<div class="empty">Секция пока пустая. Добавьте ящик или полку из списка ниже.</div>';
    } else {
      sh =
        '<ul class="list">' +
        state.drawers
          .map((d, i) => {
            const it = byId(DRAWERS, d.code)!;
            return (
              '<li class="row">' +
              th(dImg(it), "d:" + it.id) +
              '<div class="rt"><b>' +
              it.name +
              "</b><span>Арт. " +
              dArt(it) +
              " · " +
              it.h +
              " мм · " +
              fmt(dPrice(it)) +
              '</span></div><div class="ctl">' +
              '<button type="button" class="mini" data-act="up" data-i="' +
              i +
              '" data-key="up|' +
              d.id +
              '" aria-label="Выше"' +
              (i === 0 ? " disabled" : "") +
              ">↑</button>" +
              '<button type="button" class="mini" data-act="down" data-i="' +
              i +
              '" data-key="down|' +
              d.id +
              '" aria-label="Ниже"' +
              (i === state.drawers.length - 1 ? " disabled" : "") +
              ">↓</button>" +
              '<button type="button" class="mini" data-act="del" data-i="' +
              i +
              '" data-key="del|' +
              d.id +
              '" aria-label="Убрать">✕</button></div></li>'
            );
          })
          .join("") +
        '</ul><div class="cap">Порядок: сверху вниз, как в секции.</div>';
    }
    $("r-stack").innerHTML = sh;

    $("r-picker").innerHTML =
      '<ul class="list">' +
      DRAWERS.map((it) => {
        const can = used + it.h + 12 <= STACK_LIMIT;
        return (
          '<li class="row">' +
          th(dImg(it), "d:" + it.id) +
          '<div class="rt"><b>' +
          it.name +
          "</b><span>Арт. " +
          dArt(it) +
          " · высота " +
          it.h +
          ' мм</span></div><span class="pr">' +
          fmt(dPrice(it)) +
          '</span><button type="button" class="mini add" data-act="add" data-v="' +
          it.id +
          '" data-key="add|' +
          it.id +
          '"' +
          (can ? "" : " disabled") +
          ' aria-label="Добавить: ' +
          it.name +
          '">+</button></li>'
        );
      }).join("") +
      "</ul>";

    $("r-handle").innerHTML =
      '<div class="seg">' +
      chip("Без ручек", "handle", "none", !state.handle) +
      HANDLES.map((h) => chipI(h.short, "handle", h.id, state.handle === h.id, IMG[HANDLE_IMG[h.id]], "h:" + h.id)).join("") +
      "</div>" +
      (state.handle
        ? '<div class="cap">' +
          byId(HANDLES, state.handle)!.name +
          " · Арт. " +
          byId(HANDLES, state.handle)!.art +
          " · " +
          fmt(byId(HANDLES, state.handle)!.price) +
          " за штуку, по одной на ящик.</div>"
        : "");

    $("r-rack").innerHTML =
      '<div class="seg">' +
      chip("Без стойки", "rack", "none", !state.rack) +
      RACKS.map((k) => chipI(k.short + '<span class="tag">под заказ</span>', "rack", k.id, state.rack === k.id, RACKIMG[k.id], "k:" + k.id)).join(
        ""
      ) +
      "</div>" +
      (state.rack
        ? '<div class="cap">' +
          byId(RACKS, state.rack)!.name +
          " · Арт. " +
          byId(RACKS, state.rack)!.art +
          " · " +
          byId(RACKS, state.rack)!.dim +
          " · " +
          fmt(byId(RACKS, state.rack)!.price) +
          "</div>"
        : "");

    const tt = totals();
    $("b-total").textContent = fmt(tt.sum);
    $("b-count").textContent = tt.cnt ? "Позиций: " + tt.cnt : "Пока ничего не выбрано";

    if (key) {
      const el = document.querySelector('[data-key="' + key + '"]') as HTMLButtonElement | null;
      if (el && !el.disabled) el.focus();
    }
  }
  function syncTools() {
    const anyOpen = state.drawers.some((d) => d.open);
    $("tAll").textContent = anyOpen ? "Закрыть ящики" : "Открыть ящики";
    $("tClothes").textContent = state.clothes ? "Скрыть одежду" : "Показать одежду";
    ($("tClothes") as HTMLElement).style.display = state.rod ? "" : "none";
  }
  function ensureRodLen() {
    if (allowedLens().indexOf(state.rodLen) < 0) state.rodLen = state.width === 564 ? 500 : 800;
  }

  function handleDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const zm = target.closest && (target.closest("[data-zoom]") as HTMLElement | null);
    if (zm) {
      openZoom(zm.getAttribute("data-zoom")!);
      return;
    }
    const el = target.closest && (target.closest("[data-act]") as HTMLElement | null);
    if (!el) return;
    const a = el.getAttribute("data-act"),
      v = el.getAttribute("data-v"),
      i = +el.getAttribute("data-i")!;
    let t;
    if (a === "width") {
      state.width = +v! as 564 | 864;
      ensureRodLen();
      build();
    } else if (a === "rod") {
      state.rod = v === "none" ? null : v;
      build();
    } else if (a === "rodlen") {
      state.rodLen = +v!;
      build();
    } else if (a === "handle") {
      state.handle = v === "none" ? null : v;
      build();
    } else if (a === "rack") {
      state.rack = v === "none" ? null : v;
      build();
    } else if (a === "add") {
      const it = byId(DRAWERS, v)!;
      if (stackMM() + it.h + 12 <= STACK_LIMIT) {
        state.drawers.unshift(mk(v!));
        build();
      }
    } else if (a === "del") {
      state.drawers.splice(i, 1);
      build();
    } else if (a === "up" && i > 0) {
      t = state.drawers[i];
      state.drawers[i] = state.drawers[i - 1];
      state.drawers[i - 1] = t;
      build();
    } else if (a === "down" && i < state.drawers.length - 1) {
      t = state.drawers[i];
      state.drawers[i] = state.drawers[i + 1];
      state.drawers[i + 1] = t;
      build();
    } else if (a === "toggleAll") {
      const any = state.drawers.some((d) => d.open);
      state.drawers.forEach((d) => (d.open = !any));
    } else if (a === "clothes") {
      state.clothes = !state.clothes;
      build();
    } else if (a === "reel") {
      enterReel();
      return;
    } else if (a === "exitReel") {
      exitReel();
      return;
    } else if (a === "order") {
      openOrder();
      return;
    }
    render();
    syncTools();
  }
  function handleDocKeydown(e: KeyboardEvent) {
    if (!($("lb") as HTMLElement).hidden) {
      if (e.key === "Escape") closeZoom();
      else if (e.key === "ArrowLeft") stepZoom(-1);
      else if (e.key === "ArrowRight") stepZoom(1);
      return;
    }
    if (e.key === "Escape") {
      if (!($("modal") as HTMLElement).hidden) closeOrder();
      else if (reelMode) exitReel();
    }
  }
  document.addEventListener("click", handleDocClick);
  document.addEventListener("keydown", handleDocKeydown);

  /* ---------- просмотр фото ---------- */
  let zoomKey: string | null = null,
    zoomBack: HTMLElement | null = null;
  function zoomKeys() {
    return DRAWERS.map((d) => "d:" + d.id).concat(
      RODS.map((r) => "r:" + r.id),
      HANDLES.map((h) => "h:" + h.id),
      RACKS.map((k) => "k:" + k.id)
    );
  }
  function zoomInfo(key: string) {
    const t = key.charAt(0),
      id = key.slice(2),
      o: any = { src: BIG[key] };
    if (t === "d") {
      const it = byId(DRAWERS, id)!;
      o.title = it.name;
      o.sub = "Арт. " + dArt(it) + " · " + state.width + "×492×" + it.h + " мм";
      o.price = fmt(dPrice(it));
      o.can = stackMM() + it.h + 12 <= STACK_LIMIT;
      o.btn = o.can ? "Добавить в секцию" : "Нет места в секции";
      o.act = () => state.drawers.unshift(mk(id));
    } else if (t === "r") {
      const r = byId(RODS, id)!;
      o.title = r.name;
      o.sub = "Арт. " + rArt(r) + " · " + state.rodLen + " мм";
      o.price = fmt(rPrice(r));
      o.can = true;
      o.btn = state.rod === id ? "Уже выбрана" : "Выбрать штангу";
      if (state.rod === id) o.can = false;
      o.act = () => {
        state.rod = id;
      };
    } else if (t === "h") {
      const h = byId(HANDLES, id)!;
      o.title = h.name;
      o.sub = "Арт. " + h.art + " · " + h.len + " мм · цена за штуку";
      o.price = fmt(h.price);
      o.can = state.handle !== id;
      o.btn = o.can ? "Выбрать ручки" : "Уже выбраны";
      o.act = () => {
        state.handle = id;
      };
    } else {
      const k = byId(RACKS, id)!;
      o.title = k.name;
      o.sub = "Арт. " + k.art + " · " + k.dim + " · под заказ";
      o.price = fmt(k.price);
      o.can = state.rack !== id;
      o.btn = o.can ? "Добавить стойку" : "Уже добавлена";
      o.act = () => {
        state.rack = id;
      };
    }
    return o;
  }
  function showZoom(key: string) {
    const o = zoomInfo(key);
    zoomKey = key;
    ($("lbimg") as HTMLImageElement).src = o.src;
    ($("lbimg") as HTMLImageElement).alt = o.title;
    $("lbi").classList.remove("z");
    ($("lbimg") as HTMLElement).style.transformOrigin = "50% 50%";
    ($("lbh") as HTMLElement).style.display = "";
    $("lbt").textContent = o.title;
    $("lbs").textContent = o.sub;
    $("lbpr").textContent = o.price;
    const b = $("lba") as HTMLButtonElement;
    b.textContent = o.btn;
    b.disabled = !o.can;
    b.onclick = () => {
      if (!o.can) return;
      o.act();
      closeZoom();
      build();
      render();
      syncTools();
    };
  }
  function openZoom(key: string) {
    zoomBack = document.activeElement as HTMLElement;
    showZoom(key);
    ($("lb") as HTMLElement).hidden = false;
    $("lbx").focus();
  }
  function closeZoom() {
    ($("lb") as HTMLElement).hidden = true;
    if (zoomBack && zoomBack.focus && document.contains(zoomBack)) zoomBack.focus();
  }
  function stepZoom(d: number) {
    const ks = zoomKeys(),
      i = ks.indexOf(zoomKey!);
    showZoom(ks[(i + d + ks.length) % ks.length]);
  }
  $("lbx").addEventListener("click", closeZoom);
  $("lbp").addEventListener("click", () => stepZoom(-1));
  $("lbn").addEventListener("click", () => stepZoom(1));
  $("lb").addEventListener("click", (e) => {
    if (e.target === $("lb")) closeZoom();
  });
  $("lbi").addEventListener("click", () => {
    const box = $("lbi"),
      on = box.classList.toggle("z");
    ($("lbh") as HTMLElement).style.display = on ? "none" : "";
  });
  $("lbi").addEventListener("pointermove", (e: any) => {
    const box = $("lbi");
    if (!box.classList.contains("z")) return;
    const r = box.getBoundingClientRect();
    ($("lbimg") as HTMLElement).style.transformOrigin =
      (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "% " + (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%";
  });

  /* ---------- заказ ---------- */
  let orderSending = false;
  function openOrder() {
    (document.getElementById("otext") as HTMLTextAreaElement).value = orderText();
    $("ook").textContent = "";
    ($("oname") as HTMLInputElement).value = "";
    ($("ophone") as HTMLInputElement).value = "";
    $("osent").style.display = "none";
    $("oform").style.display = "";
    const err = document.getElementById("oerr");
    if (err) err.textContent = "";
    ($("modal") as HTMLElement).hidden = false;
    ($("oname") as HTMLInputElement).focus();
  }
  function closeOrder() {
    ($("modal") as HTMLElement).hidden = true;
  }
  $("oclose").addEventListener("click", closeOrder);
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) closeOrder();
  });
  $("ocopy").addEventListener("click", () => {
    const ta = document.getElementById("otext") as HTMLTextAreaElement;
    function done() {
      $("ook").textContent = "Скопировано.";
    }
    function fb() {
      try {
        ta.focus();
        ta.select();
        document.execCommand("copy");
        done();
      } catch {
        $("ook").textContent = "Выделите текст и скопируйте вручную.";
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fb);
    else fb();
  });
  $("osubmit").addEventListener("click", async () => {
    if (orderSending) return;
    const name = ($("oname") as HTMLInputElement).value.trim();
    const phone = ($("ophone") as HTMLInputElement).value.trim();
    const err = document.getElementById("oerr")!;
    if (!name || !phone) {
      err.textContent = "Укажите имя и телефон";
      return;
    }
    err.textContent = "";
    orderSending = true;
    const btn = $("osubmit") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Отправка...";
    try {
      const res = await fetch("/api/shop/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems(), customerName: name, customerPhone: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        err.textContent = data.error || "Не удалось отправить заявку";
        return;
      }
      $("oform").style.display = "none";
      $("osent").style.display = "";
    } catch {
      err.textContent = "Не удалось отправить заявку, проверьте соединение";
    } finally {
      orderSending = false;
      btn.disabled = false;
      btn.textContent = "Отправить заявку";
    }
  });

  /* ================= ЗАПУСК ================= */
  const ok = initGL();
  render();
  syncTools();

  let loopId = 0;
  let darkModeQuery: MediaQueryList | null = null;
  let themeObserver: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;

  if (ok) {
    view.target = new THREE.Vector3(0, 1.2, 0);
    goal.target = new THREE.Vector3(0, 1.2, 0);
    setupPointer();
    build();
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    } else {
      window.addEventListener("resize", resize);
    }
    resize();
    view.radius = goal.radius;
    view.theta = HOME.theta;
    view.phi = HOME.phi;
    goal.theta = HOME.theta;
    goal.phi = HOME.phi;
    darkModeQuery = matchMedia("(prefers-color-scheme: dark)");
    darkModeQuery.addEventListener("change", applyTheme);
    themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const t0 = performance.now();
    (function loop(now: number) {
      const t = (now - t0) / 1000,
        k = reduce ? 1 : 0.11;
      if (reelMode && !dragging && !reduce) {
        goal.theta = 0.5 + Math.sin(t * 0.35) * 0.75;
        goal.phi = 1.25 + Math.sin(t * 0.23) * 0.08;
      }
      view.theta += (goal.theta - view.theta) * k;
      view.phi += (goal.phi - view.phi) * k;
      view.radius += (goal.radius - view.radius) * k;
      view.target.lerp(goal.target, k);
      placeCamera();
      state.drawers.forEach((d) => {
        const tg = d.open ? PULL : 0;
        d.pull += (tg - d.pull) * (reduce ? 1 : 0.09);
        const g = drawerGroups[d.id];
        if (g) g.position.z = D / 2 + d.pull;
      });
      if (rackGroup && rackSpin && !reduce) rackGroup.rotation.y = t * 0.5;
      renderer.render(scene, camera);
      loopId = requestAnimationFrame(loop);
    })(t0);
  }

  return function cleanup() {
    cancelAnimationFrame(loopId);
    clearInterval(reelTimer);
    reelTimeouts.forEach(clearTimeout);
    document.removeEventListener("click", handleDocClick);
    document.removeEventListener("keydown", handleDocKeydown);
    if (darkModeQuery) darkModeQuery.removeEventListener("change", applyTheme);
    if (themeObserver) themeObserver.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    else window.removeEventListener("resize", resize);
    if (renderer) renderer.dispose();
  };
}
