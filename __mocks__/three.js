/**
 * Manual Jest mock for `three`.
 *
 * BoardView3D and board3dGeometry build Three.js objects at runtime inside
 * useMemo / buildTubeGroup. The Canvas mock (react-three/fiber/native) already
 * drops R3F children in tests, so these constructors only need to exist and
 * return plain objects — they are never actually rendered.
 */
const noop = () => undefined;

const makeClass = (proto = {}) =>
  class {
    constructor(..._args) {
      Object.assign(this, proto);
    }
  };

const Vector3 = class {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  set() { return this; }
  copy() { return this; }
  normalize() { return this; }
  add() { return this; }
  multiplyScalar() { return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
};

const Vector2 = class {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
};

const Raycaster = class {
  setFromCamera() {}
  intersectObject() { return []; }
};

const Color = makeClass({ r: 0, g: 0, b: 0, set: noop });
const Group = class {
  constructor() {
    this.userData = {};
    this.children = [];
    this.position = { x: 0, y: 0, z: 0, set: noop, copy: noop };
  }
  add() {}
  traverse(cb) { cb(this); }
};
const Mesh = class {
  constructor() {
    this.userData = {};
    this.isMesh = true;
    this.material = { opacity: 1 };
  }
};
Object.defineProperty(Mesh.prototype, "position", {
  get() { return { set: noop, copy: noop }; },
});

const BoxGeometry = makeClass();
const TubeGeometry = makeClass();
const ConeGeometry = makeClass();
const CatmullRomCurve3 = makeClass();
const MeshStandardMaterial = makeClass();
const MeshBasicMaterial = makeClass();
const LineBasicMaterial = makeClass();
const PerspectiveCamera = makeClass({ aspect: 1, updateProjectionMatrix: noop });

const AdditiveBlending = 2;

module.exports = {
  __esModule: true,
  Vector3,
  Vector2,
  Raycaster,
  Color,
  Group,
  Mesh,
  BoxGeometry,
  TubeGeometry,
  ConeGeometry,
  CatmullRomCurve3,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  PerspectiveCamera,
  AdditiveBlending,
};
