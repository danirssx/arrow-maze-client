import { pickArrowId } from "@/presentation/components/board3d/BoardView3D";
import * as THREE from "three";

// Subject to human review — unit test for raycast tap-picking logic

// Minimal camera stub — pickArrowId passes it to raycaster.setFromCamera()
const camera = { isCamera: true } as unknown as THREE.Camera;
// Minimal scene stub — pickArrowId passes it to raycaster.intersectObject()
const scene = { isObject3D: true } as unknown as THREE.Object3D;

function meshWithArrowId(id: string): THREE.Object3D {
  return { userData: { arrowId: id }, parent: null } as unknown as THREE.Object3D;
}

function meshWithParent(parentId: string): THREE.Object3D {
  const parent = { userData: { arrowId: parentId }, parent: null } as unknown as THREE.Object3D;
  return { userData: {}, parent } as unknown as THREE.Object3D;
}

function meshWithNoId(): THREE.Object3D {
  return { userData: {}, parent: null } as unknown as THREE.Object3D;
}

describe("pickArrowId", () => {
  afterEach(() => jest.restoreAllMocks());

  it("should_return_null_when_ray_misses_all_objects", () => {
    jest.spyOn(THREE.Raycaster.prototype, "intersectObject").mockReturnValue([]);
    expect(pickArrowId(camera, scene, 100, 100, 50, 50)).toBeNull();
  });

  it("should_return_arrowId_from_directly_hit_mesh_userData", () => {
    const mesh = meshWithArrowId("arrow-42");
    jest.spyOn(THREE.Raycaster.prototype, "intersectObject").mockReturnValue([
      { object: mesh, distance: 5 } as THREE.Intersection,
    ]);
    expect(pickArrowId(camera, scene, 100, 100, 50, 50)).toBe("arrow-42");
  });

  it("should_walk_up_to_parent_group_to_find_arrowId", () => {
    const child = meshWithParent("arrow-group");
    jest.spyOn(THREE.Raycaster.prototype, "intersectObject").mockReturnValue([
      { object: child, distance: 3 } as THREE.Intersection,
    ]);
    expect(pickArrowId(camera, scene, 100, 100, 50, 50)).toBe("arrow-group");
  });

  it("should_return_null_when_no_ancestor_has_arrowId", () => {
    const mesh = meshWithNoId();
    jest.spyOn(THREE.Raycaster.prototype, "intersectObject").mockReturnValue([
      { object: mesh, distance: 3 } as THREE.Intersection,
    ]);
    expect(pickArrowId(camera, scene, 100, 100, 50, 50)).toBeNull();
  });

  it("should_return_the_closest_hit_arrowId_when_multiple_meshes_overlap", () => {
    const near = meshWithArrowId("near-arrow");
    const far = meshWithArrowId("far-arrow");
    jest.spyOn(THREE.Raycaster.prototype, "intersectObject").mockReturnValue([
      { object: near, distance: 2 } as THREE.Intersection,
      { object: far, distance: 8 } as THREE.Intersection,
    ]);
    expect(pickArrowId(camera, scene, 100, 100, 50, 50)).toBe("near-arrow");
  });
});
