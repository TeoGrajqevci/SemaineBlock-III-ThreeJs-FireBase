// buttons.js

import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import FirebaseConfig from "./FirebaseConfig.js";

export default class Buttons {
  constructor(params) {
    this.targetDescriptors = params.targetDescriptors;
    this.object = new THREE.Group();
    this.buttons = {};
    // this.loadButtons();
    console.log(this.targetDescriptors);
  }

  loadButtons() {
    const loader = new OBJLoader();
    loader.load(
      "./models/buttons.obj",
      (object) => {
        object.position.set(0, 0, 0);
        object.rotation.set(0, -Math.PI / 2, 0);

        object.traverse((child) => {
          if (child.isMesh) {
            if (/^button0[1-6]$/.test(child.name)) {
              // Use a material that supports color changes
              child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
              });
              const num = child.name.slice(-1);
              const id = this.targetDescriptors.OTHERS[num - 1].uid;
              this.buttons[child.name] = {
                mesh: child,
                state: "up",
                id: id,
                defaultPositionY: child.position.y,
              };
              child.castShadow = true;
              child.receiveShadow = true;
            }
          }
        });

        this.object.add(object);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error occurred while loading buttons.obj", error);
      }
    );
  }

  initListeners() {
    // this.interaction = new Interaction(this.camera, this.scene, this.buttons, onButtonClick);
  }

  onButtonClick() {
    console.log("Button clicked");
  }

  setPosition(buttonId, position) {
    const button = this.buttons[buttonId];
    if (button) {
      button.mesh.position.copy(position);
    } else {
      console.warn(`Button ${buttonId} not found`);
    }
  }

  getButton(buttonId) {
    return this.buttons[buttonId];
  }

  getObject() {
    return this.object;
  }

  togglePress(id, state) {
    console.log(id, state);
    FirebaseConfig.sendData(FirebaseConfig.DEFAULT_PATH + "/" + id, {
      target: id,
      name: FirebaseConfig.NAME,
      date: Date.now(),
      position: state,
    });
  }
}
