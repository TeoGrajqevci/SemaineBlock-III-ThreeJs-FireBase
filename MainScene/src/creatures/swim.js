import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { gsap } from "gsap";

export default class Swim {
  constructor(scene) {
    this.scene = scene;
    this.swimerPosition = new THREE.Vector3(-2.92, 1.0, 6.3);
    this.swimerScale = new THREE.Vector3(0.003, 0.003, 0.003);
    this.swimerMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffffff,
      emissive: new THREE.Color(0xf27aff), // Pink emission
      emissiveIntensity: 0.2,
      metalness: 0.0,
      roughness: 0.0,
    });

    this.bounds = {
      x: { min: -5, max: 5 },
      y: { min: 2, max: 5 },
      z: { min: -5, max: 5 },
    };

    this.fixedDistance = 10;
    this.targetPosition = new THREE.Vector3();

    this.continue = true;

    this.loadSwimFBX("./models/Swim1.fbx")
      .then((object) => {
        this.swimerMesh = object;
        this.swimerMesh.material = this.swimerMaterial;
        this.swimerMesh.castShadow = true;
        this.swimerMesh.receiveShadow = true;
        this.swimerMesh.position.copy(this.swimerPosition);
        this.swimerMesh.rotation.y = Math.PI / 2;
        this.swimerMesh.scale.copy(this.swimerScale);
        this.scene.add(this.swimerMesh);

        this.idle();
      })
      .catch((error) => {
        console.error("Error loading Swim FBX model:", error);
      });
  }

  loadSwimFBX(modelPath) {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(
        modelPath,
        (object) => {
          object.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.material = this.swimerMaterial;
            }
          });
          resolve(object);
        },
        (xhr) => {
          console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (error) => {
          console.error("An error occurred while loading Swim.fbx", error);
          reject(error);
        }
      );
    });
  }

  startSwiming() {
    let validPosition = false;

    while (!validPosition) {
      if (!this.continue) {
        console.log("Swiming stopped");
        break;
      }
      const randomDirection = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      const movementVector = randomDirection.multiplyScalar(this.fixedDistance);

      const newPosition = this.swimerMesh.position.clone().add(movementVector);

      if (
        newPosition.x >= this.bounds.x.min &&
        newPosition.x <= this.bounds.x.max &&
        newPosition.y >= this.bounds.y.min &&
        newPosition.y <= this.bounds.y.max &&
        newPosition.z >= this.bounds.z.min &&
        newPosition.z <= this.bounds.z.max
      ) {
        validPosition = true;
        this.targetPosition = newPosition;

        console.log("Swiming to", this.targetPosition);
      }
    }

    const direction = this.targetPosition
      .clone()
      .sub(this.swimerMesh.position)
      .normalize();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );

    gsap.to(this.swimerMesh.quaternion, {
      duration: 0.55,
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w,
      onComplete: () => {
        gsap.to(this.swimerMesh.position, {
          x: this.targetPosition.x,
          y: this.targetPosition.y,
          z: this.targetPosition.z,
          duration: 2.0,
          ease: "sine.inOut",
          onComplete: () => {
            if (this.continue) {
              this.startSwiming();
            } else {
              console.log("Swiming stopped");
              this.stopSwiming();
            }
          },
        });
      },
    });
  }

  stopSwiming() {
    this.continue = false;

    this.targetPosition = this.swimerPosition;
    const direction = this.targetPosition
      .clone()
      .sub(this.swimerMesh.position)
      .normalize();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );

    gsap.to(this.swimerMesh.quaternion, {
      duration: 0.5,
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w,
      onComplete: () => {
        gsap.to(this.swimerMesh.position, {
          x: this.swimerPosition.x,
          y: this.swimerPosition.y,
          z: this.swimerPosition.z,
          duration: 2.0,
          ease: "sine.inOut",
          onComplete: () => {
            gsap.to(this.swimerMesh.quaternion, {
              duration: 0.5,
              x: 0,
              y: 0,
              z: 0,
              w: 1,
            });
            this.stopFBXAnim();
            this.idle();
          },
        });
      },
    });
  }

  idle() {
    if (this.swimerMesh) {
      gsap.to(this.swimerMesh.position, {
        y: "+=0.3",
        yoyo: true,
        repeat: -1,
        duration: 2,
        ease: "sine.inOut",
      });

      gsap.to(this.swimerMesh.rotation, {
        y: `+=${Math.PI / 2}`,
        yoyo: true,
        repeat: -1,
        duration: 2,
        ease: "sine.inOut",
      });
    }
  }

  stopIdle() {
    gsap.killTweensOf(this.swimerMesh.position);
    gsap.killTweensOf(this.swimerMesh.rotation);
    this.swimerMesh.position.y = this.swimerPosition.y;
  }

  playFBXAnim() {
    if (
      this.swimerMesh &&
      this.swimerMesh.animations &&
      this.swimerMesh.animations.length > 0
    ) {
      this.mixer = new THREE.AnimationMixer(this.swimerMesh);
      const action = this.mixer.clipAction(this.swimerMesh.animations[0]);
      action.play();
    } else {
      console.error("No animations found in the FBX model.");
    }
    this.animateMaterial();
  }

  stopFBXAnim() {
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    this.stopAnimateMaterial();
  }

  loop(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  animateMaterial() {
    gsap.to(this.swimerMaterial, {
      duration: 1.18,
      emissiveIntensity: 10,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  stopAnimateMaterial() {
    gsap.killTweensOf(this.swimerMaterial);
    this.swimerMaterial.emissiveIntensity = 0.2;
  }
}
