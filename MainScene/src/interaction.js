import * as THREE from "three";
import { gsap } from "gsap";

export default class Interaction {
  constructor(camera, scene, buttons, onButtonClick, targetDescriptors) {
    this.camera = camera;
    this.scene = scene;
    this.buttons = buttons;
    this.targetDescriptors = targetDescriptors;
    this.onButtonClick = onButtonClick; // Accept callback function
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.addEventListeners();
  }

  addEventListeners() {
    window.addEventListener("click", this.onMouseClick.bind(this), false);
  }
  ut;
  onMouseClick(event) {
    // Convert mouse coordinates to normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all button meshes

    const buttonMeshes = Object.values(this.buttons.buttons).map(
      (button) => button.mesh
    );
    const intersects = this.raycaster.intersectObjects(buttonMeshes, true);

    if (intersects.length > 0) {
      const buttonMesh = intersects[0].object;
      const buttonId = buttonMesh.name;
      const button = this.buttons.getButton(buttonId);
      const num = buttonId.slice(-1);

      const id = this.targetDescriptors.OTHERS[num - 1].uid;

      if (button) {
        this.toggleButton(button);

        // Invoke the callback function with button ID and state
        if (this.onButtonClick) {
          this.onButtonClick(id, button.state);
        }
      }
    }
  }

  toggleButton(button) {
    if (button.state === "up") {
      this.animateButton(button, "down");
      button.state = "down";
    } else {
      this.animateButton(button, "up");
      button.state = "up";
    }
  }

  animateButton(button, direction) {
    const deltaY = 0.2;
    const targetY =
      direction === "down"
        ? button.defaultPositionY - deltaY
        : button.defaultPositionY;

    // Animate the button's Y position
    gsap.to(button.mesh.position, {
      y: targetY,
      duration: 0.2,
    });
  }
}
