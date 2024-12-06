import * as THREE from "three";
import { gsap } from "gsap";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export default class Teleporter {
  constructor(scene) {
    this.scene = scene;
    this.scale = 0.62;
    this.teleporterPosition = new THREE.Vector3(-6.66, 1.6, -2.4);
    this.teleporterScale = new THREE.Vector3(
      this.scale,
      this.scale,
      this.scale
    );
    this.teleporterMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });

    this.portals = [];
    this.maxPortals = 2;
    this.continue = true;

    this.loadOBJModel("./models/teleporter2.obj")
      .then((objMesh) => {
        this.teleporterMesh = objMesh;
        this.teleporterMesh.material = this.teleporterMaterial;
        this.teleporterMesh.castShadow = true;
        this.teleporterMesh.receiveShadow = true;
        this.teleporterMesh.position.copy(this.teleporterPosition);
        this.teleporterMesh.scale.copy(this.teleporterScale);
        this.scene.add(this.teleporterMesh);

        // Start idle animation only after teleporterMesh is ready
        this.startIdle();
      })
      .catch((error) => {
        console.error("Error loading teleporter OBJ model:", error);
      });
  }

  loadOBJModel(modelPath) {
    const loader = new OBJLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        modelPath,
        (object) => {
          object.traverse((child) => {
            if (child.isMesh) {
              if (child.name.includes("Ico")) {
                // Apply emissive material to the mesh containing "ico" in its name
                child.material = new THREE.MeshPhysicalMaterial({
                  color: 0xffffff,
                  roughness: 0.2,
                  metalness: 0.0,
                  emissive: 0xffffff,
                  emissiveIntensity: 5.0,
                });
              } else {
                // Apply default material to other meshes
                child.material = this.teleporterMaterial;
              }
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          resolve(object);
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  createPortal(position) {
    // Create a new portal
    const portalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 5.0, // Initial intensity
      opacity: 1.0,
      transparent: true,
    });

    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.02, 16, 32),
      portalMaterial
    );

    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 1.0,
        transparent: true,
        side: THREE.DoubleSide,
      })
    );

    circle.castShadow = true;
    circle.receiveShadow = true;
    portal.add(circle);

    // Cast shadow and receive shadow
    portal.castShadow = true;
    portal.receiveShadow = true;
    portal.position.copy(position);
    portal.rotation.x = Math.PI / 2;
    portal.scale.set(0.0, 0.0, 0.0);
    this.scene.add(portal);

    // Add the new portal to the array
    this.portals.push(portal);

    // Flickering emissive intensity using GSAP
    gsap.to(portalMaterial, {
      emissiveIntensity: 30.0, // Max intensity
      duration: 0.1,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    // If there are more than the allowed number of portals, shrink and remove the oldest
    if (this.portals.length > this.maxPortals) {
      const oldestPortal = this.portals.shift();

      // Shrink animation before removing the portal
      gsap.to(oldestPortal.scale, {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => {
          // Remove the portal from the scene
          this.scene.remove(oldestPortal);
          // Dispose of the geometry and material
          oldestPortal.geometry.dispose();
          oldestPortal.material.dispose();
        },
      });
    }
  }

  createFirstPortal() {
    this.createPortal(this.teleporterPosition);
    const firstPortal = this.portals[this.portals.length - 1];
    gsap.to(firstPortal.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 1.0,
      ease: "power2.out",
    });
  }

  async startTeleporting() {
    const randomPosition = this.getRandomPosition();

    this.createPortal(randomPosition);
    const secondPortal = this.portals[this.portals.length - 1];
    await gsap.to(secondPortal.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.5,
      ease: "power2.out",
      onStart: () => {
        gsap.to(this.teleporterMesh.position, {
          y: "+=0.5",
          duration: 0.5,
          ease: "power2.in",
        });
      },
    });

    await gsap.to(this.teleporterMesh.position, {
      y: "-=0.5",
      duration: 0.5,
      ease: "power2.inOut",
      onStart: () => {
        gsap.to(this.teleporterMesh.scale, {
          x: 0.0,
          y: 0.0,
          z: 0.0,
          duration: 0.5,
          ease: "power2.in",
        });
      },
    });

    this.teleporterMesh.position.copy(randomPosition);
    await gsap.to(this.teleporterMesh.scale, {
      x: this.scale,
      y: this.scale,
      z: this.scale,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        if (this.continue === true) {
          this.startTeleporting();
        } else {
          console.log("Teleportation stopped");
          this.stopTeleporting();
        }
      },
    });
  }

  async stopTeleporting() {
    this.createPortal(this.teleporterPosition);
    const firstPortal = this.portals[this.portals.length - 1];
    await gsap.to(firstPortal.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.5,
      ease: "power2.out",
    });

    await gsap.to(this.teleporterMesh.position, {
      y: "+=0.5",
      duration: 0.5,
      ease: "power2.in",
    });

    await gsap.to(this.teleporterMesh.position, {
      y: "-=0.5",
      duration: 0.5,
      ease: "power2.inOut",
      onStart: () => {
        gsap.to(this.teleporterMesh.scale, {
          x: 0.0,
          y: 0.0,
          z: 0.0,
          duration: 0.5,
          ease: "power2.in",
        });
      },
    });

    this.teleporterMesh.position.copy(this.teleporterPosition);
    await gsap.to(this.teleporterMesh.scale, {
      x: this.scale,
      y: this.scale,
      z: this.scale,
      duration: 0.5,
      ease: "power2.out",
    });

    this.portals.forEach((portal) => {
      gsap.to(portal.scale, {
        x: 0.0,
        y: 0.0,
        z: 0.0,
        duration: 1.0,
        ease: "power2.out",
        onComplete: () => {
          this.scene.remove(portal);
          portal.geometry.dispose();
          portal.material.dispose();
        },
      });
    });

    this.startIdle();
  }

  getRandomPosition() {
    return new THREE.Vector3(
      THREE.MathUtils.randFloat(-5, 5),
      THREE.MathUtils.randFloat(3, 4),
      THREE.MathUtils.randFloat(-5, 5)
    );
  }

  startIdle() {
    if (!this.teleporterMesh) {
      console.warn("Teleporter mesh is not initialized yet.");
      return;
    }

    this.isIdle = true;
    this.teleporterMesh.position.y = this.teleporterPosition.y;

    gsap.to(this.teleporterMesh.position, {
      x: this.teleporterPosition.x,
      z: this.teleporterPosition.z,
      duration: 0.5,
      ease: "power2.inOut",
    });

    this.idleAnimation = gsap.to(this.teleporterMesh.position, {
      y: "+=0.3",
      duration: 2.0,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  stopIdle() {
    this.isIdle = false;
    if (this.idleAnimation) this.idleAnimation.kill();

    gsap.to(this.teleporterMesh.position, {
      y: this.teleporterPosition.y + 0.3,
      duration: 0.5,
      ease: "power2.inOut",
    });
  }

  rotateTeleporter(delta) {
    if (this.teleporterMesh) {
      this.teleporterMesh.rotation.y += delta;
      this.teleporterMesh.rotation.x += delta;
      this.teleporterMesh.rotation.z += delta;
    }
  }
}
