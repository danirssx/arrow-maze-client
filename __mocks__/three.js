/**
 * Manual Jest mock for `three`.
 *
 * BoardView3D and board3dGeometry build Three.js objects at runtime inside
 * useMemo / buildTubeGroup. The Canvas mock (react-three/fiber/native) already
 * drops R3F children in tests, so these constructors only need to exist and
 * return plain objects — they are never actually rendered.
 */
const noop = () => undefined;
const vec3 = (x = 0, y = 0, z = 0) => ({ x, y, z, set: noop, copy: noop });

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
};

const Color = makeClass({ r: 0, g: 0, b: 0, set: noop });
const Group = class {
  constructor() { this.userData = {}; this.children = []; }
  add() {}
};
const Mesh = class {
  constructor() { this.userData = {}; this.position = vec3(); }
  /* position.set is called with spread args */
};
Object.defineProperty(Mesh.prototype, "position", {
  get() { return { set: noop }; },
});

const BoxGeometry = makeClass();
const TubeGeometry = makeClass();
const ConeGeometry = makeClass();
const CatmullRomCurve3 = makeClass();
const MeshStandardMaterial = makeClass();
const MeshBasicMaterial = makeClass();
const LineBasicMaterial = makeClass();

const AdditiveBlending = 2;

module.exports = {
  __esModule: true,
  Vector3,
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
  AdditiveBlending,
};
