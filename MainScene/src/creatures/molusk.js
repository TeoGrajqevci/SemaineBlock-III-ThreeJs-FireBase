import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { gsap } from "gsap";

export default class Molusk {
  // this.geometry
  // this.material
  // this.mesh

  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.t = 0;
    this.mouse = new THREE.Vector2();

    // 3 STATES; IDLE, OUTSIDE, LOOP, INSIDE
    this.state = "IDLE";
    this.previousState = "IDLE";

    this.control = new TransformControls(this.camera, this.renderer.domElement);

    this.loadFBX();
    this.addEventListeners();
  }

  loadFBX() {
    const loader = new FBXLoader();
    loader.load(
      "models/MOLUSK_2.fbx",
      (object) => {
        // object.position.set(3, 0.5, -6.6);
        // object.rotation.set(0, 10, 0);
        object.scale.set(0.01, 0.01, 0.01);
        object.rotation.set(0, -Math.PI / 2, 0);

        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.mesh = object;

        // add chrome material
        const emissiveColor = new THREE.Color(0xffa724);
        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: emissiveColor,
          emissiveIntensity: 0.4,
          metalness: 0,
          roughness: 0.0,
        });

        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = material; // Apply the material
          }
        });

        this.scene.add(this.mesh);

        this.idleAnim();

        // Animated FBX
        this.mesh.animations = object.animations;
        console.log(this.mesh.animations);
        this.mixer = new THREE.AnimationMixer(this.mesh);

        // for each mesh.animations, create a new animation and set it to loop once
        this.animation = [];
        for (let i = 0; i < this.mesh.animations.length; i++) {
          let anim = this.mixer.clipAction(this.mesh.animations[i]);
          this.animation.push(anim);
          anim.setLoop(THREE.LoopOnce);
        }

        // this.animation = this.mixer.clipAction(this.mesh.animations[0]);
        // this.animation = this.mixer.clipAction(this.mesh.animations[1]);
        // this.animation = this.mixer.clipAction(this.mesh.animations[2]);
        // this.animation.setLoop(THREE.LoopOnce);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error(
          `An error occurred while loading the OBJ from path`,
          error
        );
      }
    );
  }

  addEventListeners() {
    window.addEventListener("click", this.onClickHandler.bind(this));
    this.control.addEventListener(
      "dragging-changed",
      this.controlEvent.bind(this)
    );
  }

  controlEvent(event) {
    if (!event.value) {
      this.updatePath();
    }
  }

  onClickHandler(ev) {
    this.mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  }

  spawnAnim() {
    // stop animation if it exists
    if (this.anim) this.anim.kill();

    // position 0
    gsap.to(this.mesh.position, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.3,
      ease: "sine.inOut",
      onComplete: () => {
        for (let i = 0; i < this.animation.length; i++) {
          // restart animations
          this.animation[i].reset();
          this.mixer.clipAction(this.mesh.animations[i]).play();
        }

        console.log("animation started");

        setTimeout(() => {
          this.mixer.addEventListener("finished", () => {
            this.idleAnim();
          });
        }, 500);
      },
    });
  }

  idleAnim() {
    // stop animation if it exists
    if (this.anim) this.anim.kill();

    // animate the movement in the y axis of the mesh
    // go from y 1.5 to y 1.8

    // make linked array with positions and rotations of this.mesh

    this.anim = gsap.fromTo(
      this.mesh.position,
      {
        y: 0,
        x: 0,
        z: 0,
      },
      {
        y: 0.3,
        duration: 2,
        delay: 0,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }
    );
  }

  rotateAnim() {
    // rotate the mesh
    gsap.to(this.mesh.rotation, {
      y: Math.PI * 2,
      z: -Math.PI * 2,
      duration: 4,
      ease: "linear",
      yoyo: true,
      repeat: -1,
    });
  }

  update(delta) {
    if (this.mixer) this.mixer.update(delta);
  }
}
