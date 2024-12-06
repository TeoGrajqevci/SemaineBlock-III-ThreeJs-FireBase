import * as THREE from "three";

export default function inputInteractionsManager(props) {
  const cam = props.camera;
  const scene = props.scene;
  const targets = props.targets;
  const _callback = props._callback;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function init() {
    addEventListener();
  }

  function addEventListener() {
    window.addEventListener("click", onClickHandler);
  }

  function onClickHandler(ev) {
    mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    rayCastHandler();
  }

  function rayCastHandler() {
    raycaster.setFromCamera(mouse, cam);
    const meshes = targets.map((target) => target.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      hasIntersects(intersects);
    }
  }

  function hasIntersects(intersects) {
    const buttonMesh = intersects[0].object;
    let targetObjIntersect = null;
    for (let i = 0; i < targets.length; i++) {
      if (buttonMesh.uuid === targets[i].mesh.uuid) {
        targetObjIntersect = targets[i];
        break;
      }
    }
    if (targetObjIntersect) {
      _callback(targetObjIntersect.id);
    } else {
      console.error("No target object found");
    }
    // CHeck to have the interesect
  }

  init();
}
